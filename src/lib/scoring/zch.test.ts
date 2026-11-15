import { describe, expect, it } from 'vitest';
import { featuresFromSamples } from '@/lib/audio/features';
import { LIMITATIONS, describeRuns, scoreAttempt } from '@/lib/scoring';
import {
  affricate,
  burst,
  concat,
  hiss,
  scale,
  silence,
  stopRelease,
  vowel,
  voicedHiss,
} from '@/lib/scoring/synth';
import type { PracticeWord, TargetSound, WordPosition } from '@/lib/types';

const SR = 48000;

function word(target: TargetSound, position: WordPosition): PracticeWord {
  return { id: 'test', text: 'test', target, position, baseWord: null, contrastWord: null, sign: null };
}

function score(samples: Float32Array, w: PracticeWord, sr = SR) {
  return scoreAttempt(featuresFromSamples(samples, sr), w);
}

const dogs = (sr = SR) => concat(silence(100, sr), vowel(200, sr), voicedHiss(200, sr), silence(100, sr));
const chip = (sr = SR) => concat(silence(100, sr), affricate(110, sr), vowel(200, sr), silence(100, sr));

describe('"z"', () => {
  it('vowel + voiced hiss, target z at the end: hit', () => {
    const r = score(dogs(), word('z', 'end'));
    expect(r.verdict).toBe('hit');
    expect(r.heard).toBe('z');
    expect(r.meterPosition).toBeGreaterThan(0.5);
    expect(r.warnings).toEqual([]);
  });

  it('voiced hiss + vowel, target z at the start: hit', () => {
    const clip = concat(silence(100, SR), voicedHiss(200, SR), vowel(200, SR), silence(100, SR));
    expect(score(clip, word('z', 'start')).verdict).toBe('hit');
    expect(score(clip, word('z', 'end')).verdict).toBe('miss');
  });

  it('vowel + plain "s" hiss, target z: close, heard s (add your voice)', () => {
    const r = score(
      concat(silence(100, SR), vowel(200, SR), hiss('s', 200, SR), silence(100, SR)),
      word('z', 'end'),
    );
    expect(r.verdict).toBe('close');
    expect(r.heard).toBe('s');
  });

  it('a plain "s" hiss at the start is close for z at several lengths', () => {
    for (const ms of [100, 150, 300]) {
      const clip = concat(silence(100, SR), hiss('s', ms, SR), vowel(200, SR), silence(100, SR));
      expect(score(clip, word('z', 'start')).verdict, `${ms} ms`).toBe('close');
    }
  });

  it('a hiss that is voiced only at first (devoiced ending) still counts', () => {
    const half = concat(voicedHiss(100, SR), hiss('s', 100, SR));
    const r = score(concat(silence(100, SR), vowel(200, SR), half, silence(100, SR)), word('z', 'end'));
    expect(r.verdict).toBe('hit');
  });

  it('a "sh"-pitch hiss is close for z, heard sh', () => {
    const r = score(
      concat(silence(100, SR), vowel(200, SR), hiss('sh', 200, SR), silence(100, SR)),
      word('z', 'end'),
    );
    expect(r.verdict).toBe('close');
    expect(r.heard).toBe('sh');
  });

  it('a vowel alone, or a burst, is a miss', () => {
    expect(score(concat(silence(100, SR), vowel(300, SR), silence(100, SR)), word('z', 'end')).verdict).toBe(
      'miss',
    );
    expect(
      score(concat(silence(100, SR), vowel(200, SR), burst(30, SR), silence(100, SR)), word('z', 'end'))
        .verdict,
    ).toBe('miss');
  });

  it('gives the same verdict at 0.1x and 3x gain', () => {
    const w = word('z', 'end');
    for (const g of [0.1, 1, 3]) expect(score(scale(dogs(), g), w).verdict, `gain ${g}`).toBe('hit');
    const s = concat(silence(100, SR), vowel(200, SR), hiss('s', 200, SR), silence(100, SR));
    for (const g of [0.1, 1, 3]) expect(score(scale(s, g), w).verdict, `s gain ${g}`).toBe('close');
  });

  it('works at 44100 Hz', () => {
    const sr = 44100;
    expect(score(dogs(sr), word('z', 'end'), sr).verdict).toBe('hit');
    const s = concat(silence(100, sr), vowel(200, sr), hiss('s', 200, sr), silence(100, sr));
    expect(score(s, word('z', 'end'), sr).verdict).toBe('close');
  });

  it('a voiced hiss is still a hit for "s" (s scoring ignores voicing)', () => {
    expect(score(dogs(), word('s', 'end')).verdict).toBe('hit');
  });

  it('frames carry voicing: near 0 for a plain hiss, clearly higher for a voiced one', () => {
    const plain = featuresFromSamples(hiss('s', 200, SR), SR)[5].voicing ?? -1;
    const voiced = featuresFromSamples(voicedHiss(200, SR), SR)[5].voicing ?? -1;
    expect(plain).toBeLessThan(0.02);
    expect(voiced).toBeGreaterThan(0.1);
    const run = describeRuns(featuresFromSamples(dogs(), SR), word('z', 'end'))[0];
    expect(run.voicedShare).toBeGreaterThan(0.8);
  });
});

