import { describe, expect, it } from 'vitest';
import { featuresFromSamples } from '@/lib/audio/features';
import { burst, concat, hiss, hissSlide, scale, silence, vowel } from '@/lib/scoring/synth';
import { summarizeTrace } from '@/lib/scoring/trace';
import type { PracticeWord, TargetSound, WordPosition } from '@/lib/types';

const SR = 48000;

function word(target: TargetSound, position: WordPosition): PracticeWord {
  return { id: 't', text: 't', target, position, baseWord: null, contrastWord: null, sign: null };
}
const trace = (samples: Float32Array, w = word('s', 'end')) =>
  summarizeTrace(featuresFromSamples(samples, SR), w);

describe('summarizeTrace', () => {
  it('a steady "s": positions high, drift near zero, smooth', () => {
    const t = trace(concat(silence(100, SR), vowel(200, SR), hiss('s', 300, SR), silence(100, SR)));
    expect(t).not.toBeNull();
    expect(t!.positionStart).toBeGreaterThan(0.6);
    expect(t!.positionEnd).toBeGreaterThan(0.6);
    expect(Math.abs(t!.drift)).toBeLessThan(0.15);
    expect(t!.hissMs).toBeGreaterThan(250);
    expect(t!.heldMs).toBeGreaterThan(150);
    expect(t!.steadiness).toBeGreaterThan(0.7);
    expect(t!.vowelMs).toBeGreaterThan(150);
  });

  it('an "s" that turns into "sh": clearly negative drift', () => {
    const t = trace(
      concat(silence(100, SR), vowel(200, SR), hissSlide('s', 'sh', 400, SR), silence(100, SR)),
    );
    expect(t!.drift).toBeLessThan(-0.3);
    expect(t!.positionStart).toBeGreaterThan(t!.positionEnd);
  });

  it('a quiet hiss: low hissToVowel, and louder one is higher', () => {
    const loud = trace(concat(vowel(200, SR), hiss('s', 250, SR)));
    const quiet = trace(concat(vowel(200, SR), scale(hiss('s', 250, SR), 0.25)));
    expect(quiet!.hissToVowel).toBeLessThan(0.08);
    expect(loud!.hissToVowel).toBeGreaterThan(0.15);
  });

  it('a vowel, 150 ms of silence, then the hiss: gap about 150 ms', () => {
    const t = trace(concat(silence(50, SR), vowel(200, SR), silence(150, SR), hiss('s', 250, SR)));
    expect(t!.gapMs).not.toBeNull();
    expect(t!.gapMs!).toBeGreaterThan(110);
    expect(t!.gapMs!).toBeLessThan(190);
  });

  it('no vowel found: gapMs is null', () => {
    expect(trace(hiss('s', 300, SR))!.gapMs).toBeNull();
  });

  it('uses the longest hiss anywhere when none is in place', () => {
    // A start word with the hiss after the vowel: scoring would miss it, the trace still describes it.
    const t = trace(concat(vowel(200, SR), hiss('s', 250, SR)), word('s', 'start'));
    expect(t).not.toBeNull();
    expect(t!.hissMs).toBeGreaterThan(200);
  });

  it('a burst with no hiss, silence and empty input give null or no crash', () => {
    expect(summarizeTrace([], word('s', 'end'))).toBeNull();
    expect(trace(silence(500, SR))).toBeNull();
    expect(trace(concat(vowel(200, SR), silence(100, SR)))).toBeNull();
    expect(trace(concat(vowel(200, SR), burst(30, SR)))).toSatisfy(
      (t) => t === null || typeof t.hissMs === 'number',
    );
  });
});
