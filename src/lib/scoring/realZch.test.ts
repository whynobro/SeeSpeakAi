import { describe, expect, it } from 'vitest';
import { scoreAttempt } from '@/lib/scoring';
import fixture from '@/lib/scoring/fixtures/real-zch-tries.json';
import type { FrameFeatures, PracticeWord, TargetSound, WordPosition } from '@/lib/types';

interface Try {
  name: string;
  word: string;
  target: TargetSound;
  position: WordPosition;
  note: string;
  expect: { verdict: string; heard: string | null };
  frames: number[][];
}

const tries = (fixture as { tries: Try[] }).tries;

function unpack(packed: number[][]): FrameFeatures[] {
  return packed.map(([tMs, level, hissRatio, centroidHz, voicing]) => ({
    tMs,
    level,
    hissLevel: 0,
    hissRatio,
    centroidHz: centroidHz < 0 ? null : centroidHz,
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

// Real "z" and "ch" tries (Windows laptop mic, one adult, 2026-11-15 UTC). The tester said the sound in
// every "fixed" and "gap" try. "gap" tries are still scored wrong today: the test pins today's answer so a
// later change that fixes them (or breaks the controls) shows up here. See the notes in the fixture.
describe('real z and ch tries', () => {
  for (const t of tries) {
    it(`${t.name} (${t.note.split(':')[0]}): ${t.expect.verdict}`, () => {
      const r = scoreAttempt(unpack(t.frames), wordOf(t));
      if (t.expect.verdict === 'notHit') {
        expect(r.verdict).not.toBe('hit');
      } else {
        expect(r.verdict).toBe(t.expect.verdict);
        expect(r.heard).toBe(t.expect.heard);
      }
    });
  }

  it('a voiced "z" at the start of "zoo" is a hit even though its hiss share is low', () => {
    const zoo = tries.find((t) => t.name === 'zoo')!;
    const r = scoreAttempt(unpack(zoo.frames), wordOf(zoo));
    expect(r.verdict).toBe('hit');
    expect(r.heard).toBe('z');
  });

  it('the same "zoo" without the voiced frames in the hiss is not found by the old hiss share alone', () => {
    const zoo = tries.find((t) => t.name === 'zoo')!;
    // Pretend the buzz was missing: voicing 0 on every frame. The voiced-frication rule then ignores them.
    const frames = unpack(zoo.frames).map((f) => ({ ...f, voicing: 0 }));
    const r = scoreAttempt(frames, wordOf(zoo));
    expect(r.verdict).not.toBe('hit');
  });
});
