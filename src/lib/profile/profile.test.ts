import { describe, expect, it } from 'vitest';
import { PROFILE_LIMITATIONS, pickTargets } from '@/lib/profile';
import type { HearingProfile, LingSound, TargetPick } from '@/lib/types';

const NOW = '2026-11-14T00:00:00.000Z';

function ling(heard: Partial<Record<LingSound, boolean>>): HearingProfile {
  return {
    source: 'ling6',
    ling: { m: true, oo: true, ah: true, ee: true, sh: true, s: true, ...heard },
    createdAt: NOW,
  };
}

function audiogram(thresholdsDb: HearingProfile['thresholdsDb']): HearingProfile {
  return { source: 'audiogram', thresholdsDb, createdAt: NOW };
}

function pick(picks: TargetPick[], sound: 's' | 'sh'): TargetPick {
  const p = picks.find((x) => x.sound === sound);
  if (!p) throw new Error('missing pick');
  return p;
}

describe('pickTargets: Ling Six', () => {
  it('heard both: both low', () => {
    const p = pickTargets(ling({}));
    expect(pick(p, 's').risk).toBe('low');
    expect(pick(p, 'sh').risk).toBe('low');
  });

  it('missed "s" only: s high, sh low, s first', () => {
    const p = pickTargets(ling({ s: false }));
    expect(pick(p, 's').risk).toBe('high');
    expect(pick(p, 'sh').risk).toBe('low');
    expect(p[0].sound).toBe('s');
    expect(p[0].reason).toContain('did not hear the "s"');
  });

  it('missed "sh": both high', () => {
    const p = pickTargets(ling({ sh: false, s: false }));
    expect(pick(p, 's').risk).toBe('high');
    expect(pick(p, 'sh').risk).toBe('high');
  });

  it('missed "sh" but heard "s": sh high, s low, sh first', () => {
    const p = pickTargets(ling({ sh: false }));
    expect(pick(p, 'sh').risk).toBe('high');
    expect(pick(p, 's').risk).toBe('low');
    expect(p[0].sound).toBe('sh');
  });
});

describe('pickTargets: audiogram', () => {
  it('mean above 55 is high, 35 to 55 is some, below 35 is low', () => {
    const p = pickTargets(audiogram({ 2000: 20, 4000: 60, 6000: 60, 8000: 60 }));
    expect(pick(p, 's').risk).toBe('high');
    expect(pick(p, 'sh').risk).toBe('some'); // mean of 20 and 60 is 40
    const low = pickTargets(audiogram({ 2000: 10, 4000: 20, 6000: 30, 8000: 40 }));
    expect(pick(low, 's').risk).toBe('low'); // mean 30
    expect(pick(low, 'sh').risk).toBe('low'); // mean 15
  });

  it('the cut-offs are exact: 55 is some, 35 is some, 34 is low', () => {
    expect(pick(pickTargets(audiogram({ 4000: 55, 6000: 55, 8000: 55 })), 's').risk).toBe('some');
    expect(pick(pickTargets(audiogram({ 4000: 56, 6000: 56, 8000: 56 })), 's').risk).toBe('high');
    expect(pick(pickTargets(audiogram({ 4000: 35, 6000: 35, 8000: 35 })), 's').risk).toBe('some');
    expect(pick(pickTargets(audiogram({ 4000: 34, 6000: 34, 8000: 34 })), 's').risk).toBe('low');
  });

  it('skips missing frequencies and returns some when none are present', () => {
    const p = pickTargets(audiogram({ 4000: 70 }));
    expect(pick(p, 's').risk).toBe('high');
    expect(pick(p, 'sh').risk).toBe('high');
    const none = pickTargets(audiogram({ 250: 10, 500: 10 }));
    expect(pick(none, 's').risk).toBe('some');
    expect(pick(none, 'sh').risk).toBe('some');
  });
});

describe('pickTargets: fall through and sorting', () => {
  it('falls through to the audiogram when ling is missing', () => {
    const p = pickTargets({
      source: 'ling6',
      thresholdsDb: { 4000: 70, 6000: 70, 8000: 70 },
      createdAt: NOW,
    });
    expect(pick(p, 's').risk).toBe('high');
  });

  it('returns some with a "not done" reason when both are missing', () => {
    const p = pickTargets({ source: 'ling6', createdAt: NOW });
    expect(p).toHaveLength(2);
    for (const x of p) {
      expect(x.risk).toBe('some');
      expect(x.reason).toMatch(/not been done/);
    }
  });

  it('sorts riskiest first and always returns exactly two picks', () => {
    const profiles: HearingProfile[] = [
      ling({}),
      ling({ s: false }),
      ling({ sh: false }),
      audiogram({ 2000: 80, 4000: 10, 6000: 10, 8000: 10 }),
      audiogram({}),
      { source: 'audiogram', createdAt: NOW },
    ];
    const rank = { high: 0, some: 1, low: 2 };
    for (const profile of profiles) {
      const p = pickTargets(profile);
      expect(p).toHaveLength(2);
      expect(new Set(p.map((x) => x.sound))).toEqual(new Set(['s', 'sh']));
      expect(rank[p[0].risk]).toBeLessThanOrEqual(rank[p[1].risk]);
      for (const x of p) expect(x.reason).not.toContain(String.fromCharCode(0x2014));
    }
    // sh is the riskier one here, so it must come first.
    expect(pickTargets(profiles[3])[0].sound).toBe('sh');
  });
});

describe('PROFILE_LIMITATIONS', () => {
  it('has 3 or 4 strings', () => {
    expect(PROFILE_LIMITATIONS.length).toBeGreaterThanOrEqual(3);
    expect(PROFILE_LIMITATIONS.length).toBeLessThanOrEqual(4);
  });
});
