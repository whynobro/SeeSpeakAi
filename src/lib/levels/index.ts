import { WORD_BANK } from '@/content/words';
import type { PracticeStage, PracticeWord, TargetSound } from '@/lib/types';

/*
 * Levels: the order speech therapists teach a sound, built on the four teaching stages.
 *   1. The sound alone ("sss")       stage "find": find the sound with no word around it
 *   2. At the start of a word ("sun") stage "lock": lock it in, in words
 *   3. At the end of a word ("bus")   stage "lock"
 *   4. In a short phrase ("a big sun") stage "use": use it in running speech
 * A level is passed when PASS_ITEMS of its ITEMS_PER_LEVEL items got at least one hit. Passing one opens
 * the next. Results stay on this device (see `src/lib/store`).
 */

export type LevelId = 'alone' | 'start' | 'end' | 'phrase';

export interface Level {
  id: LevelId;
  number: number; // 1 to 4, shown on screen
  title: string;
  /** One line on what the learner does at this level. */
  hint: string;
  stage: PracticeStage;
}

export const LEVELS: readonly Level[] = [
  { id: 'alone', number: 1, title: 'The sound alone', hint: 'Just the sound, no word yet.', stage: 'find' },
  { id: 'start', number: 2, title: 'Start of a word', hint: 'The sound comes first.', stage: 'lock' },
  { id: 'end', number: 3, title: 'End of a word', hint: 'The sound comes last.', stage: 'lock' },
  { id: 'phrase', number: 4, title: 'Short phrases', hint: 'The sound inside a few words.', stage: 'use' },
];

/** Items in one level. Short, so one level takes about two minutes. */
export const ITEMS_PER_LEVEL = 5;
/** Items that need a hit to pass: 4 of 5 (80%), the goal speech therapists commonly use before moving on. */
export const PASS_ITEMS = 4;

export function isLevelId(v: unknown): v is LevelId {
  return LEVELS.some((l) => l.id === v);
}

export function levelById(id: LevelId): Level {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0];
}

/** The level after this one, or null after the last. */
export function nextLevel(id: LevelId): Level | null {
  const i = LEVELS.findIndex((l) => l.id === id);
  return LEVELS[i + 1] ?? null;
}

/** What the learner reads for the sound alone. "ch" cannot be held, so it is said in short bursts. */
const ALONE_TEXT: Record<TargetSound, string> = {
  s: 'sss',
  sh: 'shhh',
  z: 'zzz',
  ch: 'ch',
};

/**
 * Short phrases: a lead-in plus one bank word, so the bank's rules hold (one target sound, no traps). The
 * lead-ins have no "s", "z", "sh", "ch", "f", "th" or "v", so no other hiss can be mistaken for the target.
 * The bank word keeps its position: a start word's sound has a vowel after it, an end word's a vowel before.
 */
const PHRASES: Record<TargetSound, [lead: string, word: string][]> = {
  s: [
    ['a big', 'sun'],
    ['my red', 'sock'],
    ['a big', 'bus'],
    ['my two', 'cats'],
    ['a little', 'mouse'],
  ],
  sh: [
    ['a big', 'ship'],
    ['my red', 'shoe'],
    ['a white', 'sheep'],
    ['a little', 'dish'],
    ['a green', 'bush'],
  ],
  z: [
    ['a big', 'zoo'],
    ['my red', 'zip'],
    ['my two', 'dogs'],
    ['a red', 'rose'],
    ['my new', 'toys'],
  ],
  ch: [
    ['a big', 'chair'],
    ['my', 'chin'],
    ['a red', 'chip'],
    ['my', 'lunch'],
    ['a long', 'bench'],
  ],
};

function bankWord(text: string, target: TargetSound): PracticeWord | undefined {
  return WORD_BANK.find((w) => w.text === text && w.target === target);
}

/** Bank words for one spot, single words first (a plural ending is harder than a plain end sound). */
function bankWords(target: TargetSound, position: 'start' | 'end'): PracticeWord[] {
  const mine = WORD_BANK.filter((w) => w.target === target && w.position === position);
  return [...mine.filter((w) => w.baseWord === null), ...mine.filter((w) => w.baseWord !== null)];
}

/** The items for one level, in a fixed order (no randomness, so a retry repeats the same items). */
export function levelItems(target: TargetSound, level: LevelId): PracticeWord[] {
  if (level === 'alone') {
    const text = ALONE_TEXT[target];
    const item: PracticeWord = {
      id: text,
      text,
      target,
      position: 'start',
      baseWord: null,
      contrastWord: null,
      sign: null,
    };
    return Array.from({ length: ITEMS_PER_LEVEL }, () => item);
  }
  if (level === 'start' || level === 'end') return bankWords(target, level).slice(0, ITEMS_PER_LEVEL);
  return PHRASES[target].flatMap(([lead, text]) => {
    const w = bankWord(text, target);
    if (!w) return [];
    const phrase = `${lead} ${w.text}`;
    return [{ ...w, id: phrase, text: phrase, contrastWord: null }];
  });
}

/** How many items got at least one hit, given the verdicts per item index. */
export function itemsHit(hitByItem: readonly boolean[]): number {
  return hitByItem.filter(Boolean).length;
}

export function passed(hitItems: number): boolean {
  return hitItems >= PASS_ITEMS;
}

/** Best result for one level of one sound, saved on the device. */
export interface LevelResult {
  bestHits: number; // most items hit in one run of the level
  passed: boolean;
  updatedAt: string; // ISO timestamp
}

export type LevelResults = Partial<Record<string, LevelResult>>;

export function levelKey(target: TargetSound, level: LevelId): string {
  return `${target}:${level}`;
}

/** A level is open when it is the first, or the one before it was passed. */
export function isUnlocked(results: LevelResults, target: TargetSound, level: LevelId): boolean {
  const i = LEVELS.findIndex((l) => l.id === level);
  if (i <= 0) return true;
  return results[levelKey(target, LEVELS[i - 1].id)]?.passed === true;
}

/** The first level not yet passed for this sound (the one to start on), or the last when all are passed. */
export function currentLevel(results: LevelResults, target: TargetSound): Level {
  return LEVELS.find((l) => results[levelKey(target, l.id)]?.passed !== true) ?? LEVELS[LEVELS.length - 1];
}

/** Merge one finished run into the saved results. A pass is never taken away by a worse run. */
export function mergeResult(
  results: LevelResults,
  target: TargetSound,
  level: LevelId,
  hitItems: number,
  now: Date = new Date(),
): LevelResults {
  const key = levelKey(target, level);
  const old = results[key];
  return {
    ...results,
    [key]: {
      bestHits: Math.max(old?.bestHits ?? 0, hitItems),
      passed: (old?.passed ?? false) || passed(hitItems),
      updatedAt: now.toISOString(),
    },
  };
}
