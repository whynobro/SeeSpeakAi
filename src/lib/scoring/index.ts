import type { AttemptScore, FrameFeatures, PracticeWord, SoundReading, TargetSound } from '@/lib/types';
import {
  BOUNDARY,
  CH_BURST_FULL_FACTOR,
  CH_BURST_RATIO,
  CH_MAX_HISS_MS,
  CH_MIN_HISS_MS,
  CH_ONSET_MS,
  CONFIDENCE_DISTANCE_WEIGHT,
  CONFIDENCE_FULL_DISTANCE,
  CONFIDENCE_FULL_HISS_MS,
  HISS_RATIO_MIN,
  HISS_REL_LEVEL,
  LISP_FLATNESS_MIN,
  LISP_HISS_TO_VOWEL_MAX,
  LISP_METER_POSITION,
  MAX_VOWEL_GAP_MS,
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
  S_FOCUS_FLATNESS_MAX,
  TOO_QUIET_LEVEL,
  VOICED_RATIO_MAX,
  VOICED_REL_LEVEL,
  VOICING_FRAME_MIN,
  Z_HISS_RATIO_MIN,
  Z_VOICED_CENTROID_MIN_HZ,
  Z_VOICED_HISS_RATIO_MIN,
  Z_VOICED_SHARE_MIN,
  SHAPE_MISS_CONFIDENCE,
} from '@/lib/scoring/constants';
import { SHAPE_WARNING, shapeProblem } from '@/lib/scoring/shape';

export { SHAPE_WARNING } from '@/lib/scoring/shape';

/** Things the scoring cannot do. The practice screen must show these honestly. */
export const LIMITATIONS: string[] = [
  'Only the "s", "sh", "z" and "ch" sounds are scored. Other sounds are ignored.',
  'It checks that a hiss is there, where it is in the word, and which hiss it is. It only checks the rough shape of the word (a vowel, not too many beats). It does not recognise words.',
  'The limits were set on synthetic test sounds and a few voices, not on a clinical data set. Children and some voices may be scored wrongly. Lisp detection is new and may miss a lisp.',
  'Background noise and different phone microphones change the result. A quiet room and holding the phone close work best.',
  'The "z" and "ch" limits were set on synthetic sounds only and still need real voices. A "z" that is partly unvoiced, as at the end of "dogs", may read as "s".',
  'This is a practice tool. It is not therapy and it is not a diagnosis.',
];

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/** Map a centroid in Hz to the meter: 0 is "sh", 1 is "s", straight line between the two anchors. */
export function positionFromCentroid(centroidHz: number | null): number | null {
  if (centroidHz === null) return null;
  return clamp01((centroidHz - SH_CENTROID_HZ) / (S_CENTROID_HZ - SH_CENTROID_HZ));
}

/**
 * The one hiss rule, shared by the live meter and the verdict so they agree: mostly high-pitched energy,
 * and loud enough next to `peakLevel` (the loudest frame of the recording, or so far while live).
 */
export function isHissFrame(frame: FrameFeatures, peakLevel: number, hissRatioMin = HISS_RATIO_MIN): boolean {
  const floor = Math.max(SILENCE_LEVEL, HISS_REL_LEVEL * peakLevel);
  return frame.level >= floor && frame.hissRatio >= hissRatioMin;
}

/**
 * "z" only: voiced frication. The buzz of the voice puts most of the energy under 2 kHz, so the plain
 * hiss share can be far below the bar, but the centroid in the 1.5 to 10 kHz band stays high (a vowel's
 * does not). `voicing` is missing in old logged frames: then the centroid check alone decides.
 */
export function isVoicedHissFrame(frame: FrameFeatures, peakLevel: number): boolean {
  const floor = Math.max(SILENCE_LEVEL, VOICED_REL_LEVEL * peakLevel);
  return (
    frame.level >= floor &&
    frame.hissRatio >= Z_VOICED_HISS_RATIO_MIN &&
    frame.centroidHz !== null &&
    frame.centroidHz >= Z_VOICED_CENTROID_MIN_HZ &&
    (frame.voicing ?? 1) >= VOICING_FRAME_MIN
  );
}

