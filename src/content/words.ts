import type { PracticeWord, TargetSound, WordPosition } from '@/lib/types';

/*
 * Practice word bank. For the content owner.
 *
 * The scoring only detects the voiceless hiss ("s" as in "sun", "sh" as in "ship"), so the words must be
 * chosen with care:
 *  - Common, concrete, child-friendly words only.
 *  - Target "s" at the end: grammar endings (plurals) only after a voiceless consonant (p, t, k, f), where the
 *    "s" is a real hiss: cats, hats, cups, books. NEVER where the "s" is spoken as "z": dogs, beds, cars, bees,
 *    toys. Plurals set baseWord ("cat" for "cats").
 *  - No spelling traps where "s" is spoken as "sh", "zh" or "z": sugar, sure, measure, is, has, nose, rose.
 *  - No "s" clusters at the start: stop, snake.
 *  - No word with both hisses.
 *  - contrastWord is the same word with the other hiss, only when a real word exists (sip/ship).
 *  - id is the lower-case word and must be unique. sign stays null until signed cards are reviewed.
 *
 * Add words here, keep the rules, run `npm test`.
 */

function w(
  text: string,
  target: TargetSound,
  position: WordPosition,
  baseWord: string | null = null,
  contrastWord: string | null = null,
): PracticeWord {
  return { id: text.toLowerCase(), text, target, position, baseWord, contrastWord, sign: null };
}

export const WORD_BANK: PracticeWord[] = [
  // s, end, grammar endings after a voiceless consonant
  w('cats', 's', 'end', 'cat'),
  w('hats', 's', 'end', 'hat'),
  w('cups', 's', 'end', 'cup'),
  w('books', 's', 'end', 'book'),
  w('ducks', 's', 'end', 'duck'),
  w('boats', 's', 'end', 'boat'),
  w('socks', 's', 'end', 'sock'),
  w('maps', 's', 'end', 'map'),
  w('bats', 's', 'end', 'bat'),
  w('lips', 's', 'end', 'lip'),
  // s, end, not a plural
  w('bus', 's', 'end'),
  w('yes', 's', 'end'),
  w('house', 's', 'end'),
  w('mouse', 's', 'end'),
  w('ice', 's', 'end'),
  w('face', 's', 'end'),
  // s, start
  w('sun', 's', 'start'),
  w('sip', 's', 'start', null, 'ship'),
  w('sock', 's', 'start', null, 'shock'),
  w('seat', 's', 'start', null, 'sheet'),
  w('soap', 's', 'start'),
  w('sea', 's', 'start', null, 'she'),
  w('sew', 's', 'start', null, 'show'),
  w('save', 's', 'start', null, 'shave'),
  // sh, start
  w('ship', 'sh', 'start', null, 'sip'),
  w('shoe', 'sh', 'start', null, 'sue'),
  w('sheep', 'sh', 'start'),
  w('shop', 'sh', 'start'),
  w('shell', 'sh', 'start', null, 'sell'),
  w('shirt', 'sh', 'start'),
  w('sheet', 'sh', 'start', null, 'seat'),
  w('show', 'sh', 'start', null, 'sew'),
  // sh, end
  w('fish', 'sh', 'end'),
  w('wash', 'sh', 'end'),
  w('dish', 'sh', 'end'),
  w('push', 'sh', 'end'),
  w('brush', 'sh', 'end'),
  w('bush', 'sh', 'end'),
];

/**
 * Words for one target sound, in a fixed order (no randomness): grammar endings come early, and the
 * positions are mixed by taking one word from each group in turn.
 */
export function wordsFor(target: TargetSound, count: number): PracticeWord[] {
  const mine = WORD_BANK.filter((word) => word.target === target);
  const groups = [
    mine.filter((word) => word.baseWord !== null),
    mine.filter((word) => word.baseWord === null && word.position === 'start'),
    mine.filter((word) => word.baseWord === null && word.position !== 'start'),
  ].filter((g) => g.length > 0);
  const out: PracticeWord[] = [];
  for (let i = 0; out.length < mine.length; i++) {
    for (const g of groups) if (i < g.length) out.push(g[i]);
  }
  return out.slice(0, Math.max(0, count));
}
