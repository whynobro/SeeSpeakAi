import { describe, expect, it } from 'vitest';
import { isSlushyHiss, scoreAttempt } from '@/lib/scoring';
import { LISP_METER_POSITION, S_FOCUS_FLATNESS_MAX } from '@/lib/scoring/constants';
import fixture from '@/lib/scoring/fixtures/real-lisp-tries.json';
import type { FrameFeatures, PracticeWord, TargetSound, WordPosition } from '@/lib/types';

interface Try {
  name: string;
  word: string;
  target: TargetSound;
  position: WordPosition;
  kind: 'clear' | 'slushy';
  frames: number[][];
}

const tries = (fixture as { tries: Try[] }).tries;
const clear = tries.filter((t) => t.kind === 'clear');
const slushy = tries.filter((t) => t.kind === 'slushy');

function unpack(packed: number[][]): FrameFeatures[] {
  return packed.map(([tMs, level, hissRatio, centroidHz, flatness, voicing]) => ({
    tMs,
    level,
    hissLevel: 0,
    hissRatio,
    centroidHz: centroidHz < 0 ? null : centroidHz,
    flatness: flatness < 0 ? undefined : flatness,
    voicing,
  }));
}

function wordOf(t: Try, target: TargetSound = t.target): PracticeWord {
  return {
    id: t.word,
    text: t.word,
    target,
    position: t.position,
    baseWord: null,
    contrastWord: null,
    sign: null,
  };
}

describe('real "sip" lisp drill tries (Windows laptop, Edge, 2026-11-15)', () => {
  it('has clear and slushy tries to check', () => {
    expect(clear.length).toBeGreaterThanOrEqual(3);
    expect(slushy.length).toBeGreaterThanOrEqual(4);
  });

  for (const t of clear) {
    it(`${t.name}: a clear "s" is still a hit, with no lisp flag`, () => {
      const r = scoreAttempt(unpack(t.frames), wordOf(t));
      expect(r.verdict).toBe('hit');
      expect(r.heard).toBe('s');
      expect(r.lisp).toBeUndefined();
    });
  }

  for (const t of slushy) {
    it(`${t.name}: a slushy "s" is close with lisp true, not a hit`, () => {
      const r = scoreAttempt(unpack(t.frames), wordOf(t));
      expect(r.verdict).toBe('close');
      expect(r.heard).toBe('s');
      expect(r.lisp).toBe(true);
      expect(r.meterPosition).toBe(LISP_METER_POSITION);
    });
  }

  it('the same slushy tries scored for "sh" are never flagged as a lisp', () => {
    for (const t of slushy) {
      const r = scoreAttempt(unpack(t.frames), wordOf(t, 'sh'));
      expect(r.lisp).toBeUndefined();
    }
  });

  it('frames saved without flatness (older logs) never trip the focus rule', () => {
    for (const t of slushy) {
      const frames = unpack(t.frames).map((f) => ({ ...f, flatness: undefined }));
      const r = scoreAttempt(frames, wordOf(t));
      expect(r.verdict).toBe('hit');
      expect(r.lisp).toBeUndefined();
    }
  });
});

describe('isSlushyHiss', () => {
  it('is false at or under the bar and when flatness is missing, true above it', () => {
    expect(isSlushyHiss(undefined)).toBe(false);
    expect(isSlushyHiss(0.05)).toBe(false);
    expect(isSlushyHiss(S_FOCUS_FLATNESS_MAX)).toBe(false);
    expect(isSlushyHiss(S_FOCUS_FLATNESS_MAX + 0.01)).toBe(true);
  });
});
