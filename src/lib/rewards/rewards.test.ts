import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { balance, buy, equip, loadWallet, owned, pointsFor, SHOP_ITEMS, streakFor } from '@/lib/rewards';
import type { Attempt, Verdict } from '@/lib/types';

/** A try on a fixed local day and hour. Month is 0-based: 10 = November. */
function attempt(day: number, verdict: Verdict = 'miss', n = 0): Attempt {
  return {
    id: `a${day}-${n}`,
    wordId: 'cats',
    target: 's',
    stage: 'use',
    createdAt: new Date(2026, 10, day, 10, n).toISOString(),
    score: { target: 's', verdict, heard: null, meterPosition: null, hissMs: 0, confidence: 1, warnings: [] },
    channels: [],
  };
}
function many(day: number, count: number, verdict: Verdict = 'miss'): Attempt[] {
  return Array.from({ length: count }, (_, i) => attempt(day, verdict, i));
}
const TODAY = new Date(2026, 10, 14, 15, 0);

describe('pointsFor', () => {
  it('is 0 with no tries', () => expect(pointsFor([])).toBe(0));
  it('gives 1 point for a miss and a close', () => {
    expect(pointsFor([attempt(14, 'miss'), attempt(14, 'close', 1)])).toBe(2);
  });
  it('gives 3 points for a hit', () => expect(pointsFor([attempt(14, 'hit')])).toBe(3));
  it('adds 5 once when a day reaches 10 tries', () => {
    expect(pointsFor(many(14, 9))).toBe(9);
    expect(pointsFor(many(14, 10))).toBe(15);
    expect(pointsFor(many(14, 25))).toBe(30);
  });
  it('gives the bonus again on a different day', () => {
    expect(pointsFor([...many(13, 10), ...many(14, 10)])).toBe(30);
  });
  it('does not add tries from two days together', () => {
    expect(pointsFor([...many(13, 5), ...many(14, 5)])).toBe(10);
  });
  it('still counts a try with an unreadable date', () => {
    const bad = { ...attempt(14), createdAt: 'nonsense' };
    expect(pointsFor([bad])).toBe(1);
  });
});

describe('streakFor', () => {
  it('is 0 with no tries', () => {
    expect(streakFor([], TODAY)).toEqual({ days: 0, practicedToday: false });
  });
  it('counts today alone as 1', () => {
    expect(streakFor([attempt(14)], TODAY)).toEqual({ days: 1, practicedToday: true });
  });
  it('counts consecutive days', () => {
    expect(streakFor([attempt(12), attempt(13), attempt(14)], TODAY).days).toBe(3);
  });
  it('does not break when today has no try yet', () => {
    expect(streakFor([attempt(12), attempt(13)], TODAY)).toEqual({ days: 2, practicedToday: false });
  });
  it('forgives one missed day', () => {
    expect(streakFor([attempt(11), attempt(12), attempt(14)], TODAY).days).toBe(3);
  });
  it('forgives one missed day when today is still open', () => {
    expect(streakFor([attempt(11), attempt(12), attempt(13)], new Date(2026, 10, 15, 9)).days).toBe(3);
    expect(streakFor([attempt(11), attempt(12)], TODAY).days).toBe(2);
  });
  it('resets after two missed days in a row', () => {
    expect(streakFor([attempt(9), attempt(10), attempt(13), attempt(14)], TODAY).days).toBe(2);
  });
  it('resets when the last try was three days ago', () => {
    expect(streakFor([attempt(10), attempt(11)], TODAY).days).toBe(0);
  });
  it('counts many tries on one day as one day', () => {
    expect(streakFor(many(14, 12), TODAY).days).toBe(1);
  });
  it('works across a month end', () => {
    const a = new Date(2026, 9, 31, 10).toISOString();
    const b = new Date(2026, 10, 1, 10).toISOString();
    const list = [
      { ...attempt(1), createdAt: a },
      { ...attempt(1), createdAt: b },
    ];
    expect(streakFor(list, new Date(2026, 10, 1, 20)).days).toBe(2);
  });
});