/**
 * The lisp rule, shared by the live meter and the verdict: an "s"-side hiss that is weak next to the vowel
 * (`hissLevel` under LISP_HISS_TO_VOWEL_MAX of `vowelLevel`) AND flat (no strong peak). Frames saved before
 * flatness was measured never count as a lisp.
 */
export function isLispLike(
  position: number | null,
  flatness: number | undefined,
  hissLevel: number,
  vowelLevel: number,
): boolean {
  if (position === null || position < BOUNDARY || flatness === undefined) return false;
  return vowelLevel > 0 && hissLevel < LISP_HISS_TO_VOWEL_MAX * vowelLevel && flatness >= LISP_FLATNESS_MIN;
}

/**
 * The focus rule ("s" only): a hiss whose typical flatness is above S_FOCUS_FLATNESS_MAX is slushy, spread
 * out instead of a thin line of air, so it is not a clear "s" even when it is loud. Judged on a whole run
 * (single frames of a clear "s" can read flatter), so the live meter does not use it. Frames saved without
 * flatness never count.
 */
export function isSlushyHiss(flatness: number | undefined): boolean {
  return flatness !== undefined && flatness > S_FOCUS_FLATNESS_MAX;
}

/**
 * Live meter: is this frame a hiss, and is it nearer "sh" (0) or "s" (1)? Pass the loudest level heard so
 * far in this try, so a quiet mic is judged the same way the final verdict judges it. A weak, flat "s"-side
 * frame (a lisp, see `isLispLike`, with the loudest frame so far standing in for the vowel) is never placed
 * in the "s" zone: it reads `lisp: true` at LISP_METER_POSITION.
 */
export function readFrame(frame: FrameFeatures, peakLevel = frame.level): SoundReading {
  const peak = Math.max(peakLevel, frame.level);
  const hissing = isHissFrame(frame, peak);
  const position = hissing ? positionFromCentroid(frame.centroidHz) : null;
  if (hissing && isLispLike(position, frame.flatness, frame.level, peak)) {
    return { hissing, position: LISP_METER_POSITION, level: frame.level, lisp: true };
  }
  return { hissing, position, level: frame.level };
}

