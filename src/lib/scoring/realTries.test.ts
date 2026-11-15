import { describe, expect, it } from 'vitest';
import { featuresFromSamples } from '@/lib/audio/features';
import { analyse, isHissFrame, readFrame, scoreAttempt } from '@/lib/scoring';
import realTries from '@/lib/scoring/fixtures/real-tries.json';
import { concat, hiss, silence, vowel } from '@/lib/scoring/synth';
import type { FrameFeatures, PracticeWord, TargetSound, WordPosition } from '@/lib/types';

const SR = 48000;

interface Fixture {
  name: string;
  target: TargetSound;
  position: WordPosition;
  word: string;
  expect: { verdict: string; heard: string | null };
  frames: number[][];
}

const tries = (realTries as { tries: Fixture[] }).tries;

function unpack(packed: number[][]): FrameFeatures[] {
  return packed.map(([tMs, level, hissRatio, centroidHz]) => ({
    tMs,
    level,
    hissLevel: 0,
    hissRatio,
    centroidHz: centroidHz < 0 ? null : centroidHz,
  }));
}

function wordOf(t: { word: string; target: TargetSound; position: WordPosition }): PracticeWord {
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

describe('real logged tries (Windows laptop mic, 2026-11-14)', () => {
  for (const t of tries) {
    it(`${t.name}: ${t.expect.verdict}`, () => {
      const r = scoreAttempt(unpack(t.frames), wordOf(t));
      expect(r.verdict).toBe(t.expect.verdict);
      expect(r.heard).toBe(t.expect.heard);
    });
  }

  it('the live meter marks every frame the verdict counts as hiss', () => {
    for (const t of tries) {
      const frames = unpack(t.frames);
      const a = analyse(frames);
      let peak = 0;
      frames.forEach((f, i) => {
        peak = Math.max(peak, f.level);
        if (a.isHiss[i]) expect(readFrame(f, peak).hissing).toBe(true);
        expect(isHissFrame(f, a.maxLevel)).toBe(a.isHiss[i]);
      });
    }
  });
});

describe('placement ignores a click far from the word', () => {
  // A short low thud, like a laptop button click picked up by the mic. It reads as a voiced frame.
  const click = () => vowel(40, SR);

  it('click, pause, "sh" + vowel ("ship"): hit at start', () => {
    const clip = concat(
      silence(100, SR),
      click(),
      silence(400, SR),
      hiss('sh', 150, SR),
      vowel(200, SR),
      silence(100, SR),
    );
    const r = scoreAttempt(
      featuresFromSamples(clip, SR),
      wordOf({ word: 'ship', target: 'sh', position: 'start' }),
    );
    expect(r.verdict).toBe('hit');
    expect(r.heard).toBe('sh');
  });

  it('vowel + "s", pause, click ("bus"): hit at end', () => {
    const clip = concat(
      silence(100, SR),
      vowel(200, SR),
      hiss('s', 150, SR),
      silence(400, SR),
      click(),
      silence(100, SR),
    );
    const r = scoreAttempt(
      featuresFromSamples(clip, SR),
      wordOf({ word: 'bus', target: 's', position: 'end' }),
    );
    expect(r.verdict).toBe('hit');
    expect(r.heard).toBe('s');
  });

  it('a hiss far from any vowel is out of place, and says so', () => {
    const clip = concat(
      silence(100, SR),
      hiss('sh', 200, SR),
      silence(600, SR),
      vowel(200, SR),
      silence(100, SR),
    );
    const r = scoreAttempt(
      featuresFromSamples(clip, SR),
      wordOf({ word: 'ship', target: 'sh', position: 'start' }),
    );
    expect(r.verdict).toBe('miss');
    expect(r.warnings.join(' ')).toMatch(/not at the start/i);
  });
});
