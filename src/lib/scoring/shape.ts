import type { FrameFeatures, PracticeWord } from '@/lib/types';
import type { Analysis } from '@/lib/scoring';
import {
  MIN_HISS_MS,
  SILENCE_LEVEL,
  VOICED_RATIO_MAX,
  SHAPE_EXTRA_SEGMENTS_PHRASE,
  SHAPE_LOOSE_VOWEL_REL_LEVEL,
  SHAPE_EXTRA_SEGMENTS_WORD,
  SHAPE_MAX_VOICED_MS_PER_SYLLABLE,
  SHAPE_MIN_SEGMENT_MS,
  SHAPE_NO_VOWEL_MIN_HISS_MS,
  SHAPE_SEGMENT_GAP_MS,
  SHAPE_SEGMENT_REL_LEVEL,
  SHAPE_VOICED_MARGIN_MS,
} from '@/lib/scoring/constants';

/*
 * Word shape: a rough check that the try was the whole target word, WITHOUT speech recognition.
 * It never listens for which word was said. It only compares two simple numbers with the spelling:
 * how many vowel stretches (beats) the recording has, and how long the voice was on.
 * Only clear cases fail: a hiss with no vowel at all, or far more voice than the word could hold.
 */

/** The first line of the warnings when the shape does not fit. The practice screen can look for it. */
export const SHAPE_WARNING = 'Try the whole word.';
export const SHAPE_REASON_NO_VOWEL = 'I heard a hiss but no vowel.';
export const SHAPE_REASON_TOO_MANY = 'I heard more than one word.';

const VOWELS = 'aeiouy';

/**
 * Syllables in one word from its spelling: count groups of vowel letters, then drop a silent final "e"
 * ("house", "face", "rose") unless the word ends in a consonant plus "le" ("little"). "y" is a vowel
 * except at the start of a word ("yes"). A word with no vowel letter at all ("sss", "shhh", "ch") is 0:
 * it is a sound said on its own. Rough on purpose: it can be off by one on unusual spellings ("cereal"
 * reads 2), and the check leaves room for that.
 */
export function wordSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  let groups = 0;
  let inGroup = false;
  for (let i = 0; i < w.length; i++) {
    const isVowel = VOWELS.includes(w[i]) && !(w[i] === 'y' && i === 0);
    if (isVowel && !inGroup) groups++;
    inGroup = isVowel;
  }
  if (groups === 0) return 0;
  const n = w.length;
  const silentE =
    n >= 3 &&
    w[n - 1] === 'e' &&
    !VOWELS.includes(w[n - 2]) &&
    !(w[n - 2] === 'l' && !VOWELS.includes(w[n - 3]));
  return Math.max(1, silentE ? groups - 1 : groups);
}

/** Syllables in a word or a phrase: the sum over its words. 0 means a sound said on its own. */
export function syllablesOf(text: string): number {
  return text
    .split(/[^a-zA-Z]+/)
    .filter(Boolean)
    .reduce((sum, w) => sum + wordSyllables(w), 0);
}

/** More than one word in the text (a phrase like "a big sun"). */
function isPhrase(text: string): boolean {
  return text.trim().split(/\s+/).length > 1;
}

/** What the recording looks like, in beats and voice time. */
export interface MeasuredShape {
  /** Voiced stretches (vowels) after joining ones closer than SHAPE_SEGMENT_GAP_MS and dropping short ones. */
  segments: number;
  /** Total ms of those stretches. */
  voicedMs: number;
}