/** A stretch of hiss frames, by index into the frames array. */
export interface Run {
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
export interface Analysis {
  hopMs: number;
  maxLevel: number;
  isHiss: boolean[];
  haveVowel: boolean;
  vowelStart: number;
  vowelEnd: number;
  /** Stretches of voiced frames at least MIN_VOICED_MS long. A lone click or thud is not one. */
  vowels: Run[];
  runs: Run[];
}

/** `target` only matters for "z": its buzz lowers the hiss share, so it gets a lower bar (Z_HISS_RATIO_MIN). */
export function analyse(frames: FrameFeatures[], target?: TargetSound): Analysis {
  const maxLevel = Math.max(...frames.map((f) => f.level));
  const hopMs = hopMsOf(frames);
  // All loudness checks are relative to the loudest frame, so the mic gain does not matter.
  const voicedFloor = Math.max(SILENCE_LEVEL, VOICED_REL_LEVEL * maxLevel);
  const hissRatioMin = target === 'z' ? Z_HISS_RATIO_MIN : HISS_RATIO_MIN;
  const isHiss = frames.map(
    (f) => isHissFrame(f, maxLevel, hissRatioMin) || (target === 'z' && isVoicedHissFrame(f, maxLevel)),
  );
  const isVoiced = frames.map((f) => f.level >= voicedFloor && f.hissRatio <= VOICED_RATIO_MAX);
  const voicedIdx: number[] = [];
  isVoiced.forEach((v, i) => {
    if (v) voicedIdx.push(i);
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
    vowels: findRuns(isVoiced).filter((r) => runLengthMs(frames, r, hopMs) >= MIN_VOICED_MS),
    runs: findRuns(isHiss),
  };
}

export function runLengthMs(frames: FrameFeatures[], r: Run, hopMs: number): number {
  return frames[r.end].tMs - frames[r.start].tMs + hopMs;
}

/**
 * Typical loudness of a hiss run next to the typical loudness of the vowel: the median level of the run's
 * hiss frames over the median level of the voiced frames between the first and last vowel frame. Without a
 * vowel the loudest frame stands in. Used by the lisp rule and by the sound trace (hissToVowel).
 */
export function hissToVowelOf(frames: FrameFeatures[], a: Analysis, r: Run): number {
  const hissLevels: number[] = [];
  for (let i = r.start; i <= r.end; i++) if (a.isHiss[i]) hissLevels.push(frames[i].level);
  const voicedFloor = Math.max(SILENCE_LEVEL, VOICED_REL_LEVEL * a.maxLevel);
  const vowelLevels: number[] = [];
  if (a.haveVowel) {
    for (let i = a.vowelStart; i <= a.vowelEnd; i++) {
      if (frames[i].level >= voicedFloor && frames[i].hissRatio <= VOICED_RATIO_MAX) {
        vowelLevels.push(frames[i].level);
      }
    }
  }
  const vowelLevel = vowelLevels.length > 0 ? median(vowelLevels) : a.maxLevel;
  return vowelLevel > 0 ? median(hissLevels) / vowelLevel : 0;
}

/** Typical flatness of a run's hiss frames, or undefined when the frames were saved without it. */
function flatnessOf(frames: FrameFeatures[], a: Analysis, r: Run): number | undefined {
  const values: number[] = [];
  for (let i = r.start; i <= r.end; i++) {
    const f = frames[i].flatness;
    if (a.isHiss[i] && f !== undefined) values.push(f);
  }
  return values.length > 0 ? median(values) : undefined;
}

/**
 * How many ms of a run hold their level. The first ONSET_SKIP_MS are skipped (the burst of a stop), then
 * frames count when they are at least SUSTAIN_REL_LEVEL of the loudest frame left. A stop release fades,
 * so little of it counts. A real "s" keeps its level, so most of it counts.
 */
export function sustainedMsOf(frames: FrameFeatures[], r: Run, hopMs: number): number {
  const from = frames[r.start].tMs + ONSET_SKIP_MS;
  const levels: number[] = [];
  for (let i = r.start; i <= r.end; i++) if (frames[i].tMs >= from) levels.push(frames[i].level);
  if (levels.length === 0) return 0;
  const peak = Math.max(...levels);
  return levels.filter((l) => l >= SUSTAIN_REL_LEVEL * peak).length * hopMs;
}

/**
 * Is the hiss in the right place in the word? It is judged by the vowel right next to it, not by the
 * first or last voiced frame of the whole recording: on a laptop the click of the Start or Stop button
 * reads as a voiced frame, and used to make every start or end hiss look out of place.
 */
function placedOk(frames: FrameFeatures[], a: Analysis, r: Run, word: PracticeWord, alone = false): boolean {
  if (alone) return true; // a sound said on its own ("sss") has no word around it to place it in
  if (!a.haveVowel) return true; // cannot place it, so accept any (a warning is added by the caller)
  const runStart = frames[r.start].tMs;
  const runEnd = frames[r.end].tMs + a.hopMs;
  // A "z" hiss frame can also be a voiced frame (the buzz), so the vowel next to it may start inside the
  // run's last frames, or end inside its first ones: that still counts as next to it.
  const vowelAfter = a.vowels.some(
    (v) => v.end > r.end && v.start > r.start && frames[v.start].tMs - runEnd <= MAX_VOWEL_GAP_MS,
  );
  const vowelBefore = a.vowels.some(
    (v) => v.start < r.start && v.end < r.end && runStart - (frames[v.end].tMs + a.hopMs) <= MAX_VOWEL_GAP_MS,
  );
  if (word.position === 'start') return vowelAfter;
  if (word.position === 'end') return vowelBefore;
  return vowelBefore && vowelAfter; // middle: between voiced parts
}

function meanOf(values: number[]): number | null {
  return values.length === 0 ? null : values.reduce((x, y) => x + y, 0) / values.length;
}

/**
 * "z": the share of a hiss run's frames that carry voicing (0 to 1). The first and last hiss frame are
 * left out when the run has at least 4, because they overlap the neighbouring vowel.
 */
export function voicedShareOf(frames: FrameFeatures[], a: Analysis, r: Run): number {
  const idx: number[] = [];
  for (let i = r.start; i <= r.end; i++) if (a.isHiss[i]) idx.push(i);
  const inner = idx.length >= 4 ? idx.slice(1, -1) : idx;
  if (inner.length === 0) return 0;
  return inner.filter((i) => (frames[i].voicing ?? 0) >= VOICING_FRAME_MIN).length / inner.length;
}

/** A hiss run split for "ch": the burst at the start, and the body (the hiss after it). */
interface Split {
  /** Loudest onset frame divided by the typical body loudness. null when there is no body. */
  burstRatio: number | null;
  bodyLevels: number[];
  bodyPositions: number[];
  /** Length of the body from its first to its last frame, ms. */
  bodyMs: number;
  /** How much of the body holds its level, ms. */
  bodyHeldMs: number;
}

function splitRun(frames: FrameFeatures[], a: Analysis, r: Run): Split {
  const from = frames[r.start].tMs + CH_ONSET_MS;
  const onsetLevels: number[] = [];
  const bodyIdx: number[] = [];
  for (let i = r.start; i <= r.end; i++) {
    if (frames[i].tMs < from) onsetLevels.push(frames[i].level);
    else if (a.isHiss[i]) bodyIdx.push(i);
  }
  if (bodyIdx.length === 0)
    return { burstRatio: null, bodyLevels: [], bodyPositions: [], bodyMs: 0, bodyHeldMs: 0 };
  const bodyLevels = bodyIdx.map((i) => frames[i].level);
  const peak = Math.max(...bodyLevels);
  const typical = median(bodyLevels);
  return {
    burstRatio: onsetLevels.length > 0 && typical > 0 ? Math.max(...onsetLevels) / typical : null,
    bodyLevels,
    bodyPositions: bodyIdx.flatMap((i) => positionFromCentroid(frames[i].centroidHz) ?? []),
    bodyMs: frames[bodyIdx[bodyIdx.length - 1]].tMs - frames[bodyIdx[0]].tMs + a.hopMs,
    bodyHeldMs: bodyLevels.filter((l) => l >= SUSTAIN_REL_LEVEL * peak).length * a.hopMs,
  };
}

/** The "ch" found in a recording: which run, and what is in it. */
interface Affricate {
  run: Run;
  split: Split;
  position: number;
}

/**
 * Look for a "ch" for this word: a hiss run in the right place that is a burst followed by a held hiss of
 * at least CH_MIN_HISS_MS. `burstOnly` is true when a run was in place but had no such hiss after it
 * (a "t" or "k" release, say). The longest body wins. The hiss may be any pitch: the caller decides.
 */
function findAffricate(
  frames: FrameFeatures[],
  a: Analysis,
  word: PracticeWord,
  alone = false,
): { best: Affricate | null; burstOnly: boolean } {
  let best: Affricate | null = null;
  let bestMs = -1;
  let burstOnly = false;
  for (const run of a.runs) {
    if (!placedOk(frames, a, run, word, alone)) continue;
    const split = splitRun(frames, a, run);
    if (
      split.bodyMs < CH_MIN_HISS_MS ||
      split.bodyHeldMs < CH_MIN_HISS_MS ||
      split.bodyPositions.length === 0
    ) {
      burstOnly = true;
      continue;
    }
    if (split.bodyMs > bestMs) {
      bestMs = split.bodyMs;
      const position = split.bodyPositions.reduce((x, y) => x + y, 0) / split.bodyPositions.length;
      best = { run, split, position };
    }
  }
  return { best, burstOnly };
}

/** One hiss run, with the numbers and the rule results, for the /lab page. */
export interface RunInfo {
  startMs: number;
  lengthMs: number;
  meanCentroidHz: number | null;
  meanPosition: number | null;
  peakLevel: number;
  sustainedMs: number;
  /** "z": share of the hiss frames that carry voicing, 0 to 1. */
  voicedShare: number;
  /** "ch": loudest onset frame over the typical loudness of the hiss after it. null when nothing follows. */
  burstRatio: number | null;
  /** Lisp: typical flatness of the hiss frames (null for frames saved without it), and hiss over vowel loudness. */
  flatness: number | null;
  hissToVowel: number;
  /** Rule results. `inPlace` is null when no word was given. */
  passed: { longEnough: boolean; held: boolean; inPlace: boolean | null };
}

/** List every hiss run found in a recording, with what each rule said. Pass a word to check placement. */
export function describeRuns(frames: FrameFeatures[], word?: PracticeWord): RunInfo[] {
  if (frames.length === 0) return [];
  const a = analyse(frames, word?.target);
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
      voicedShare: voicedShareOf(frames, a, r),
      burstRatio: splitRun(frames, a, r).burstRatio,
      flatness: flatnessOf(frames, a, r) ?? null,
      hissToVowel: hissToVowelOf(frames, a, r),
      passed: {
        longEnough: lengthMs >= MIN_HISS_MS,
        held: sustainedMs >= MIN_SUSTAINED_MS,
        inPlace: word ? placedOk(frames, a, r, word) : null,
      },
    };
  });
}

