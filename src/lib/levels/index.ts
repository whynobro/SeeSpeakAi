import { WORD_BANK } from '@/content/words';
import type { AttemptScore, PracticeStage, PracticeWord, TargetSound } from '@/lib/types';

/*
 * Levels: the order speech therapists teach a sound, built on the four teaching stages.
 *   1. The sound alone ("sss")       stage "find": find the sound with no word around it
 *   2. At the start of a word ("sun") stage "lock": lock it in, in words
 *   3. At the end of a word ("bus")   stage "lock"
 *   4. In a short phrase ("a big sun") stage "use": use it in running speech
 * Each level has three tiers: bronze, silver, gold (see TIERS). A tier is passed when enough of the level's
 * ITEMS_PER_LEVEL items had at least one try that counts for that tier. Passing silver opens the next level.
 * Every tier and every replay (round) uses different items. Results stay on this device (see `src/lib/store`).
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
/** Items that must count for bronze and silver: 4 of 5 (80%), the goal speech therapists commonly use before moving on. */
export const PASS_ITEMS = 4;

export type Tier = 'bronze' | 'silver' | 'gold';

export interface TierInfo {
  id: Tier;
  title: string;
  /** One plain line on what counts. */
  line: string;
}

export const TIERS: readonly TierInfo[] = [
  { id: 'bronze', title: 'Bronze', line: 'A close try counts.' },
  { id: 'silver', title: 'Silver', line: 'Say the sound right.' },
  { id: 'gold', title: 'Gold', line: 'Every word right, clear and steady.' },
];

export function isTier(v: unknown): v is Tier {
  return TIERS.some((t) => t.id === v);
}

export function tierById(id: Tier): TierInfo {
  return TIERS.find((t) => t.id === id) ?? TIERS[0];
}

/** The tier after this one, or null after gold. */
export function nextTier(id: Tier): TierInfo | null {
  const i = TIERS.findIndex((t) => t.id === id);
  return TIERS[i + 1] ?? null;
}

/**
 * A practice goal for gold, not a scoring threshold: the measured verdict never changes. Gold asks for a hit
 * the app was fairly sure about (see `confidence` on AttemptScore).
 */
export const GOLD_MIN_CONFIDENCE = 0.6;

/** Does this try count toward the tier? The verdict shown to the learner is always the measured one. */
export function countsFor(tier: Tier, score: AttemptScore): boolean {
  if (tier === 'bronze') return score.verdict === 'hit' || score.verdict === 'close';
  if (tier === 'silver') return score.verdict === 'hit';
  return score.verdict === 'hit' && score.confidence >= GOLD_MIN_CONFIDENCE && score.lisp !== true;
}

/** Items that must count to pass a tier: bronze and silver 4 of 5, gold every item (retries allowed). */
export function passItems(tier: Tier): number {
  return tier === 'gold' ? ITEMS_PER_LEVEL : PASS_ITEMS;
}

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
    ['a new', 'house'],
    ['a red', 'seat'],
    ['a green', 'sea'],
    ['my two', 'cups'],
    ['a big', 'face'],
  ],
  sh: [
    ['a big', 'ship'],
    ['my red', 'shoe'],
    ['a white', 'sheep'],
    ['a little', 'dish'],
    ['a green', 'bush'],
    ['a new', 'shop'],
    ['a big', 'shell'],
    ['my old', 'shirt'],
    ['a red', 'brush'],
    ['a big', 'fish'],
  ],
  z: [
    ['a big', 'zoo'],
    ['my red', 'zip'],
    ['my two', 'dogs'],
    ['a red', 'rose'],
    ['my new', 'toys'],
    ['a big', 'zebra'],
    ['my two', 'bees'],
    ['my old', 'keys'],
    ['my two', 'eggs'],
    ['a little', 'nose'],
  ],
  ch: [
    ['a big', 'chair'],
    ['my', 'chin'],
    ['a red', 'chip'],
    ['my', 'lunch'],
    ['a long', 'bench'],
    ['a big', 'peach'],
    ['a red', 'match'],
    ['my old', 'watch'],
    ['a long', 'beach'],
    ['a white', 'chalk'],
  ],
};

export function bankWord(text: string, target: TargetSound): PracticeWord | undefined {
  return WORD_BANK.find((w) => w.text === text && w.target === target);
}

/** Bank words for one spot, single words first (a plural ending is harder than a plain end sound). */
function bankWords(target: TargetSound, position: 'start' | 'end'): PracticeWord[] {
  const mine = WORD_BANK.filter((w) => w.target === target && w.position === position);
  return [...mine.filter((w) => w.baseWord === null), ...mine.filter((w) => w.baseWord !== null)];
}

/** Every phrase for a sound, in a fixed order. */
export function phrasesFor(target: TargetSound): PracticeWord[] {
  return PHRASES[target].flatMap(([lead, text]) => {
    const w = bankWord(text, target);
    if (!w) return [];
    const phrase = `${lead} ${w.text}`;
    return [{ ...w, id: phrase, text: phrase, contrastWord: null }];
  });
}

/**
 * Five items from a list, wrapping round the end. The start moves with the tier (spread evenly over the list)
 * and with the round (3 further on each replay), so each tier and each replay gets different items.
 * Fixed order, no randomness.
 */
function pick<T>(list: readonly T[], tier: Tier, round: number): T[] {
  if (list.length === 0) return [];
  const tierIndex = TIERS.findIndex((t) => t.id === tier);
  const start = (Math.floor((tierIndex * list.length) / TIERS.length) + Math.max(0, round) * 3) % list.length;
  return Array.from(
    { length: Math.min(ITEMS_PER_LEVEL, list.length) },
    (_, i) => list[(start + i) % list.length],
  );
}

