import { describe, expect, it } from 'vitest';
import { featuresFromSamples } from '@/lib/audio/features';
import { LIMITATIONS, readFrame, scoreAttempt } from '@/lib/scoring';
import { burst, concat, hiss, scale, silence, vowel } from '@/lib/scoring/synth';
import type { PracticeWord, TargetSound, WordPosition } from '@/lib/types';

const SR = 48000;

function word(target: TargetSound, position: WordPosition): PracticeWord {
  return {
    id: 'test',
    text: 'test',
    target,
    position,
    baseWord: null,
    contrastWord: null,
    sign: null,
  };
}

function score(samples: Float32Array, w: PracticeWord, sr = SR) {
  return scoreAttempt(featuresFromSamples(samples, sr), w);
}

const cats = () =>
  concat(silence(100, SR), vowel(200, SR), burst(30, SR), hiss('s', 200, SR), silence(100, SR));

describe('scoreAttempt', () => {
  it('vowel + "s" hiss, target s at end: hit', () => {
    const r = score(
      concat(silence(100, SR), vowel(200, SR), hiss('s', 200, SR), silence(100, SR)),
      word('s', 'end'),
    );
    expect(r.verdict).toBe('hit');
    expect(r.heard).toBe('s');
    expect(r.meterPosition).toBeGreaterThan(0.5);
    expect(r.hissMs).toBeGreaterThan(150);
    expect(r.confidence).toBeGreaterThan(0.5);
  });

  it('vowel + burst only ("cat"): miss', () => {
    const r = score(
      concat(silence(100, SR), vowel(200, SR), burst(30, SR), silence(100, SR)),
      word('s', 'end'),
    );
    expect(r.verdict).toBe('miss');
    expect(r.heard).toBeNull();
  });

  it('vowel + "sh" hiss, target s at end: close, heard sh', () => {
    const r = score(
      concat(silence(100, SR), vowel(200, SR), hiss('sh', 200, SR), silence(100, SR)),
      word('s', 'end'),
    );
    expect(r.verdict).toBe('close');
    expect(r.heard).toBe('sh');
  });

  it('"s" hiss + vowel: hit at start, miss when the word wants it at the end', () => {
    const clip = concat(silence(100, SR), hiss('s', 200, SR), vowel(200, SR), silence(100, SR));
    expect(score(clip, word('s', 'start')).verdict).toBe('hit');
    expect(score(clip, word('s', 'end')).verdict).toBe('miss');
  });

  it('"sh" hiss + vowel, target sh at start: hit', () => {
    const r = score(
      concat(silence(100, SR), hiss('sh', 200, SR), vowel(200, SR), silence(100, SR)),
      word('sh', 'start'),
    );
    expect(r.verdict).toBe('hit');
    expect(r.heard).toBe('sh');
  });

  it('middle position: vowel, hiss, vowel is a hit; hiss at the very end is a miss', () => {
    const mid = concat(
      silence(100, SR),
      vowel(150, SR),
      hiss('s', 150, SR),
      vowel(150, SR),
      silence(100, SR),
    );
    expect(score(mid, word('s', 'middle')).verdict).toBe('hit');
    const endOnly = concat(silence(100, SR), vowel(200, SR), hiss('s', 200, SR), silence(100, SR));
    expect(score(endOnly, word('s', 'middle')).verdict).toBe('miss');
  });

  it('gives the same verdict at 0.1x and 3x gain ("cats")', () => {
    const base = cats();
    let peak = 0;
    for (const v of base) peak = Math.max(peak, Math.abs(v));
    expect(peak * 3).toBeLessThan(1);
    const w = word('s', 'end');
    const quiet = score(scale(base, 0.1), w);
    const normal = score(base, w);
    const loud = score(scale(base, 3), w);
    expect(normal.verdict).toBe('hit');
    expect(quiet.verdict).toBe('hit');
    expect(loud.verdict).toBe('hit');
  });

  it('works at 44100 Hz too', () => {
    const sr = 44100;
    const clip = concat(silence(100, sr), vowel(200, sr), hiss('s', 200, sr), silence(100, sr));
    expect(score(clip, word('s', 'end'), sr).verdict).toBe('hit');
    const sh = concat(silence(100, sr), vowel(200, sr), hiss('sh', 200, sr), silence(100, sr));
    expect(score(sh, word('s', 'end'), sr).verdict).toBe('close');
  });

  it('silence is a miss with a warning, and an empty array does not throw', () => {
    const r = score(silence(500, SR), word('s', 'end'));
    expect(r.verdict).toBe('miss');
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(() => scoreAttempt([], word('s', 'end'))).not.toThrow();
    const empty = scoreAttempt([], word('s', 'end'));
    expect(empty.verdict).toBe('miss');
    expect(empty.warnings.length).toBeGreaterThan(0);
  });

  it('warns about a very short recording', () => {
    const r = score(concat(vowel(60, SR), hiss('s', 60, SR)), word('s', 'end'));
    expect(r.warnings.join(' ')).toMatch(/short/i);
  });

  it('warns when hiss fills the whole recording (noisy room)', () => {
    const r = score(concat(vowel(200, SR), scale(hiss('s', 800, SR), 3)), word('s', 'end'));
    expect(r.warnings.join(' ')).toMatch(/noisy/i);
  });

  it('warns when there is no vowel', () => {
    const r = score(concat(silence(100, SR), hiss('s', 300, SR), silence(100, SR)), word('s', 'end'));
    expect(r.warnings.join(' ')).toMatch(/vowel/i);
  });

  it('does not warn on a clean recording', () => {
    const r = score(cats(), word('s', 'end'));
    expect(r.warnings).toEqual([]);
  });
});

describe('readFrame', () => {
  it('position is lower for "sh" than for "s"', () => {
    const s = featuresFromSamples(hiss('s', 200, SR), SR)[5];
    const sh = featuresFromSamples(hiss('sh', 200, SR), SR)[5];
    const rs = readFrame(s);
    const rsh = readFrame(sh);
    expect(rs.hissing).toBe(true);
    expect(rsh.hissing).toBe(true);
    expect(rsh.position ?? 1).toBeLessThan(rs.position ?? 0);
    expect(rs.position ?? 0).toBeGreaterThan(0.5);
    expect(rsh.position ?? 1).toBeLessThan(0.5);
  });

  it('a vowel frame is not hissing and has no position', () => {
    const v = readFrame(featuresFromSamples(vowel(200, SR), SR)[5]);
    expect(v.hissing).toBe(false);
    expect(v.position).toBeNull();
  });

  it('silence is not hissing', () => {
    expect(readFrame(featuresFromSamples(silence(100, SR), SR)[0]).hissing).toBe(false);
  });
});

describe('LIMITATIONS', () => {
  it('has 4 to 6 plain strings with no em dashes', () => {
    expect(LIMITATIONS.length).toBeGreaterThanOrEqual(4);
    expect(LIMITATIONS.length).toBeLessThanOrEqual(6);
    for (const l of LIMITATIONS) expect(l).not.toContain(String.fromCharCode(0x2014));
  });
});