/** The runs that pass each rule in turn: long enough and in place, then also held. */
function candidateRuns(frames: FrameFeatures[], a: Analysis, word: PracticeWord, alone = false) {
  const long = a.runs.filter((r) => runLengthMs(frames, r, a.hopMs) >= MIN_HISS_MS);
  const inPlace = long.filter((r) => placedOk(frames, a, r, word, alone));
  // A hiss that fades away is the puff after a "t" or "k", not an "s" or "sh": it must hold its level.
  const held = inPlace.filter((r) => sustainedMsOf(frames, r, a.hopMs) >= MIN_SUSTAINED_MS);
  return { long, inPlace, held };
}

/** If several runs qualify, the longest one is the most likely to be the real sound. */
function longestRun(frames: FrameFeatures[], runs: Run[], hopMs: number): Run {
  return runs.reduce((best, r) =>
    runLengthMs(frames, r, hopMs) > runLengthMs(frames, best, hopMs) ? r : best,
  );
}

/**
 * The hiss run `scoreAttempt` would score for this word, or null when none qualifies. With
 * `fallbackToAny`, a recording whose hiss is in the wrong place or too short still gives its longest run.
 */
export function pickRun(
  frames: FrameFeatures[],
  a: Analysis,
  word: PracticeWord,
  fallbackToAny = false,
): Run | null {
  if (word.target === 'ch') {
    const { best } = findAffricate(frames, a, word);
    if (best) return best.run;
  }
  const { held } = candidateRuns(frames, a, word);
  if (held.length > 0) return longestRun(frames, held, a.hopMs);
  if (fallbackToAny && a.runs.length > 0) return longestRun(frames, a.runs, a.hopMs);
  return null;
}