/** The items for one tier of one level. `round` is how many times this tier was finished before. */
export function levelItems(
  target: TargetSound,
  level: LevelId,
  tier: Tier = 'bronze',
  round = 0,
): PracticeWord[] {
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
  if (level === 'start' || level === 'end') return pick(bankWords(target, level), tier, round);
  return pick(phrasesFor(target), tier, round);
}

/** How many items had at least one try that counts, given the flags per item index. */
export function itemsHit(countedByItem: readonly boolean[]): number {
  return countedByItem.filter(Boolean).length;
}

export function tierPasses(tier: Tier, countedItems: number): boolean {
  return countedItems >= passItems(tier);
}

/** Result for one tier of one level of one sound, saved on the device. */
export interface TierResult {
  bestHits: number; // most items that counted in one run
  passed: boolean;
  plays: number; // finished runs of this tier, used as the round so the items change
  updatedAt: string; // ISO timestamp
}

/** Saved result for one level of one sound. */
export interface LevelResult {
  tiers: Partial<Record<Tier, TierResult>>;
}

export type LevelResults = Partial<Record<string, LevelResult>>;

function rec(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function tierResultOf(v: unknown): TierResult | null {
  if (
    rec(v) &&
    typeof v.bestHits === 'number' &&
    typeof v.passed === 'boolean' &&
    typeof v.updatedAt === 'string'
  ) {
    return {
      bestHits: v.bestHits,
      passed: v.passed,
      plays: typeof v.plays === 'number' ? v.plays : 1,
      updatedAt: v.updatedAt,
    };
  }
  return null;
}

/**
 * Read one saved level result. Accepts the new shape ({ tiers }) and the old one
 * ({ bestHits, passed, updatedAt }, from before tiers), which is read as silver. Anything else is dropped.
 */
export function normalizeLevelResult(v: unknown): LevelResult | null {
  if (!rec(v)) return null;
  if (rec(v.tiers)) {
    const tiers: LevelResult['tiers'] = {};
    for (const t of TIERS) {
      const r = tierResultOf(v.tiers[t.id]);
      if (r) tiers[t.id] = r;
    }
    return { tiers };
  }
  const old = tierResultOf(v);
  return old ? { tiers: { silver: old } } : null;
}

export function levelKey(target: TargetSound, level: LevelId): string {
  return `${target}:${level}`;
}

/**
 * Is a tier passed? A harder pass covers the easier tiers: every item that counts for gold counts for silver,
 * and every one that counts for silver counts for bronze.
 */
export function tierPassed(results: LevelResults, target: TargetSound, level: LevelId, tier: Tier): boolean {
  const tiers = results[levelKey(target, level)]?.tiers;
  if (!tiers) return false;
  const from = TIERS.findIndex((t) => t.id === tier);
  return TIERS.slice(from).some((t) => tiers[t.id]?.passed === true);
}

/** A level is passed when its silver tier is. This opens the next level. */
export function levelPassed(results: LevelResults, target: TargetSound, level: LevelId): boolean {
  return tierPassed(results, target, level, 'silver');
}

/** A level is open when it is the first, or the one before it has its silver passed. */
export function isUnlocked(results: LevelResults, target: TargetSound, level: LevelId): boolean {
  const i = LEVELS.findIndex((l) => l.id === level);
  if (i <= 0) return true;
  return levelPassed(results, target, LEVELS[i - 1].id);
}

/** A tier is open when its level is open and the tier before it is passed. Bronze needs only the level. */
export function isTierUnlocked(
  results: LevelResults,
  target: TargetSound,
  level: LevelId,
  tier: Tier,
): boolean {
  if (!isUnlocked(results, target, level)) return false;
  const i = TIERS.findIndex((t) => t.id === tier);
  return i <= 0 || tierPassed(results, target, level, TIERS[i - 1].id);
}

/** The first level whose silver is not yet passed for this sound (the one to start on), or the last when all are. */
export function currentLevel(results: LevelResults, target: TargetSound): Level {
  return LEVELS.find((l) => !levelPassed(results, target, l.id)) ?? LEVELS[LEVELS.length - 1];
}

/** The first tier not yet passed in a level, or gold when all are passed. */
export function currentTier(results: LevelResults, target: TargetSound, level: LevelId): TierInfo {
  return TIERS.find((t) => !tierPassed(results, target, level, t.id)) ?? TIERS[TIERS.length - 1];
}

/** Times this tier was finished: the round that picks the items. */
export function tierPlays(results: LevelResults, target: TargetSound, level: LevelId, tier: Tier): number {
  return results[levelKey(target, level)]?.tiers[tier]?.plays ?? 0;
}

/** Merge one finished run into the saved results. A pass is never taken away by a worse run. */
export function mergeResult(
  results: LevelResults,
  target: TargetSound,
  level: LevelId,
  tier: Tier,
  countedItems: number,
  now: Date = new Date(),
): LevelResults {
  const key = levelKey(target, level);
  const oldLevel = results[key];
  const old = oldLevel?.tiers[tier];
  return {
    ...results,
    [key]: {
      tiers: {
        ...oldLevel?.tiers,
        [tier]: {
          bestHits: Math.max(old?.bestHits ?? 0, countedItems),
          passed: (old?.passed ?? false) || tierPasses(tier, countedItems),
          plays: (old?.plays ?? 0) + 1,
          updatedAt: now.toISOString(),
        },
      },
    },
  };
}
