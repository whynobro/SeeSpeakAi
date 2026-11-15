import { describe, expect, it } from 'vitest';
import { analyse, scoreAttempt } from '@/lib/scoring';
import { SHAPE_NO_VOWEL_MIN_HISS_MS } from '@/lib/scoring/constants';
import fixture from '@/lib/scoring/fixtures/real-sip-drill-tries.json';
import { measureShape } from '@/lib/scoring/shape';
import type { FrameFeatures, PracticeWord, TargetSound, WordPosition } from '@/lib/types';

interface Try {
  name: string;
  word: string;
  target: TargetSound;
  position: WordPosition;
  kind: 'clear' | 'drifted';
  frames: number[][];
}

const tries = (fixture as { tries: Try[] }).tries;
const clear = tries.filter((t) => t.kind === 'clear');
const drifted = tries.filter((t) => t.kind === 'drifted');

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

function wordOf(t: Try): PracticeWord {
  return {
    id: t.word,
    text: t.word,
    target: t.target,
    position: t.position,
    baseWord: null,
    contrastWord: null,
    sign: null,
  };
}

describe('real "sip" drill tries (Windows laptop, Edge, 2026-11-15)', () => {
  it('has clear and drifted tries to check', () => {
    expect(clear.length).toBeGreaterThanOrEqual(5);
    expect(drifted.length).toBeGreaterThanOrEqual(5);
  });

  for (const t of clear) {
    it(`${t.name}: a clear "sip" is a hit`, () => {
      const r = scoreAttempt(unpack(t.frames), wordOf(t));
      expect(r.verdict).toBe('hit');
      expect(r.heard).toBe('s');
      expect(r.lisp).toBeUndefined();
    });
  }

  for (const t of drifted) {
    it(`${t.name}: a "sip" drifting toward "sh" or lispy is not a hit`, () => {
      expect(scoreAttempt(unpack(t.frames), wordOf(t)).verdict).not.toBe('hit');
    });
  }

  it('background voice in a long recording is not counted as more words', () => {
    const t = clear.find((x) => x.name.includes('shape-too-many'))!;
    const frames = unpack(t.frames);
    expect(measureShape(frames, analyse(frames, 's')).segments).toBe(1);
  });

  it('a short hiss whose vowel the mic cut off is not failed for "no vowel"', () => {
    const t = clear.find((x) => x.name.includes('shape-no-vowel'))!;
    const r = scoreAttempt(unpack(t.frames), wordOf(t));
    expect(r.warnings).not.toContain('Try the whole word.');
    expect(r.hissMs).toBeLessThan(SHAPE_NO_VOWEL_MIN_HISS_MS);
  });
});
