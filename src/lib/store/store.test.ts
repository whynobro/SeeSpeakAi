import { describe, expect, it } from 'vitest';
import { loadAttempts, loadProfile, loadSettings, progressFor } from '@/lib/store';
import type { Attempt, TargetSound, Verdict } from '@/lib/types';

function attempt(n: number, verdict: Verdict, target: TargetSound = 's'): Attempt {
  return {
    id: `a${n}`,
    wordId: 'cats',
    target,
    stage: 'use',
    createdAt: new Date(2026, 0, 1, 0, n).toISOString(),
    score: { target, verdict, heard: null, meterPosition: null, hissMs: 0, confidence: 1, warnings: [] },
    channels: [],
  };
}

describe('progressFor', () => {
  it('is empty with no tries', () => {
    expect(progressFor([], 's')).toEqual({
      sound: 's',
      attempts: 0,
      firstAccuracy: null,
      latestAccuracy: null,
    });
  });

  it('is 1 when every try is a hit', () => {
    const list = Array.from({ length: 5 }, (_, i) => attempt(i, 'hit'));
    const p = progressFor(list, 's');
    expect(p.attempts).toBe(5);
    expect(p.firstAccuracy).toBe(1);
    expect(p.latestAccuracy).toBe(1);
  });

  it('shows improvement', () => {
    const list = [
      ...Array.from({ length: 10 }, (_, i) => attempt(i, i < 2 ? 'hit' : 'miss')),
      ...Array.from({ length: 10 }, (_, i) => attempt(10 + i, i < 9 ? 'hit' : 'close')),
    ];
    const p = progressFor(list, 's');
    expect(p.firstAccuracy).toBeCloseTo(0.2);
    expect(p.latestAccuracy).toBeCloseTo(0.9);
  });

  it('ignores the other sound', () => {
    const list = [attempt(0, 'hit', 'sh'), attempt(1, 'miss', 's')];
    expect(progressFor(list, 's').attempts).toBe(1);
    expect(progressFor(list, 's').firstAccuracy).toBe(0);
    expect(progressFor(list, 'sh').firstAccuracy).toBe(1);
  });

  it('sorts unsorted input by time', () => {
    const list = [attempt(3, 'hit'), attempt(0, 'miss'), attempt(2, 'hit'), attempt(1, 'miss')];
    const p = progressFor(list, 's');
    expect(p.attempts).toBe(4);
    // Fewer than 20 tries: both windows cover all four.
    expect(p.firstAccuracy).toBe(0.5);
    const many = [
      ...Array.from({ length: 12 }, (_, i) => attempt(20 + i, 'hit')),
      ...Array.from({ length: 10 }, (_, i) => attempt(i, 'miss')),
    ];
    const q = progressFor(many, 's');
    expect(q.firstAccuracy).toBe(0);
    expect(q.latestAccuracy).toBe(1);
  });
});

describe('load functions without localStorage', () => {
  it('return defaults', () => {
    expect(typeof localStorage).toBe('undefined');
    expect(loadProfile()).toBeNull();
    expect(loadAttempts()).toEqual([]);
    expect(loadSettings()).toEqual({ nickname: '', showSigns: false, channels: ['color', 'vibration'] });
  });
});
