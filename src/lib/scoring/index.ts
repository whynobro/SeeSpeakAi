import type { AttemptScore, FrameFeatures, PracticeWord, SoundReading } from '@/lib/types';
import {
  BOUNDARY,
  CONFIDENCE_DISTANCE_WEIGHT,
  CONFIDENCE_FULL_DISTANCE,
  CONFIDENCE_FULL_HISS_MS,
  HISS_RATIO_MIN,
  HISS_REL_LEVEL,
  LIVE_MIN_LEVEL,
  MAX_GAP_FRAMES,
  MIN_HISS_MS,
  MIN_RECORDING_MS,
  MIN_SUSTAINED_MS,
  MIN_VOICED_MS,
  MISS_CONFIDENCE,
  NOISE_MIN_FRAMES,
  NOISE_QUIET_SHARE,
  NOISE_REL_LEVEL,
  ONSET_SKIP_MS,
  SILENCE_LEVEL,
  SH_CENTROID_HZ,
  S_CENTROID_HZ,
  SUSTAIN_REL_LEVEL,
  TOO_QUIET_LEVEL,
  VOICED_RATIO_MAX,
  VOICED_REL_LEVEL,
} from '@/lib/scoring/constants';

/** Things the scoring cannot do. The practice screen must show these honestly. */
export const LIMITATIONS: string[] = [
  'Only the "s" and "sh" sounds are scored. Other sounds are ignored.',
  'It checks that a hiss is there, where it is in the word, and which hiss it is. It does not check that the whole word was right.',
  'The limits were set on synthetic test sounds and a few voices, not on a clinical data set. Children and some voices may be scored wrongly.',
  'Background noise and different phone microphones change the result. A quiet room and holding the phone close work best.',
  'Voiced sounds, like the "z" at the end of "dogs", are not scored.',
  'This is a practice tool. It is not therapy and it is not a diagnosis.',
];

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/** Map a centroid in Hz to the meter: 0 is "sh", 1 is "s", straight line between the two anchors. */
function positionFromCentroid(centroidHz: number | null): number | null {
  if (centroidHz === null) return null;
  return clamp01((centroidHz - SH_CENTROID_HZ) / (S_CENTROID_HZ - SH_CENTROID_HZ));
}

/** Live meter: is this frame a hiss, and is it nearer "sh" (0) or "s" (1)? */
export function readFrame(frame: FrameFeatures): SoundReading {
  const hissing = frame.level >= LIVE_MIN_LEVEL && frame.hissRatio >= HISS_RATIO_MIN;
  return { hissing, position: hissing ? positionFromCentroid(frame.centroidHz) : null, level: frame.level };
}

