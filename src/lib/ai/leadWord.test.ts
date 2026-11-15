import { describe, expect, it } from 'vitest';
import { planFromRules, stepWords } from '@/lib/ai/rulesPlan';
import { wordsFor } from '@/content/words';

describe('built-in plan lead words', () => {
  it('starts "s" on "sip" and "sh" on "ship", keeping the count and no repeats', () => {
    for (const [sound, lead] of [
      ['s', 'sip'],
      ['sh', 'ship'],
    ] as const) {
      const words = stepWords(sound, 8);
      expect(words[0].id).toBe(lead);
      expect(words).toHaveLength(8);
      expect(new Set(words.map((w) => w.id)).size).toBe(8);
      for (const w of words) expect(w.target).toBe(sound);
    }
  });

  it('leaves sounds with no lead word in bank order', () => {
    expect(stepWords('z', 8)).toEqual(wordsFor('z', 8));
  });

  it('the Try it now plan (s and sh from a therapist) opens on "sip"', () => {
    const plan = planFromRules({
      source: 'therapist',
      therapistSounds: ['s', 'sh'],
      therapistNotes: '',
      profile: null,
      baseline: {},
      ageGroup: 'teen',
      interests: [],
      createdAt: '2026-11-14T00:00:00.000Z',
    });
    expect(plan.steps[0].words[0].id).toBe('sip');
    expect(plan.steps[1].words[0].id).toBe('ship');
  });
});
