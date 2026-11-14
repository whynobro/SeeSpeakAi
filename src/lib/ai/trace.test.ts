import { describe, expect, it } from 'vitest';
import {
  LONG_GAP_MS,
  QUIET_HISS_TO_VOWEL,
  SHORT_HELD_MS,
  buildFeedbackPrompt,
  feedbackFromRules,
} from '@/lib/ai/feedback';
import type { AttemptScore, FeedbackRequest, TargetSound, TraceSummary, Verdict } from '@/lib/types';

const att = (verdict: Verdict, target: TargetSound = 's'): AttemptScore => ({
  target,
  verdict,
  heard: null,
  meterPosition: null,
  hissMs: 200,
  confidence: 0.8,
  warnings: [],
});
// A healthy trace for an "s": nothing notable.
const good: TraceSummary = {
  hissMs: 250,
  heldMs: 200,
  positionStart: 0.8,
  positionMid: 0.8,
  positionEnd: 0.8,
  drift: 0,
  steadiness: 0.9,
  hissToVowel: 0.25,
  gapMs: 40,
  vowelMs: 200,
};
const ask = (
  verdicts: Verdict[],
  trace: Partial<TraceSummary> | null,
  target: TargetSound = 's',
  word = 'cats',
): ReturnType<typeof feedbackFromRules> => {
  const req: FeedbackRequest = {
    target,
    word,
    recent: verdicts.map((v) => att(v, target)),
    trace: trace === null ? null : { ...good, ...trace },
  };
  return feedbackFromRules(req);
};

describe('feedbackFromRules with a sound trace', () => {
  it('names a slide toward the other sound', () => {
    const f = ask(['close'], { positionStart: 0.8, positionEnd: 0.3, drift: -0.5 });
    expect(f.message).toContain('started right');
    expect(f.message).toContain('slid toward "sh"');
    const sh = ask(['close'], { positionStart: 0.2, positionEnd: 0.7, drift: 0.5 }, 'sh', 'ship');
    expect(sh.message).toContain('slid toward "s"');
  });
  it('does not call a slide in the right direction a flaw', () => {
    expect(ask(['hit'], { drift: 0.5 }).message).toBe('The "s" was there. Do it again to lock it in.');
  });
  it('names a hiss that was too short', () => {
    expect(ask(['miss'], { heldMs: SHORT_HELD_MS - 10 }).message).toContain('too short');
  });
  it('names a hiss that was too quiet', () => {
    expect(ask(['close'], { hissToVowel: QUIET_HISS_TO_VOWEL - 0.03 }).message).toContain('soft');
  });
  it('names a long pause only for an end-position word', () => {
    expect(ask(['miss'], { gapMs: LONG_GAP_MS + 100 }).message).toContain('pause');
    expect(ask(['miss'], { gapMs: LONG_GAP_MS + 100 }, 's', 'sun').message).not.toContain('pause');
  });
  it('reports one observation only, the slide first', () => {
    const f = ask(['close'], { drift: -0.6, positionStart: 0.8, heldMs: 10, hissToVowel: 0.01 });
    expect(f.message).toContain('slid');
    expect(f.message).not.toContain('short');
  });
  it('flags a hit with a flaw but keeps the next action', () => {
    const f = ask(['hit'], { heldMs: 70 });
    expect(f.message).toContain('too short');
    expect(f.nextAction).toBe('repeat');
  });
  it('keeps the generic messages with no trace or a healthy one', () => {
    expect(ask(['close'], null).message).toContain('nearer "sh"');
    expect(ask(['close'], {}).message).toContain('nearer "sh"');
    expect(ask(['hit'], {}).cue).toBeNull();
  });
  it('never changes the next action', () => {
    const flaw = { heldMs: 10 };
    for (const v of [['miss', 'miss'], ['hit', 'hit', 'hit'], ['close'], ['hit']] as Verdict[][]) {
      expect(ask(v, flaw).nextAction).toBe(ask(v, null).nextAction);
    }
  });
});

describe('buildFeedbackPrompt', () => {
  it('puts the trace and the field explanations in what Claude sees', () => {
    const req: FeedbackRequest = { target: 's', word: 'cats', recent: [att('close')], trace: good };
    const { system, user } = buildFeedbackPrompt(req, feedbackFromRules(req));
    expect(JSON.parse(user).trace).toEqual(good);
    for (const field of Object.keys(good)) expect(system).toContain(field);
    expect(system).toContain('ONE thing');
    expect(system).toContain('Never contradict the verdict');
  });
  it('sends null when there is no trace', () => {
    const req: FeedbackRequest = { target: 's', word: 'cats', recent: [att('miss')] };
    expect(JSON.parse(buildFeedbackPrompt(req, feedbackFromRules(req)).user).trace).toBeNull();
  });
});