/** A stretch of hiss frames, by index into the frames array. */
interface Run {
  start: number;
  end: number;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Time between frames, from the frames themselves (falls back to 10 ms for a single frame). */
function hopMsOf(frames: FrameFeatures[]): number {
  const diffs: number[] = [];
  for (let i = 1; i < frames.length; i++) diffs.push(frames[i].tMs - frames[i - 1].tMs);
  const hop = median(diffs);
  return hop > 0 ? hop : 10;
}

/** Group hiss frames into runs, bridging up to MAX_GAP_FRAMES non-hiss frames. */
function findRuns(isHiss: boolean[]): Run[] {
  const runs: Run[] = [];
  let current: Run | null = null;
  let gap = 0;
  for (let i = 0; i < isHiss.length; i++) {
    if (isHiss[i]) {
      if (current) current.end = i;
      else current = { start: i, end: i };
      gap = 0;
    } else if (current) {
      gap++;
      if (gap > MAX_GAP_FRAMES) {
        runs.push(current);
        current = null;
        gap = 0;
      }
    }
  }
  if (current) runs.push(current);
  return runs;
}

/** True when the quietest frames still hold a lot of hiss-like energy: the room itself is hissing. */
function roomIsNoisy(frames: FrameFeatures[], maxLevel: number): boolean {
  if (frames.length < NOISE_MIN_FRAMES) return false;
  const quietest = [...frames].sort((a, b) => a.level - b.level);
  const count = Math.max(1, Math.floor(frames.length * NOISE_QUIET_SHARE));
  const quiet = quietest.slice(0, count);
  const quietLevel = median(quiet.map((f) => f.level));
  const quietRatio = median(quiet.map((f) => f.hissRatio));
  return quietLevel >= NOISE_REL_LEVEL * maxLevel && quietRatio >= HISS_RATIO_MIN;
}

function missScore(word: PracticeWord, warnings: string[], confidence: number): AttemptScore {
  return {
    target: word.target,
    verdict: 'miss',
    heard: null,
    meterPosition: null,
    hissMs: 0,
    confidence,
    warnings,
  };
}

/** What the scoring found in a recording, shared by `scoreAttempt` and `describeRuns`. */
interface Analysis {
  hopMs: number;
  maxLevel: number;
  isHiss: boolean[];
  haveVowel: boolean;
  vowelStart: number;
  vowelEnd: number;
  runs: Run[];
}

function analyse(frames: FrameFeatures[]): Analysis {
  const maxLevel = Math.max(...frames.map((f) => f.level));
  const hopMs = hopMsOf(frames);
  // All loudness checks are relative to the loudest frame, so the mic gain does not matter.
  const hissFloor = Math.max(SILENCE_LEVEL, HISS_REL_LEVEL * maxLevel);
  const voicedFloor = Math.max(SILENCE_LEVEL, VOICED_REL_LEVEL * maxLevel);
  const isHiss = frames.map((f) => f.level >= hissFloor && f.hissRatio >= HISS_RATIO_MIN);
  const voicedIdx: number[] = [];
  frames.forEach((f, i) => {
    if (f.level >= voicedFloor && f.hissRatio <= VOICED_RATIO_MAX) voicedIdx.push(i);
  });
  // The vowel: need enough voiced frames to trust it.
  const haveVowel = voicedIdx.length * hopMs >= MIN_VOICED_MS;
  return {
    hopMs,
    maxLevel,
    isHiss,
    haveVowel,
    vowelStart: haveVowel ? voicedIdx[0] : -1,
    vowelEnd: haveVowel ? voicedIdx[voicedIdx.length - 1] : -1,
    runs: findRuns(isHiss),
  };
}

function runLengthMs(frames: FrameFeatures[], r: Run, hopMs: number): number {
  return frames[r.end].tMs - frames[r.start].tMs + hopMs;
}

/**
 * How many ms of a run hold their level. The first ONSET_SKIP_MS are skipped (the burst of a stop), then
 * frames count when they are at least SUSTAIN_REL_LEVEL of the loudest frame left. A stop release fades,
 * so little of it counts. A real "s" keeps its level, so most of it counts.
 */
function sustainedMsOf(frames: FrameFeatures[], r: Run, hopMs: number): number {
  const from = frames[r.start].tMs + ONSET_SKIP_MS;
  const levels: number[] = [];
  for (let i = r.start; i <= r.end; i++) if (frames[i].tMs >= from) levels.push(frames[i].level);
  if (levels.length === 0) return 0;
  const peak = Math.max(...levels);
  return levels.filter((l) => l >= SUSTAIN_REL_LEVEL * peak).length * hopMs;
}

function placedOk(a: Analysis, r: Run, word: PracticeWord): boolean {
  if (!a.haveVowel) return true; // cannot place it, so accept any (a warning is added by the caller)
  if (word.position === 'start') return r.end < a.vowelStart;
  if (word.position === 'end') return r.start > a.vowelEnd;
  return r.start > a.vowelStart && r.end < a.vowelEnd; // middle: between voiced parts
}

function meanOf(values: number[]): number | null {
  return values.length === 0 ? null : values.reduce((x, y) => x + y, 0) / values.length;
}

/** One hiss run, with the numbers and the rule results, for the /lab page. */
export interface RunInfo {
  startMs: number;
  lengthMs: number;
  meanCentroidHz: number | null;
  meanPosition: number | null;
  peakLevel: number;
  sustainedMs: number;
  /** Rule results. `inPlace` is null when no word was given. */
  passed: { longEnough: boolean; held: boolean; inPlace: boolean | null };
}

/** List every hiss run found in a recording, with what each rule said. Pass a word to check placement. */
export function describeRuns(frames: FrameFeatures[], word?: PracticeWord): RunInfo[] {
  if (frames.length === 0) return [];
  const a = analyse(frames);
  return a.runs.map((r) => {
    const own: FrameFeatures[] = [];
    for (let i = r.start; i <= r.end; i++) if (a.isHiss[i]) own.push(frames[i]);
    const lengthMs = runLengthMs(frames, r, a.hopMs);
    const sustainedMs = sustainedMsOf(frames, r, a.hopMs);
    return {
      startMs: frames[r.start].tMs,
      lengthMs,
      meanCentroidHz: meanOf(own.flatMap((f) => (f.centroidHz === null ? [] : [f.centroidHz]))),
      meanPosition: meanOf(own.flatMap((f) => positionFromCentroid(f.centroidHz) ?? [])),
      peakLevel: Math.max(...own.map((f) => f.level)),
      sustainedMs,
      passed: {
        longEnough: lengthMs >= MIN_HISS_MS,
        held: sustainedMs >= MIN_SUSTAINED_MS,
        inPlace: word ? placedOk(a, r, word) : null,
      },
    };
  });
}

/** Score one spoken word: was the target sound there, in the right place? */
export function scoreAttempt(frames: FrameFeatures[], word: PracticeWord): AttemptScore {
  const warnings: string[] = [];
  if (frames.length === 0) {
    return missScore(word, ['Nothing was recorded. Check that the microphone is allowed and try again.'], 0);
  }

  const maxLevel = Math.max(...frames.map((f) => f.level));
  if (maxLevel < SILENCE_LEVEL) {
    return missScore(word, ['I could not hear anything. Move closer to the microphone and try again.'], 0);
  }
  if (maxLevel < TOO_QUIET_LEVEL)
    warnings.push('The recording was very quiet. Try holding the phone closer.');

  const hopMs0 = hopMsOf(frames);
  const totalMs = frames[frames.length - 1].tMs - frames[0].tMs + hopMs0;
  if (totalMs < MIN_RECORDING_MS)
    warnings.push('The recording was very short. Say the whole word and try again.');
  if (roomIsNoisy(frames, maxLevel)) {
    warnings.push('The room seems noisy, so the result may be wrong. Try somewhere quieter.');
  }

  const a = analyse(frames);
  const { hopMs, isHiss } = a;
  if (!a.haveVowel) {
    warnings.push('I could not find the vowel, so I could not check where in the word the hiss was.');
  }

  const long = a.runs.filter((r) => runLengthMs(frames, r, hopMs) >= MIN_HISS_MS);
  const inPlace = long.filter((r) => placedOk(a, r, word));
  // A hiss that fades away is the puff after a "t" or "k", not an "s" or "sh": it must hold its level.
  const held = inPlace.filter((r) => sustainedMsOf(frames, r, hopMs) >= MIN_SUSTAINED_MS);
  if (inPlace.length > 0 && held.length === 0) {
    warnings.push('That sounded like a short burst, not a held hiss. Hold the hiss longer.');
  }

  if (held.length === 0) return missScore(word, warnings, MISS_CONFIDENCE);

  // If several runs qualify, the longest one is the most likely to be the real sound.
  const run = held.reduce((best, r) =>
    runLengthMs(frames, r, hopMs) > runLengthMs(frames, best, hopMs) ? r : best,
  );
  const positions: number[] = [];
  for (let i = run.start; i <= run.end; i++) {
    if (!isHiss[i]) continue;
    const p = positionFromCentroid(frames[i].centroidHz);
    if (p !== null) positions.push(p);
  }
  if (positions.length === 0) return missScore(word, warnings, MISS_CONFIDENCE);

  const meterPosition = positions.reduce((a, b) => a + b, 0) / positions.length;
  const heardSound = meterPosition >= BOUNDARY ? 's' : 'sh';
  const hissMs = runLengthMs(frames, run, hopMs);
  const distanceTerm = Math.min(1, Math.abs(meterPosition - BOUNDARY) / CONFIDENCE_FULL_DISTANCE);
  const lengthTerm = Math.min(1, hissMs / CONFIDENCE_FULL_HISS_MS);
  const confidence = clamp01(
    CONFIDENCE_DISTANCE_WEIGHT * distanceTerm + (1 - CONFIDENCE_DISTANCE_WEIGHT) * lengthTerm,
  );

  const hit = heardSound === word.target;
  return {
    target: word.target,
    verdict: hit ? 'hit' : 'close',
    heard: hit ? word.target : heardSound,
    meterPosition,
    hissMs,
    confidence,
    warnings,
  };
}
