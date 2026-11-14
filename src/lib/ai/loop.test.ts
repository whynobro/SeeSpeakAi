import { describe, expect, it } from 'vitest';
import { feedbackFromRules } from '@/lib/ai/feedback';
import { planFromRules } from '@/lib/ai/plan';
import type { AssessmentReport, AttemptScore, Verdict } from '@/lib/types';

const report = (over: Partial<AssessmentReport>): AssessmentReport => ({
  source: 'therapist',
  therapistSounds: [],
  therapistNotes: '',
  profile: null,
  baseline: {},
  ageGroup: 'adult',
  interests: [],
  createdAt: '2026-11-14T00:00:00.000Z',
  ...over,
});
const score = (verdict: Verdict): AttemptScore => ({
  target: 's',
  verdict,
  heard: verdict === 'hit' ? 's' : verdict === 'close' ? 'sh' : null,
  meterPosition: null,
  hissMs: 100,
  confidence: 0.8,
  warnings: [],
});

describe('planFromRules', () => {
  it('scores s and sh from a therapist report and marks other sounds as not scored', () => {
    const plan = planFromRules(report({ therapistSounds: ['/s/', 'SH', 'r'] }));
    expect(plan.steps.map((s) => [s.sound, s.scored])).toEqual([
      ['s', true],
      ['sh', true],
      ['r', false],
    ]);
    expect(plan.steps[0].words.length).toBeGreaterThan(0);
    expect(plan.steps[2].words).toEqual([]);
  });
  it('uses the hearing check and the baseline from the in-app test', () => {
    const ling = { m: true, oo: true, ah: true, ee: true, sh: true, s: false };
    const plan = planFromRules(
      report({
        source: 'in-app-test',
        profile: { source: 'ling6', ling, createdAt: '' },
        baseline: { sh: 0.5 },
      }),
    );
    expect(plan.steps.map((s) => s.sound)).toEqual(['s', 'sh']);
  });
  it('never returns an empty plan and has no duplicate sounds', () => {
    expect(planFromRules(report({})).steps.length).toBe(1);
    expect(planFromRules(report({ therapistSounds: ['s', 's', 'S'] })).steps.length).toBe(1);
  });
});

describe('feedbackFromRules', () => {
  const ask = (verdicts: Verdict[]) =>
    feedbackFromRules({ target: 's', word: 'cats', recent: verdicts.map(score) });
  it('moves on after three hits in a row', () => {
    expect(ask(['miss', 'hit', 'hit', 'hit']).nextAction).toBe('next-word');
  });
  it('repeats after one hit', () => {
    expect(ask(['hit']).nextAction).toBe('repeat');
  });
  it('names the other sound and gives a cue when close', () => {
    const f = ask(['close']);
    expect(f.message).toContain('sh');
    expect(f.cue).toBeTruthy();
  });
  it('makes it easier after two misses', () => {
    expect(ask(['miss', 'miss']).nextAction).toBe('easier');
  });
  it('handles no tries yet', () => {
    expect(ask([]).nextAction).toBe('repeat');
  });
});