describe('wallet', () => {
  let store: Record<string, string>;
  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  function givePoints(count: number) {
    // `count` misses on different days of one 40-day span, so no daily bonus: 1 point each.
    const list = Array.from({ length: count }, (_, i) => ({
      ...attempt(1, 'miss', i % 50),
      id: `p${i}`,
      createdAt: new Date(2026, 5, 1 + Math.floor(i / 5), 10, i % 5).toISOString(),
    }));
    store['seespeak.attempts'] = JSON.stringify(list);
  }

  it('has a first item you can afford after one short session', () => {
    expect(Math.min(...SHOP_ITEMS.map((i) => i.price))).toBeLessThanOrEqual(15);
  });
  it('has 6 to 9 cosmetic items with unique ids and positive prices', () => {
    expect(SHOP_ITEMS.length).toBeGreaterThanOrEqual(6);
    expect(SHOP_ITEMS.length).toBeLessThanOrEqual(9);
    expect(new Set(SHOP_ITEMS.map((i) => i.id)).size).toBe(SHOP_ITEMS.length);
    for (const i of SHOP_ITEMS) expect(i.price).toBeGreaterThan(0);
  });
  it('starts empty', () => {
    expect(loadWallet()).toEqual({ spent: 0, owned: [], equipped: {} });
    expect(balance()).toBe(0);
  });
  it('refuses to buy with too few points and spends nothing', () => {
    givePoints(10);
    expect(buy('hat-beanie')).toBeNull();
    expect(loadWallet().spent).toBe(0);
    expect(owned('hat-beanie')).toBe(false);
  });
  it('buys with enough points and lowers the balance', () => {
    givePoints(20);
    const w = buy('hat-beanie');
    expect(w?.owned).toEqual(['hat-beanie']);
    expect(balance()).toBe(5);
    expect(owned('hat-beanie')).toBe(true);
  });
  it('does not charge twice for the same item', () => {
    givePoints(40);
    expect(buy('hat-beanie')).not.toBeNull();
    expect(buy('hat-beanie')).toBeNull();
    expect(balance()).toBe(25);
  });
  it('returns null for an unknown item', () => {
    givePoints(100);
    expect(buy('nope')).toBeNull();
  });
  it('equips only owned items in their own slot, and can take them off', () => {
    givePoints(40);
    expect(equip('hat', 'hat-beanie')).toBeNull();
    buy('hat-beanie');
    expect(equip('meter', 'hat-beanie')).toBeNull();
    expect(equip('hat', 'hat-beanie')?.equipped).toEqual({ hat: 'hat-beanie' });
    expect(loadWallet().equipped.hat).toBe('hat-beanie');
    expect(equip('hat', null)?.equipped).toEqual({});
  });
  it('is safe with bad JSON and wrong shapes', () => {
    store['seespeak.wallet'] = '{not json';
    expect(loadWallet()).toEqual({ spent: 0, owned: [], equipped: {} });
    store['seespeak.wallet'] = JSON.stringify({
      spent: -5,
      owned: ['hat-beanie', 'ghost', 7],
      equipped: { hat: 'meter-night' },
    });
    expect(loadWallet()).toEqual({ spent: 0, owned: ['hat-beanie'], equipped: {} });
    store['seespeak.wallet'] = '[1,2]';
    expect(loadWallet().owned).toEqual([]);
  });
  it('is safe when storage is missing', () => {
    vi.unstubAllGlobals();
    vi.stubGlobal('localStorage', undefined);
    expect(loadWallet().owned).toEqual([]);
    expect(buy('hat-beanie')).toBeNull();
    expect(equip('hat', null)).not.toBeUndefined();
  });
  it('is safe when storage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    expect(loadWallet().spent).toBe(0);
    expect(buy('hat-beanie')).toBeNull();
  });
});