export function measureShape(frames: FrameFeatures[], a: Analysis): MeasuredShape {
  const spans: { start: number; end: number; peak: number }[] = [];
  for (const v of a.vowels) {
    const start = frames[v.start].tMs;
    const end = frames[v.end].tMs + a.hopMs;
    let peak = 0;
    for (let i = v.start; i <= v.end; i++) peak = Math.max(peak, frames[i].level);
    const last = spans[spans.length - 1];
    if (last && start - last.end < SHAPE_SEGMENT_GAP_MS) {
      last.end = end;
      last.peak = Math.max(last.peak, peak);
    } else spans.push({ start, end, peak });
  }
  const long = spans.filter((s) => s.end - s.start >= SHAPE_MIN_SEGMENT_MS);
  // Voice much quieter than the loudest beat is someone else in the room or a breath, not another word.
  const loudest = Math.max(0, ...long.map((s) => s.peak));
  const kept = long.filter((s) => s.peak >= SHAPE_SEGMENT_REL_LEVEL * loudest);
  return { segments: kept.length, voicedMs: kept.reduce((sum, s) => sum + s.end - s.start, 0) };
}

/**
 * Is there any vowel at all, even a quiet one? The main vowel check (VOICED_REL_LEVEL of the loudest frame)
 * misses a quiet vowel next to a very loud hiss, so this looser one is used before failing a try for having
 * no vowel: a stretch of at least SHAPE_MIN_SEGMENT_MS of low-pitched frames at SHAPE_LOOSE_VOWEL_REL_LEVEL.
 */
export function hasAnyVowel(frames: FrameFeatures[], a: Analysis): boolean {
  if (a.haveVowel) return true;
  const floor = Math.max(SILENCE_LEVEL, SHAPE_LOOSE_VOWEL_REL_LEVEL * a.maxLevel);
  let start = -1;
  for (let i = 0; i <= frames.length; i++) {
    const voiced = i < frames.length && frames[i].level >= floor && frames[i].hissRatio <= VOICED_RATIO_MAX;
    if (voiced && start < 0) start = i;
    if (!voiced && start >= 0) {
      if (frames[i - 1].tMs - frames[start].tMs + a.hopMs >= SHAPE_MIN_SEGMENT_MS) return true;
      start = -1;
    }
  }
  return false;
}

/** Length of the longest hiss run in the recording, ms (0 when there is none). */
function longestHissMs(frames: FrameFeatures[], a: Analysis): number {
  return a.runs.reduce((ms, r) => Math.max(ms, frames[r.end].tMs - frames[r.start].tMs + a.hopMs), 0);
}

/**
 * Does the recording fit the word? Returns the plain reason when it clearly does not, or null when it fits
 * (or cannot be judged: a sound said on its own, or a text with no vowel letters).
 */
export function shapeProblem(
  frames: FrameFeatures[],
  a: Analysis,
  word: PracticeWord,
  alone = false,
): string | null {
  const expected = syllablesOf(word.text);
  if (alone || expected === 0) return null;
  // No vowel at all fails only after a long hiss (a held "sssss" for "sip"). A short hiss with no vowel is
  // left to the scoring: the laptop mic can cut a quiet vowel off right after a loud hiss.
  if (!hasAnyVowel(frames, a) && longestHissMs(frames, a) >= SHAPE_NO_VOWEL_MIN_HISS_MS) {
    return SHAPE_REASON_NO_VOWEL;
  }
  const shape = measureShape(frames, a);
  // The same word said again in one recording ("ship, ship") brings its own hiss each time. That is not a
  // different word, so the word's beats and voice time are allowed once per long hiss run.
  const repeats = Math.max(
    1,
    a.runs.filter((r) => frames[r.end].tMs - frames[r.start].tMs + a.hopMs >= MIN_HISS_MS).length,
  );
  const extra = isPhrase(word.text) ? SHAPE_EXTRA_SEGMENTS_PHRASE : SHAPE_EXTRA_SEGMENTS_WORD;
  if (shape.segments > repeats * expected + extra) return SHAPE_REASON_TOO_MANY;
  const maxVoicedMs = repeats * SHAPE_MAX_VOICED_MS_PER_SYLLABLE * expected + SHAPE_VOICED_MARGIN_MS;
  if (shape.voicedMs > maxVoicedMs) return SHAPE_REASON_TOO_MANY;
  return null;
}
