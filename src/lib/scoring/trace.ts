import { analyse, pickRun, positionFromCentroid, runLengthMs, sustainedMsOf } from '@/lib/scoring';
import { SILENCE_LEVEL, VOICED_RATIO_MAX, VOICED_REL_LEVEL } from '@/lib/scoring/constants';
import type { FrameFeatures, PracticeWord, TraceSummary } from '@/lib/types';

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/**
 * Boil one recording down to the shape of its hiss: how long, how steady, where it sits on the "sh" to "s"
 * meter at the start, middle and end, how loud next to the vowel, and the pause before it. Numbers only.
 * It looks at the same hiss `scoreAttempt` would score. When none qualifies it uses the longest hiss
 * anywhere. Returns null when there are no frames or no hiss at all.
 */
export function summarizeTrace(frames: FrameFeatures[], word: PracticeWord): TraceSummary | null {
  if (frames.length === 0) return null;
  const a = analyse(frames, word.target);
  const run = pickRun(frames, a, word, true);
  if (!run) return null;

  const hissFrames: FrameFeatures[] = [];
  for (let i = run.start; i <= run.end; i++) if (a.isHiss[i]) hissFrames.push(frames[i]);
  // The meter position of each hiss frame, in time order (frames with no centroid have none).
  const positions = hissFrames.flatMap((f) => positionFromCentroid(f.centroidHz) ?? []);
  if (positions.length === 0) return null;

  const third = Math.max(1, Math.floor(positions.length / 3));
  const positionStart = mean(positions.slice(0, third));
  const positionEnd = mean(positions.slice(-third));
  const positionMid =
    positions.length >= 3 ? mean(positions.slice(third, positions.length - third)) : mean(positions);

  // Steadiness: how much the loudness wobbles, as spread divided by average (0 wobbly to 1 smooth).
  const levels = hissFrames.map((f) => f.level);
  const avgLevel = mean(levels);
  const spread = Math.sqrt(mean(levels.map((l) => (l - avgLevel) ** 2)));
  const steadiness = avgLevel > 0 ? clamp01(1 - spread / avgLevel) : 0;

  // The vowel: the voiced frames between the first and last one. Without a vowel, compare to the loudest.
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
  const hissLevel = median(levels);

  let gapMs: number | null = null;
  let vowelMs = 0;
  if (a.haveVowel) {
    vowelMs = frames[a.vowelEnd].tMs - frames[a.vowelStart].tMs + a.hopMs;
    if (run.start > a.vowelEnd) {
      gapMs = Math.max(0, frames[run.start].tMs - (frames[a.vowelEnd].tMs + a.hopMs));
    } else if (run.end < a.vowelStart) {
      gapMs = Math.max(0, frames[a.vowelStart].tMs - (frames[run.end].tMs + a.hopMs));
    } // else the hiss sits inside the vowel span (a middle sound): no single gap
  }

  return {
    hissMs: runLengthMs(frames, run, a.hopMs),
    heldMs: sustainedMsOf(frames, run, a.hopMs),
    positionStart,
    positionMid,
    positionEnd,
    drift: positionEnd - positionStart,
    steadiness,
    hissToVowel: vowelLevel > 0 ? hissLevel / vowelLevel : 0,
    gapMs,
    vowelMs,
  };
}