/** Score a "ch": a stop burst straight into a short "sh" hiss. */
function scoreAffricate(
  frames: FrameFeatures[],
  a: Analysis,
  word: PracticeWord,
  warnings: string[],
  alone = false,
): AttemptScore {
  const { best, burstOnly } = findAffricate(frames, a, word, alone);
  if (!best) {
    if (burstOnly)
      warnings.push('I heard a short burst but no hiss after it. Let the burst run into a short "sh".');
    return missScore(word, warnings, MISS_CONFIDENCE);
  }
  const { run, split, position } = best;
  const ratio = split.burstRatio ?? 0;
  const hasBurst = ratio >= CH_BURST_RATIO;
  const shortEnough = split.bodyMs <= CH_MAX_HISS_MS;
  const distanceTerm = Math.min(1, Math.abs(position - BOUNDARY) / CONFIDENCE_FULL_DISTANCE);
  const hissMs = runLengthMs(frames, run, a.hopMs);

  let verdict: AttemptScore['verdict'];
  let heard: TargetSound;
  let clarity: number; // how sure we are about the burst call, 0 to 1
  if (position >= BOUNDARY) {
    // A hiss, but at the "s" pitch: not a "ch" whatever came before it.
    verdict = 'close';
    heard = 's';
    clarity = Math.min(1, split.bodyMs / CONFIDENCE_FULL_HISS_MS);
  } else if (hasBurst && shortEnough) {
    verdict = 'hit';
    heard = 'ch';
    clarity = Math.min(1, ratio / (CH_BURST_RATIO * CH_BURST_FULL_FACTOR));
  } else {
    verdict = 'close';
    heard = 'sh';
    if (hasBurst) {
      warnings.push('The hiss after the burst was long. Make it short and sharp, like a sneeze.');
      clarity = Math.min(1, (split.bodyMs - CH_MAX_HISS_MS) / CH_MAX_HISS_MS);
    } else {
      clarity = 1 - Math.min(1, ratio / CH_BURST_RATIO);
    }
  }
  const confidence = clamp01(
    CONFIDENCE_DISTANCE_WEIGHT * distanceTerm + (1 - CONFIDENCE_DISTANCE_WEIGHT) * clarity,
  );
  return { target: word.target, verdict, heard, meterPosition: position, hissMs, confidence, warnings };
}

