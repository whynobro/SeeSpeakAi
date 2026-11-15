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
  { wordId: 'ship', say: 'without-sound', as: 'hip' },
  { wordId: 'dogs', say: 'with-sound' },
  { wordId: 'chin', say: 'without-sound', as: 'in' },
  { wordId: 'sun', say: 'lisp' },
  { wordId: 'house', say: 'with-sound' },
  { wordId: 'shoe', say: 'other-sound', as: 'sue' },
  { wordId: 'eggs', say: 'without-sound', as: 'egg' },
  { wordId: 'watch', say: 'other-sound', as: 'wash' },
  { wordId: 'house', say: 'without-sound', as: 'how' },
  { wordId: 'shoe', say: 'with-sound' },
  { wordId: 'keys', say: 'with-sound' },
  { wordId: 'beach', say: 'without-sound', as: 'bee' },
  { wordId: 'bees', say: 'lisp' },
];

export function wordOf(step: GuidedStep): PracticeWord {
  const found = WORD_BANK.find((w) => w.id === step.wordId);
  if (!found) throw new Error(`Guided script word "${step.wordId}" is not in the word bank.`);
  return found;
}

/**
 * Just the word to say, spelled the way it should sound: "cats", or "cat" when the s is left out, or "ship"
 * when sip is said with sh. The page knows what is being tested and saves that in the background.
 */
export function instructionFor(step: GuidedStep): string {
  if (step.say === 'with-sound') return wordOf(step).text;
  if (step.say === 'lisp') return `${wordOf(step).text} (with a lisp)`;
  return step.as ?? wordOf(step).text;
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
