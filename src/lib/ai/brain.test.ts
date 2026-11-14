import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildFeedback, feedbackFromRules } from '@/lib/ai/feedback';
import { buildPlan, planFromRules } from '@/lib/ai/plan';
import { parseJsonReply } from '@/lib/ai/client';
import { mergeFeedback, mergePlan } from '@/lib/ai/validate';
import { WORD_BANK } from '@/content/words';
import type { AssessmentReport, AttemptScore, FeedbackRequest } from '@/lib/types';

const report: AssessmentReport = {
  source: 'therapist',
  therapistSounds: ['s', 'sh', 'r'],
  therapistNotes: '',
  profile: null,
  baseline: {},
  ageGroup: 'child',
  interests: [],
  createdAt: '2026-11-14T00:00:00.000Z',
};
const rules = planFromRules(report);
const ids = (sound: string, n: number) =>
  WORD_BANK.filter((w) => w.target === sound)
    .slice(0, n)
    .map((w) => w.id);
const goodStep = (sound: string) => ({
  sound,
  why: `why ${sound}`,
  goal: `goal ${sound}`,
  wordIds: ids(sound, 5),
});

describe('mergePlan', () => {
  it('accepts a good reply', () => {
    const plan = mergePlan(rules, { summary: 'Hi there.', steps: ['s', 'sh', 'r'].map(goodStep) });
    expect(plan.source).toBe('ai');
    expect(plan.summary).toBe('Hi there.');
    expect(plan.steps[0].why).toBe('why s');
    expect(plan.steps[0].words.map((w) => w.id)).toEqual(ids('s', 5));
    expect(plan.steps[2].words).toEqual([]);
  });
  it('allows reordering and keeps left-out sounds at the end', () => {
    const plan = mergePlan(rules, { steps: [goodStep('sh')] });
    expect(plan.steps.map((s) => s.sound)).toEqual(['sh', 's', 'r']);
    expect(plan.source).toBe('ai');
  });
  it('ignores an invented sound', () => {
    const plan = mergePlan(rules, { steps: [goodStep('th'), goodStep('s')] });
    expect(plan.steps.map((s) => s.sound)).toEqual(['s', 'sh', 'r']);
  });
  it('never makes a non-target sound scored', () => {
    const plan = mergePlan(rules, { steps: [{ ...goodStep('r'), scored: true, wordIds: ids('s', 5) }] });
    const r = plan.steps.find((s) => s.sound === 'r');
    expect(r?.scored).toBe(false);
    expect(r?.words).toEqual([]);
    const flags = plan.steps.map((s) => [s.sound, s.scored]).sort();
    expect(flags).toEqual(rules.steps.map((s) => [s.sound, s.scored]).sort());
  });
  it('drops unknown ids and ids for the other sound', () => {
    const wordIds = ['nope', ...ids('sh', 2), ...ids('s', 4)];
    const plan = mergePlan(rules, { steps: [{ ...goodStep('s'), wordIds }] });
    expect(plan.steps[0].words.map((w) => w.id)).toEqual(ids('s', 4));
  });
  it('keeps rules words when fewer than 4 are valid', () => {
    const plan = mergePlan(rules, { steps: [{ ...goodStep('s'), wordIds: [...ids('s', 3), 'zzz'] }] });
    expect(plan.steps[0].words).toEqual(rules.steps[0].words);
  });
  it('falls back per field on long, empty or wrongly typed text', () => {
    const plan = mergePlan(rules, {
      summary: 'x'.repeat(301),
      steps: [{ sound: 's', why: '   ', goal: 42, wordIds: 'cats' }],
    });
    expect(plan.summary).toBe(rules.summary);
    expect(plan.steps[0].why).toBe(rules.steps[0].why);
    expect(plan.steps[0].goal).toBe(rules.steps[0].goal);
    expect(plan.steps[0].words).toEqual(rules.steps[0].words);
  });
  it('returns the rules plan for null, wrong types and useless objects', () => {
    for (const bad of [null, undefined, 'text', 7, [], {}, { steps: 'no' }, { steps: [null, 3] }]) {
      expect(mergePlan(rules, bad)).toBe(rules);
    }
    expect(rules.source).toBe('rules');
  });
  it('replaces em dashes', () => {
    const plan = mergePlan(rules, { summary: `One ${String.fromCharCode(0x2014)} two.` });
    expect(plan.summary).toBe('One, two.');
  });
});

const att = (verdict: AttemptScore['verdict']): AttemptScore => ({
  target: 's',
  verdict,
  heard: null,
  meterPosition: null,
  hissMs: 100,
  confidence: 0.8,
  warnings: [],
});
const req: FeedbackRequest = { target: 's', word: 'cats', recent: [att('miss')] };

describe('mergeFeedback', () => {
  const base = feedbackFromRules(req);
  it('accepts a good reply and keeps nextAction from the rules', () => {
    const f = mergeFeedback(base, { message: 'Nice try.', cue: 'Smile.', nextAction: 'next-stage' });
    expect(f).toEqual({ source: 'ai', message: 'Nice try.', cue: 'Smile.', nextAction: base.nextAction });
  });
  it('allows a null cue and keeps the rules cue when the cue is bad', () => {
    expect(mergeFeedback(base, { message: 'Ok.', cue: null }).cue).toBeNull();
    expect(mergeFeedback(base, { message: 'Ok.', cue: 'x'.repeat(201) }).cue).toBe(base.cue);
    expect(mergeFeedback(base, { message: 'Ok.', cue: 5 }).cue).toBe(base.cue);
  });
  it('returns the rules feedback for a bad message or bad input', () => {
    for (const bad of [null, 'x', [], {}, { message: '' }, { message: 3 }, { message: 'x'.repeat(241) }]) {
      expect(mergeFeedback(base, bad)).toBe(base);
    }
    expect(base.source).toBe('rules');
  });
});

describe('parseJsonReply', () => {
  it('reads plain and fenced json, and rejects the rest', () => {
    expect(parseJsonReply('{"a":1}')).toEqual({ a: 1 });
    expect(parseJsonReply('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(parseJsonReply('not json')).toBeNull();
  });
});

describe('no API key', () => {
  let saved: string | undefined;
  beforeEach(() => {
    saved = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });
  afterEach(() => {
    if (saved !== undefined) process.env.ANTHROPIC_API_KEY = saved;
  });
  it('buildPlan returns the rules plan', async () => {
    expect((await buildPlan(report)).source).toBe('rules');
  });
  it('buildFeedback returns the rules feedback', async () => {
    expect((await buildFeedback(req)).source).toBe('rules');
  });
});
