import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  checkAdultCode,
  clearAdultCode,
  hasAdultCode,
  loadOverrides,
  saveOverride,
  setAdultCode,
} from '@/lib/override';
import { clearAll, loadAttempts, progressFor } from '@/lib/store';

/** A small stand-in for the browser's localStorage, since tests run in plain Node. */
function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (key) => void map.delete(key),
    setItem: (key, value) => void map.set(key, String(value)),
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage());
});

describe('adult code', () => {
  it('starts with no code, and nothing checks as right', () => {
    expect(hasAdultCode()).toBe(false);
    expect(checkAdultCode('1234')).toBe(false);
  });

  it('sets, checks and clears a code', () => {
    expect(setAdultCode('4821')).toBe(true);
    expect(hasAdultCode()).toBe(true);
    expect(checkAdultCode('4821')).toBe(true);
    expect(checkAdultCode('4822')).toBe(false);
    clearAdultCode();
    expect(hasAdultCode()).toBe(false);
    expect(checkAdultCode('4821')).toBe(false);
  });

  it('accepts 4 to 6 digits', () => {
    for (const code of ['0000', '12345', '123456']) {
      expect(setAdultCode(code)).toBe(true);
      expect(checkAdultCode(code)).toBe(true);
    }
  });

  it('rejects codes that are too short, too long or not all digits', () => {
    for (const code of ['', '123', '1234567', 'abcd', '12a4', '12 34', '١٢٣٤', '12.5']) {
      expect(setAdultCode(code)).toBe(false);
    }
    expect(hasAdultCode()).toBe(false);
  });

  it('keeps the old code when a bad new one is rejected', () => {
    setAdultCode('1111');
    expect(setAdultCode('12')).toBe(false);
    expect(checkAdultCode('1111')).toBe(true);
  });

  it('replaces the old code when a new one is set', () => {
    setAdultCode('1111');
    setAdultCode('2222');
    expect(checkAdultCode('1111')).toBe(false);
    expect(checkAdultCode('2222')).toBe(true);
  });

  it('does not keep the code as plain text', () => {
    setAdultCode('4821');
    const saved = [...Array(localStorage.length).keys()]
      .map((i) => localStorage.getItem(localStorage.key(i)!))
      .join('|');
    expect(saved).not.toContain('4821');
  });
});

describe('overrides', () => {
  it('saves and loads overrides, oldest first', () => {
    expect(loadOverrides()).toEqual([]);
    saveOverride({
      wordId: 'cats',
      target: 's',
      level: 'start',
      tier: 'silver',
      at: '2026-11-14T10:00:00.000Z',
    });
    saveOverride({ wordId: 'sun', target: 's', at: '2026-11-14T10:01:00.000Z' });
    const list = loadOverrides();
    expect(list).toHaveLength(2);
    expect(list[0]).toEqual({
      wordId: 'cats',
      target: 's',
      level: 'start',
      tier: 'silver',
      at: '2026-11-14T10:00:00.000Z',
    });
    expect(list[1].level).toBeUndefined();
  });

  it('drops saved entries that are not valid overrides', () => {
    localStorage.setItem(
      'seespeak.overrides',
      JSON.stringify([
        { wordId: 'cats', target: 'x', at: 'now' },
        'junk',
        { wordId: 'sun', target: 'z', at: 'now' },
      ]),
    );
    expect(loadOverrides()).toEqual([{ wordId: 'sun', target: 'z', at: 'now' }]);
  });

  it('does not touch saved tries or progress', () => {
    saveOverride({ wordId: 'cats', target: 's', at: '2026-11-14T10:00:00.000Z' });
    expect(loadAttempts()).toEqual([]);
    expect(progressFor(loadAttempts(), 's').attempts).toBe(0);
  });
});

describe('clearAll', () => {
  it('removes the code and the overrides', () => {
    setAdultCode('4821');
    saveOverride({ wordId: 'cats', target: 's', at: '2026-11-14T10:00:00.000Z' });
    clearAll();
    expect(hasAdultCode()).toBe(false);
    expect(loadOverrides()).toEqual([]);
  });
});
