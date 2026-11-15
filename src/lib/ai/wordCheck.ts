import type { PracticeWord, TargetSound, WordPosition } from '@/lib/types';
import pronunciations from './pronounce.generated.json';

/*
 * Word check, server side. Claude suggests practice words, this file decides if each one is safe.
 * The phone scores "s", "sh", "z" and "ch", and English spelling lies ("dogs" ends in a "z" sound, "cheese"
 * has a "z" in it), so every word is looked up in the CMU Pronouncing Dictionary (see scripts/build-pronounce.mjs) and judged by its sounds.
 * Pure functions, no network.
 */

const DICTIONARY: Record<string, string> = pronunciations;

const VOWELS = new Set([
  'AA',
  'AE',
  'AH',
  'AO',
  'AW',
  'AY',
  'EH',
  'ER',
  'EY',
  'IH',
  'IY',
  'OW',
  'OY',
  'UH',
  'UW',
]);
/** Hissing and buzzing sounds that would confuse the phone's hiss check. */
const HISSES = ['S', 'SH', 'Z', 'ZH', 'CH', 'JH'];
const TARGET_PHONEME: Record<TargetSound, string> = { s: 'S', sh: 'SH', z: 'Z', ch: 'CH' };
/**
 * A word-final sound is clean after a vowel or one of these. "s" and "sh" after a voiceless consonant
 * ("cats", "cups", "books"). "z" after a voiced one ("dogs", "beds", "cars"), so the voicing is not
 * borrowed from a voiceless neighbour. "ch" after "n" ("lunch").
 */
const END_FRIENDS: Record<TargetSound, Set<string>> = {
  s: new Set(['P', 'T', 'K', 'F']),
  sh: new Set(['P', 'T', 'K', 'F']),
  z: new Set(['B', 'D', 'G', 'V', 'M', 'N', 'NG', 'L', 'R', 'DH']),
  ch: new Set(['N']),
};
/** Words with at most this many vowel sounds are accepted (short words only). */
const MAX_VOWELS = 2;
/** Middle-of-word targets are rejected for now: the bank has none and scoring there is the least tested. */
export const ALLOW_MIDDLE = false;

/** Words that must never be shown to a learner. Short and obvious on purpose; the prompt also asks for friendly words. */
export const BLOCKLIST: ReadonlySet<string> = new Set([
  'ass',
  'sex',
  'shit',
  'piss',
  'slut',
  'tits',
  'cum',
  'semen',
  'shag',
]);

export type WordCheck =
  { ok: true; position: WordPosition; phonemes: string } | { ok: false; reason: string };

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

/** Judge one word by its sounds, for the given target. */
export function checkWord(text: string, target: TargetSound): WordCheck {
  const word = normalize(text);
  if (BLOCKLIST.has(word)) return { ok: false, reason: `"${word}" is not allowed for learners.` };
  const phonemes = (DICTIONARY as Record<string, string | undefined>)[word];
  if (!phonemes) return { ok: false, reason: `"${word}" is not in the pronunciation list.` };
  const list = phonemes.split(' ');
  const want = TARGET_PHONEME[target];

  const count = list.filter((p) => p === want).length;
  if (count !== 1) {
    return { ok: false, reason: `"${word}" (${phonemes}) has the ${target} sound ${count} times, not once.` };
  }
  const bad = list.find((p) => p !== want && HISSES.includes(p));
  if (bad) return { ok: false, reason: `"${word}" (${phonemes}) also has the sound ${bad}.` };
  if (list.filter((p) => VOWELS.has(p)).length > MAX_VOWELS) {
    return { ok: false, reason: `"${word}" is too long (more than ${MAX_VOWELS} vowel sounds).` };
  }

  const at = list.indexOf(want);
  let position: WordPosition;
  if (at === 0) {
    position = 'start';
    const next = list[1];
    if (!next || !VOWELS.has(next)) {
      return {
        ok: false,
        reason: `"${word}" (${phonemes}) starts with a cluster, not ${target} plus a vowel.`,
      };
    }
  } else if (at === list.length - 1) {
    position = 'end';
    const before = list[at - 1];
    if (!VOWELS.has(before) && !END_FRIENDS[target].has(before)) {
      return { ok: false, reason: `"${word}" (${phonemes}) has a sound before the ${target} that blurs it.` };
    }
  } else {
    if (!ALLOW_MIDDLE)
      return { ok: false, reason: `"${word}" has the ${target} in the middle, not used yet.` };
    position = 'middle';
  }
  return { ok: true, position, phonemes };
}

/**
 * "cats" gives "cat" when the final S is a real "s" sound and the base word sounds the same without it.
 * Pass 'Z' for the voiced ending: "dogs" gives "dog".
 */
export function baseWordFor(text: string, ending: 'S' | 'Z' = 'S'): string | null {
  const word = normalize(text);
  if (word.length < 3 || !word.endsWith('s')) return null;
  const dict = DICTIONARY as Record<string, string | undefined>;
  const phonemes = dict[word];
  if (!phonemes || !phonemes.endsWith(` ${ending}`)) return null;
  const base = word.slice(0, -1);
  const basePhonemes = dict[base];
  return basePhonemes !== undefined && basePhonemes === phonemes.slice(0, -2) ? base : null;
}

/** A practice word the dictionary approves, or null. */
export function toPracticeWord(text: string, target: TargetSound): PracticeWord | null {
  const word = normalize(text);
  const check = checkWord(word, target);
  if (!check.ok) return null;
  return {
    id: word,
    text: word,
    target,
    position: check.position,
    baseWord:
      check.position === 'end' && (target === 's' || target === 'z')
        ? baseWordFor(word, target === 's' ? 'S' : 'Z')
        : null,
    contrastWord: null,
    sign: null,
  };
}