/** Options for `scoreAttempt`. */
export interface ScoreOptions {
  /**
   * The sound is said on its own ("sss", the first practice level), not in a word. There is no vowel to
   * place it by, so any held hiss counts wherever it is, and the lisp rule (which needs a vowel to compare
   * the hiss with) only runs when a vowel was found.
   */
  alone?: boolean;
}

/** Score one spoken word: was the target sound there, in the right place? */
export function scoreAttempt(
  frames: FrameFeatures[],
  word: PracticeWord,
  opts: ScoreOptions = {},
): AttemptScore {
  const alone = opts.alone === true;
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

  const a = analyse(frames, word.target);
  const { hopMs, isHiss } = a;
  // Word shape: a hiss with no vowel, or far more voice than the word holds, is not the whole word.
  const shapeReason = shapeProblem(frames, a, word, alone);
  if (shapeReason) return missScore(word, [SHAPE_WARNING, shapeReason, ...warnings], SHAPE_MISS_CONFIDENCE);
  if (!a.haveVowel && !alone) {
    warnings.push('I could not find the vowel, so I could not check where in the word the hiss was.');
  }

  if (word.target === 'ch') return scoreAffricate(frames, a, word, warnings, alone);

  const { long, inPlace, held } = candidateRuns(frames, a, word, alone);
  if (long.length > 0 && inPlace.length === 0) {
    const where = word.position === 'middle' ? 'in the middle' : `at the ${word.position}`;
    warnings.push(`I heard a hiss, but not ${where} of the word.`);
  }
  if (inPlace.length > 0 && held.length === 0) {
    warnings.push('That sounded like a short burst, not a held hiss. Hold the hiss longer.');
  }

  if (held.length === 0) return missScore(word, warnings, MISS_CONFIDENCE);

  const run = longestRun(frames, held, hopMs);
  const positions: number[] = [];
  for (let i = run.start; i <= run.end; i++) {
    if (!isHiss[i]) continue;
    const p = positionFromCentroid(frames[i].centroidHz);
    if (p !== null) positions.push(p);
  }
  if (positions.length === 0) return missScore(word, warnings, MISS_CONFIDENCE);

  const meterPosition = positions.reduce((a, b) => a + b, 0) / positions.length;
  let heardSound: TargetSound = meterPosition >= BOUNDARY ? 's' : 'sh';
  // "z" is an "s" hiss with the voice on. Without enough voicing it is a plain "s", and the verdict is close.
  if (word.target === 'z' && heardSound === 's' && voicedShareOf(frames, a, run) >= Z_VOICED_SHARE_MIN) {
    heardSound = 'z';
  }
  const hissMs = runLengthMs(frames, run, hopMs);
  const distanceTerm = Math.min(1, Math.abs(meterPosition - BOUNDARY) / CONFIDENCE_FULL_DISTANCE);
  const lengthTerm = Math.min(1, hissMs / CONFIDENCE_FULL_HISS_MS);
  const confidence = clamp01(
    CONFIDENCE_DISTANCE_WEIGHT * distanceTerm + (1 - CONFIDENCE_DISTANCE_WEIGHT) * lengthTerm,
  );

  // "s" and "z" only: a hiss in place on the "s" side that is weak and flat is a lisp, not a clear "s".
  // "s" only: a hiss on the "s" side that is slushy (see isSlushyHiss) is treated the same, however loud.
  // It is close, never a hit, and the meter shows it at LISP_METER_POSITION so meter and verdict agree.
  const flatness = flatnessOf(frames, a, run);
  const lisp =
    ((word.target === 's' || word.target === 'z') &&
      (!alone || a.haveVowel) &&
      isLispLike(meterPosition, flatness, hissToVowelOf(frames, a, run), 1)) ||
    (word.target === 's' && heardSound === 's' && isSlushyHiss(flatness));
  if (lisp) {
    return {
      target: word.target,
      verdict: 'close',
      heard: heardSound,
      meterPosition: LISP_METER_POSITION,
      hissMs,
      confidence,
      warnings,
      lisp: true,
    };
  }

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
