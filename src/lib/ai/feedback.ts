import { CUES } from '@/content/cues';
import { askClaudeForJson } from '@/lib/ai/client';
import { mergeFeedback } from '@/lib/ai/validate';
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

const FEEDBACK_SYSTEM = `You are a warm practice coach for a learner practicing the "s" or "sh" speech sound between speech therapy sessions.
You get numbers only, never audio. The app has already decided the verdict for the latest try (latestVerdict). Do not contradict it: if it is "hit" do not say it was missed, if it is "miss" or "close" do not say it was right.
Rules:
- One or two short, plain, kind sentences, at most 240 characters. Never say the learner is broken or needs fixing.
- "cue" is one thing to change with the mouth (at most 200 characters), or null. Base it on cueText when you can.
- This is not therapy and not a diagnosis. Do not use em dashes.
Reply with JSON only, no other text, in exactly this shape:
{"message": string, "cue": string | null}`;

/**
 * Steps 3 to 4 of the loop: the brain reads the scores from the last tries and says what to do next.
 * It receives numbers only (verdict, meter position, hiss length). It never receives audio.
 * The rules answer is always built first. Claude only rewords message and cue, see mergeFeedback.
 * Falls back to the rules answer on any error or after 3 seconds. Server side only.
 */
export async function buildFeedback(req: FeedbackRequest): Promise<CoachFeedback> {
  const rules = feedbackFromRules(req);
  const last = req.recent[req.recent.length - 1];
  const user = JSON.stringify({
    target: req.target,
    word: req.word,
    latestVerdict: last?.verdict ?? null,
    recent: req.recent.slice(-10).map((a) => ({
      verdict: a.verdict,
      heard: a.heard,
      meterPosition: a.meterPosition,
      hissMs: a.hissMs,
      confidence: a.confidence,
    })),
    rulesMessage: rules.message,
    rulesCue: rules.cue,
    cueText: CUES[req.target],
  });
  const reply = await askClaudeForJson({
    model: process.env.SEESPEAK_FEEDBACK_MODEL || 'claude-sonnet-5-5',
    system: FEEDBACK_SYSTEM,
    user,
    maxTokens: 300,
    timeoutMs: 3_000,
  });
  return mergeFeedback(rules, reply);
}