describe('"ch"', () => {
  it('burst + short sh + vowel, target ch at the start: hit', () => {
    const r = score(chip(), word('ch', 'start'));
    expect(r.verdict).toBe('hit');
    expect(r.heard).toBe('ch');
    expect(r.meterPosition).toBeLessThan(0.5);
    expect(r.confidence).toBeGreaterThan(0.5);
  });

  it('vowel + burst + short sh, target ch at the end: hit', () => {
    const clip = concat(silence(100, SR), vowel(200, SR), affricate(110, SR), silence(100, SR));
    expect(score(clip, word('ch', 'end')).verdict).toBe('hit');
    expect(score(clip, word('ch', 'start')).verdict).toBe('miss');
  });

  it('a short sh from 85 to 170 ms is a hit', () => {
    for (const ms of [85, 110, 150, 170]) {
      const clip = concat(silence(100, SR), affricate(ms, SR), vowel(200, SR), silence(100, SR));
      expect(score(clip, word('ch', 'start')).verdict, `${ms} ms`).toBe('hit');
    }
  });

  it('a long sh + vowel, target ch: close, heard sh', () => {
    const r = score(
      concat(silence(100, SR), hiss('sh', 300, SR), vowel(200, SR), silence(100, SR)),
      word('ch', 'start'),
    );
    expect(r.verdict).toBe('close');
    expect(r.heard).toBe('sh');
  });

  it('a short sh with no burst, target ch: close, heard sh', () => {
    const r = score(
      concat(silence(100, SR), hiss('sh', 100, SR), vowel(200, SR), silence(100, SR)),
      word('ch', 'start'),
    );
    expect(r.verdict).toBe('close');
    expect(r.heard).toBe('sh');
  });

  it('a burst followed by a long sh is close (too long for a ch)', () => {
    const clip = concat(silence(100, SR), affricate(400, SR), vowel(200, SR), silence(100, SR));
    const r = score(clip, word('ch', 'start'));
    expect(r.verdict).toBe('close');
    expect(r.heard).toBe('sh');
  });

  it('a burst only, target ch: miss', () => {
    const r = score(
      concat(silence(100, SR), burst(30, SR), vowel(200, SR), silence(100, SR)),
      word('ch', 'start'),
    );
    expect(r.verdict).toBe('miss');
    expect(r.heard).toBeNull();
  });

  it('a "t" or "k" release is a miss for ch', () => {
    for (const flavour of ['t', 'k'] as const) {
      const clip = concat(silence(100, SR), stopRelease(flavour, 60, SR), vowel(200, SR), silence(100, SR));
      expect(score(clip, word('ch', 'start')).verdict, flavour).toBe('miss');
      const end = concat(silence(100, SR), vowel(200, SR), stopRelease(flavour, 60, SR), silence(100, SR));
      expect(score(end, word('ch', 'end')).verdict, `${flavour} end`).toBe('miss');
    }
  });

  it('a vowel alone is a miss', () => {
    expect(
      score(concat(silence(100, SR), vowel(300, SR), silence(100, SR)), word('ch', 'start')).verdict,
    ).toBe('miss');
  });

  it('a burst plus an "s" hiss ("ts") is close, heard s', () => {
    const clip = concat(
      silence(100, SR),
      burst(25, SR),
      hiss('s', 100, SR),
      vowel(200, SR),
      silence(100, SR),
    );
    const r = score(clip, word('ch', 'start'));
    expect(r.verdict).toBe('close');
    expect(r.heard).toBe('s');
  });

  it('gives the same verdict at 0.1x and 3x gain', () => {
    const w = word('ch', 'start');
    for (const g of [0.1, 1, 3]) expect(score(scale(chip(), g), w).verdict, `gain ${g}`).toBe('hit');
    const longSh = concat(silence(100, SR), hiss('sh', 300, SR), vowel(200, SR), silence(100, SR));
    for (const g of [0.1, 1, 3]) expect(score(scale(longSh, g), w).verdict, `sh gain ${g}`).toBe('close');
  });

  it('works at 44100 Hz', () => {
    const sr = 44100;
    expect(score(chip(sr), word('ch', 'start'), sr).verdict).toBe('hit');
    const longSh = concat(silence(100, sr), hiss('sh', 300, sr), vowel(200, sr), silence(100, sr));
    expect(score(longSh, word('ch', 'start'), sr).verdict).toBe('close');
  });

  it('does not change how "sh" scores a burst + sh', () => {
    expect(score(chip(), word('sh', 'start')).verdict).toBe('hit');
  });
});

describe('LIMITATIONS for z and ch', () => {
  it('lists all four sounds and says z and ch need real voices', () => {
    const text = LIMITATIONS.join(' ');
    expect(text).toContain('"z" and "ch"');
    expect(text).toMatch(/synthetic/);
  });
});
