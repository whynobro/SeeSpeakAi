import { describe, expect, it } from 'vitest';
import { planFromRules } from '@/lib/ai/plan';
import { mergePlan } from '@/lib/ai/validate';
import type { AssessmentReport } from '@/lib/types';

const report: AssessmentReport = {
  source: 'therapist',
  therapistSounds: ['s', 'sh', 'r'],
  therapistNotes: '',
  profile: null,
  baseline: {},
  ageGroup: 'child',
  interests: ['soccer'],
  createdAt: '2026-11-14T00:00:00.000Z',
};
const rules = planFromRules(report);
const bankIds = (sound: string) => rules.steps.find((s) => s.sound === sound)?.words.map((w) => w.id) ?? [];
const step = (sound: string, extra: Record<string, unknown> = {}) => ({
  sound,
  why: `why ${sound}`,
  goal: `goal ${sound}`,
  wordIds: bankIds(sound).slice(0, 5),
  ...extra,
});
const wordsOf = (plan: ReturnType<typeof mergePlan>, sound: string) =>
  plan.steps.find((s) => s.sound === sound)?.words.map((w) => w.id) ?? [];

describe('themed words in mergePlan', () => {
  it('uses good themed words, then fills with bank words up to 8', () => {
    const plan = mergePlan(rules, {
      steps: [step('s', { newWords: ['pass', 'kicks', 'nets', 'boots'] }), step('sh'), step('r')],
    });
    const ids = wordsOf(plan, 's');
    expect(ids).toHaveLength(8);
    for (const w of ['pass', 'kicks', 'nets', 'boots']) expect(ids).toContain(w);
    const kicks = plan.steps[0].words.find((w) => w.id === 'kicks');
    expect(kicks).toMatchObject({
      target: 's',
      position: 'end',
      baseWord: 'kick',
      contrastWord: null,
      sign: null,
    });
    // Grammar endings come first.
    const firstNonGrammar = plan.steps[0].words.findIndex((w) => w.baseWord === null);
    expect(plan.steps[0].words.slice(firstNonGrammar).every((w) => w.baseWord === null)).toBe(true);
  });

  it('keeps at most 6 themed words and drops repeats', () => {
    const plan = mergePlan(rules, {
      steps: [
        step('s', {
          newWords: ['pass', 'Pass', 'kicks', 'nets', 'boots', 'maps', 'bus', 'sun', 'soap', 'sock'],
        }),
      ],
    });
    const ids = wordsOf(plan, 's');
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(8);
    expect(ids.filter((id) => ['pass', 'kicks', 'nets', 'boots', 'maps', 'bus'].includes(id))).toHaveLength(
      6,
    );
  });

  it('drops dogs, sugar and a made-up word for an s step', () => {
    const plan = mergePlan(rules, {
      steps: [step('s', { newWords: ['dogs', 'sugar', 'blorptastic', 'pass'] })],
    });
    const ids = wordsOf(plan, 's');
    expect(ids).toContain('pass');
    for (const w of ['dogs', 'sugar', 'blorptastic']) expect(ids).not.toContain(w);
  });

  it('drops a word with the wrong sound for the step', () => {
    const plan = mergePlan(rules, { steps: [step('s', { newWords: ['ship', 'fish'] }), step('sh')] });
    expect(wordsOf(plan, 's')).toEqual(bankIds('s').slice(0, 5));
    const sh = mergePlan(rules, { steps: [step('sh', { newWords: ['pass', 'shot'] })] });
    expect(wordsOf(sh, 'sh')).toContain('shot');
    expect(wordsOf(sh, 'sh')).not.toContain('pass');
  });

  it('ignores newWords on a step that is not scored', () => {
    const plan = mergePlan(rules, { steps: [step('r', { wordIds: [], newWords: ['pass', 'shot'] })] });
    expect(plan.steps.find((s) => s.sound === 'r')?.words).toEqual([]);
  });

  it("equals today's result with no newWords, or when nothing passes", () => {
    const base = { summary: 'Hi.', steps: [step('s'), step('sh'), step('r', { wordIds: [] })] };
    const plain = mergePlan(rules, base);
    expect(wordsOf(plain, 's')).toEqual(bankIds('s').slice(0, 5));
    const allBad = mergePlan(rules, {
      ...base,
      steps: [step('s', { newWords: ['dogs', 'sugar', 'zzzz'] }), step('sh'), step('r', { wordIds: [] })],
    });
    expect(allBad).toEqual(plain);
  });

  it('ignores newWords when themed words are switched off (no interests)', () => {
    const json = { steps: [step('s', { newWords: ['pass', 'kicks'] })] };
    const off = mergePlan(rules, json, false);
    expect(wordsOf(off, 's')).toEqual(bankIds('s').slice(0, 5));
  });

  it('handles junk in newWords', () => {
    const plan = mergePlan(rules, { steps: [step('s', { newWords: [1, null, {}, 'pass'] })] });
    expect(wordsOf(plan, 's')).toContain('pass');
    expect(wordsOf(mergePlan(rules, { steps: [step('s', { newWords: 'pass' })] }), 's')).toEqual(
      bankIds('s').slice(0, 5),
    );
  });
});
