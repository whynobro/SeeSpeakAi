import { CUES } from '@/content/cues';
import type { CoachFeedback, FeedbackRequest } from '@/lib/types';

/** Built-in feedback, used when there is no key or the AI call fails. Pure, so it is easy to test. */
export function feedbackFromRules(req: FeedbackRequest): CoachFeedback {
  const { target, recent } = req;
  const other = target === 's' ? 'sh' : 's';
  const cues = CUES[target];
  const last = recent[recent.length - 1];
  const say = (
    message: string,
    cue: string | null,
    nextAction: CoachFeedback['nextAction'],
  ): CoachFeedback => ({ source: 'rules', message, cue, nextAction });

  if (!last) return say(`Say "${req.word}" when you are ready.`, cues.steps[0] ?? null, 'repeat');

  const lastThree = recent.slice(-3);
  const lastTwo = recent.slice(-2);
  const hitStreak = lastThree.length === 3 && lastThree.every((a) => a.verdict === 'hit');
  const missStreak = lastTwo.length === 2 && lastTwo.every((a) => a.verdict === 'miss');

  if (hitStreak) return say(`Three in a row with the "${target}". Time for a new word.`, null, 'next-word');
  if (last.verdict === 'hit')
    return say(`The "${target}" was there. Do it again to lock it in.`, null, 'repeat');
  if (last.verdict === 'close') {
    return say(
      `There was a hiss, but it was nearer "${other}" than "${target}".`,
      cues.steps.join(' '),
      'repeat',
    );
  }
  if (missStreak) {
    return say(`No "${target}" yet. Try the sound by itself first, then the word.`, cues.shaping, 'easier');
  }
  return say(`No "${target}" heard that time. Make the hiss longer.`, cues.touch, 'repeat');
}

/**
 * Steps 3 to 4 of the loop: the brain reads the scores from the last tries and says what to do next.
 * It receives numbers only (verdict, meter position, hiss length). It never receives audio.
 * TODO(tech lane): when ANTHROPIC_API_KEY is set, send `req` to Claude and ask for a CoachFeedback as
 * JSON in plain, kind words. Keep `nextAction` from `feedbackFromRules` unless Claude gives a valid one.
 * Fall back to `feedbackFromRules` on any error or if the call takes more than 3 seconds. Server side only.
 */
export async function buildFeedback(req: FeedbackRequest): Promise<CoachFeedback> {
  return feedbackFromRules(req);
}
