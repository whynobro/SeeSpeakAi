import { WORD_BANK } from '@/content/words';
import type { Said } from '@/lib/testlog';
import type { AttemptScore, PracticeWord, TargetSound } from '@/lib/types';

/** One line of the guided test. `as` is what to actually say when the sound is left out or swapped. */
export interface GuidedStep {
  wordId: string;
  say: Exclude<Said, 'unsure'>;
  as?: string;
}

/** The other hiss a person says in place of the target (matches the lab page). */
export const OTHER_SOUND: Record<TargetSound, string> = { s: 'sh', sh: 's', z: 's', ch: 'sh' };

/**
 * The fixed script: 28 steps, mixing starts and ends and all the ways of saying a word. 6 per sound, plus
 * 4 lisp steps ("s" and "z", start and end) so the lisp check can be tuned on real voices.
 * The order alternates sounds so no one says the same hiss six times running.
 */
export const GUIDED_SCRIPT: GuidedStep[] = [
  { wordId: 'cats', say: 'with-sound' },
  { wordId: 'ship', say: 'with-sound' },
  { wordId: 'zoo', say: 'with-sound' },
  { wordId: 'chip', say: 'with-sound' },
  { wordId: 'hats', say: 'without-sound', as: 'hat' },
  { wordId: 'fish', say: 'with-sound' },
  { wordId: 'bees', say: 'without-sound', as: 'bee' },
  { wordId: 'beach', say: 'with-sound' },
  { wordId: 'cats', say: 'lisp' },
  { wordId: 'sip', say: 'other-sound', as: 'ship' },
  { wordId: 'shell', say: 'other-sound', as: 'sell' },
  { wordId: 'zip', say: 'other-sound', as: 'sip' },
  { wordId: 'chop', say: 'other-sound', as: 'shop' },
  { wordId: 'zoo', say: 'lisp' },
  { wordId: 'sun', say: 'with-sound' },
  { wordId: 'dish', say: 'without-sound', as: 'di' },
  { wordId: 'dogs', say: 'with-sound' },
  { wordId: 'chin', say: 'without-sound', as: 'in' },
  { wordId: 'sun', say: 'lisp' },
  { wordId: 'house', say: 'with-sound' },
  { wordId: 'push', say: 'other-sound', as: 'puss' },
  { wordId: 'eggs', say: 'without-sound', as: 'egg' },
  { wordId: 'watch', say: 'other-sound', as: 'wash' },
  { wordId: 'sun', say: 'without-sound', as: 'un' },
  { wordId: 'shoe', say: 'with-sound' },
  { wordId: 'keys', say: 'with-sound' },
  { wordId: 'lunch', say: 'without-sound', as: 'lun' },
  { wordId: 'bees', say: 'lisp' },
];

export function wordOf(step: GuidedStep): PracticeWord {
  const found = WORD_BANK.find((w) => w.id === step.wordId);
  if (!found) throw new Error(`Guided script word "${step.wordId}" is not in the word bank.`);
  return found;
}

/** The big plain instruction, for example "Say: cats (with the s)". */
export function instructionFor(step: GuidedStep): string {
  const word = wordOf(step);
  const sound = word.target;
  if (step.say === 'with-sound') return `Say: ${word.text} (with the ${sound})`;
  if (step.say === 'lisp') return `Say: ${word.text}, with a lisp (tongue between your teeth)`;
  if (step.say === 'without-sound') return `Say: ${word.text} as ${step.as} (leave the ${sound} out)`;
  return `Say: ${word.text} as ${step.as} (use ${OTHER_SOUND[sound]} instead of ${sound})`;
}

/**
 * Did the app's verdict agree with what the person was asked to do? "close" counts for a swapped sound.
 * A lisp should be close (the app heard a weak, flat hiss), never a hit.
 */
export function matchedExpectation(step: GuidedStep, score: AttemptScore): boolean {
  if (step.say === 'with-sound') return score.verdict === 'hit';
  if (step.say === 'lisp') return score.verdict === 'close';
  if (step.say === 'without-sound') return score.verdict === 'miss';
  return score.verdict !== 'hit';
}
