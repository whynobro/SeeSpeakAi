import { CUES } from '@/content/cues';
import { WORD_BANK } from '@/content/words';
import { askClaudeForJson } from '@/lib/ai/client';
import { mergeFeedback } from '@/lib/ai/validate';
import type { CoachFeedback, FeedbackRequest, TargetSound, TraceSummary, WordPosition } from '@/lib/types';

// Starting values for the sound-trace rules. To be tuned on real voices, like the scoring constants.
/** The hiss slid at least this far on the meter (0 to 1) toward the other sound. */
export const SLIDE_DRIFT = 0.3;
/** Held for less than this many ms is "too short". Scoring already needs 60 ms, so this catches near misses. */
export const SHORT_HELD_MS = 80;
/** Hiss loudness under this share of the vowel loudness is "too quiet". */
export const QUIET_HISS_TO_VOWEL = 0.08;
/** A silence longer than this many ms between vowel and hiss counts as a pause (end-position words only). */
export const LONG_GAP_MS = 200;

/** Where the target sound sits in the word: from the word bank, else a guess from the spelling. */
function wordPosition(text: string, target: TargetSound): WordPosition | null {
  const lower = text.trim().toLowerCase();
  const known = WORD_BANK.find((w) => w.text.toLowerCase() === lower && w.target === target);
  if (known) return known.position;
  return lower.endsWith(target) ? 'end' : null;
}

/** The one most important thing the trace shows, or null when nothing stands out. */
function traceObservation(
  trace: TraceSummary,
  target: TargetSound,
  position: WordPosition | null,
): { message: string } | null {
  const other = target === 's' ? 'sh' : 's';
  // Drift is positive toward "s", so the wrong direction is negative for "s" and positive for "sh".
  const wrongWay = target === 's' ? -trace.drift : trace.drift;
  if (wrongWay >= SLIDE_DRIFT) {
    const startedRight = target === 's' ? trace.positionStart >= 0.5 : trace.positionStart < 0.5;
    return {
      message: startedRight
        ? `Your "${target}" started right, then slid toward "${other}". Keep it the same all the way through.`
        : `The hiss slid toward "${other}" as you held it. Try to keep it a steady "${target}".`,
    };
  }
  if (trace.heldMs < SHORT_HELD_MS) {
    return { message: `The "${target}" was too short. Hold it a little longer.` };
  }
  if (trace.hissToVowel < QUIET_HISS_TO_VOWEL) {
    return { message: `The "${target}" was very soft next to the vowel. Give it a bit more air.` };
  }
  if (position === 'end' && trace.gapMs !== null && trace.gapMs > LONG_GAP_MS) {
    return { message: `There was a long pause before the "${target}". Say the word in one smooth go.` };
  }
  return null;
}

/** Built-in feedback, used when there is no key or the AI call fails. Pure, so it is easy to test. */
export function feedbackFromRules(req: FeedbackRequest): CoachFeedback {
  const { target, recent, trace } = req;
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

  // With a sound trace, one specific observation beats the generic line. The next action stays as below.
  const seen = trace ? traceObservation(trace, target, wordPosition(req.word, target)) : null;
  if (last.verdict === 'hit') {
    if (seen) return say(seen.message, cues.touch, 'repeat');
    return say(`The "${target}" was there. Do it again to lock it in.`, null, 'repeat');
  }
  if (last.verdict === 'close') {
    return say(
      seen?.message ?? `There was a hiss, but it was nearer "${other}" than "${target}".`,
      cues.steps.join(' '),
      'repeat',
    );
  }
  if (missStreak) {
    return say(
      seen?.message ?? `No "${target}" yet. Try the sound by itself first, then the word.`,
      cues.shaping,
      'easier',
    );
  }
  return say(seen?.message ?? `No "${target}" heard that time. Make the hiss longer.`, cues.touch, 'repeat');
}

const FEEDBACK_SYSTEM = `You are a warm practice coach for a learner practicing the "s" or "sh" speech sound between speech therapy sessions.
You get numbers only, never audio. The app has already decided the verdict for the latest try (latestVerdict). Do not contradict it: if it is "hit" do not say it was missed, if it is "miss" or "close" do not say it was right.
Rules:
- One or two short, plain, kind sentences, at most 240 characters. Never say the learner is broken or needs fixing.
- "cue" is one thing to change with the mouth (at most 200 characters), or null. Base it on cueText when you can.
- This is not therapy and not a diagnosis. Do not use em dashes.
- "trace" (when present) is the shape of the sound over the latest try, boiled down to numbers. Fields:
  hissMs = how long the hiss lasted; heldMs = how much of it kept its loudness; positionStart, positionMid, positionEnd = where the hiss sat in the first, middle and last third (0 = "sh", 1 = "s"); drift = end minus start (negative means it slid toward "sh", positive toward "s"); steadiness = 0 (wobbly loudness) to 1 (smooth); hissToVowel = hiss loudness divided by vowel loudness (small means the hiss was soft); gapMs = silence between the vowel and the hiss, or null; vowelMs = length of the vowel.
- Describe at most ONE thing the trace shows, in everyday words, with no numbers and no jargon. Never use the words "pitch", "centroid" or "frequency", and never write units like ms or Hz.
- The mouth cue must come from cueText for that sound. You may shorten it or lightly reword it. Never invent a new mouth instruction.
- Never contradict the verdict. If the trace shows nothing notable, say so simply.
Reply with JSON only, no other text, in exactly this shape:
{"message": string, "cue": string | null}`;

/**
 * Steps 3 to 4 of the loop: the brain reads the scores from the last tries and says what to do next.
 * It receives numbers only (verdict, meter position, hiss length). It never receives audio.
 * The rules answer is always built first. Claude only rewords message and cue, see mergeFeedback.
 * Falls back to the rules answer on any error or after 3 seconds. Server side only.
 */
export function buildFeedbackPrompt(
  req: FeedbackRequest,
  rules: CoachFeedback,
): { system: string; user: string } {
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
    trace: req.trace ?? null,
    rulesMessage: rules.message,
    rulesCue: rules.cue,
    cueText: CUES[req.target],
  });
  return { system: FEEDBACK_SYSTEM, user };
}

export async function buildFeedback(req: FeedbackRequest): Promise<CoachFeedback> {
  const rules = feedbackFromRules(req);
  const { system, user } = buildFeedbackPrompt(req, rules);
  const reply = await askClaudeForJson({
    model: process.env.SEESPEAK_FEEDBACK_MODEL || 'claude-sonnet-5-5',
    system,
    user,
    maxTokens: 300,
    timeoutMs: 3_000,
  });
  return mergeFeedback(rules, reply);
}
