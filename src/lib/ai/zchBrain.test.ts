import { describe, expect, it } from 'vitest';
import { feedbackFromRules } from '@/lib/ai/feedback';
import { planFromRules } from '@/lib/ai/plan';
import { mergePlan } from '@/lib/ai/validate';
import { progressFor } from '@/lib/store';
import type { AssessmentReport, Attempt, AttemptScore, TargetSound, Verdict } from '@/lib/types';

const report = (over: Partial<AssessmentReport>): AssessmentReport => ({
  source: 'therapist',
  therapistSounds: [],
  therapistNotes: '',
  profile: null,
  baseline: {},
  ageGroup: 'child',
  interests: ['animals'],
  createdAt: '2026-11-14T00:00:00.000Z',
  ...over,
});

const score = (target: TargetSound, verdict: Verdict, heard: TargetSound | null): AttemptScore => ({
  target,
  verdict,
  heard,
  meterPosition: null,
  hissMs: 100,
  confidence: 0.8,
  warnings: [],
});

describe('plan with z and ch', () => {
  it('scores z and ch from a therapist report, with words from the bank', () => {
    const plan = planFromRules(report({ therapistSounds: ['z', '/CH/', 'r'] }));
    expect(plan.steps.map((s) => [s.sound, s.scored])).toEqual([
      ['z', true],
      ['ch', true],
      ['r', false],
    ]);
    expect(plan.steps[0].words.every((w) => w.target === 'z')).toBe(true);
    expect(plan.steps[1].words.every((w) => w.target === 'ch')).toBe(true);
    expect(plan.steps[0].words.length).toBeGreaterThan(0);
  });

  it('adds z and ch from the starting test numbers', () => {
    const plan = planFromRules(report({ source: 'in-app-test', baseline: { z: 0.2, ch: 0.9 } }));
    expect(plan.steps.map((s) => s.sound)).toEqual(['z']);
  });

  it('checks themed words for z and ch steps with the pronunciation dictionary', () => {
    const rules = planFromRules(report({ therapistSounds: ['z', 'ch'] }));
    const ids = (sound: string) => rules.steps.find((s) => s.sound === sound)?.words.map((w) => w.id) ?? [];
    const merged = mergePlan(rules, {
      steps: [
        {
          sound: 'z',
          why: 'w',
          goal: 'g',
          wordIds: ids('z').slice(0, 5),
          newWords: ['pans', 'cats', 'zoos', 'lids'],
        },
        {
          sound: 'ch',
          why: 'w',
          goal: 'g',
          wordIds: ids('ch').slice(0, 5),
          newWords: ['chick', 'cheese', 'church'],
        },
      ],
    });
    const z = merged.steps.find((s) => s.sound === 'z')?.words.map((w) => w.id) ?? [];
    const ch = merged.steps.find((s) => s.sound === 'ch')?.words.map((w) => w.id) ?? [];
    expect(z).toContain('pans');
    expect(z).toContain('lids');
    expect(z).not.toContain('cats');
    expect(z).not.toContain('zoos');
    expect(ch).toContain('chick');
    expect(ch).not.toContain('cheese');
    expect(ch).not.toContain('church');
    expect(merged.steps.find((s) => s.sound === 'z')?.words.find((w) => w.id === 'pans')?.baseWord).toBe(
      'pan',
    );
  });
});

describe('feedback for z and ch', () => {
  const ask = (target: TargetSound, last: AttemptScore) =>
    feedbackFromRules({ target, word: 'dogs', recent: [last] });

  it('tells a "z" said as "s" to turn the voice on', () => {
    const f = ask('z', score('z', 'close', 's'));
    expect(f.message).toMatch(/buzz|voice/i);
    expect(f.cue).toContain('voice');
  });

  it('tells a "ch" said as "sh" to start with a pop', () => {
    const f = ask('ch', score('ch', 'close', 'sh'));
    expect(f.message).toMatch(/"t"/);
  });

  it('keeps the s message for s', () => {
    expect(ask('s', score('s', 'close', 'sh')).message).toContain('nearer "sh" than "s"');
  });

  it('uses no em dashes', () => {
    for (const t of ['z', 'ch'] as const) {
      const f = ask(t, score(t, 'close', t === 'z' ? 's' : 'sh'));
      expect(f.message).not.toContain(String.fromCharCode(0x2014));
    }
  });
});

describe('progress for z and ch', () => {
  it('counts tries per sound', () => {
    const attempt = (target: TargetSound, verdict: Verdict, n: number): Attempt => ({
      id: String(n),
      wordId: 'w',
      target,
      stage: 'use',
      createdAt: `2026-11-14T00:00:${String(n).padStart(2, '0')}.000Z`,
      score: score(target, verdict, null),
      channels: [],
    });
    const list = [attempt('z', 'hit', 1), attempt('z', 'miss', 2), attempt('ch', 'hit', 3)];
    expect(progressFor(list, 'z').attempts).toBe(2);
    expect(progressFor(list, 'ch').firstAccuracy).toBe(1);
  });
});
