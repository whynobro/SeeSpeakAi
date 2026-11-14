import { describe, expect, it } from 'vitest';
import { featuresFromSamples } from '@/lib/audio/features';
import { scoreAttempt } from '@/lib/scoring';
import { concat, hiss, silence, stopRelease, vowel } from '@/lib/scoring/synth';
import type { PracticeWord } from '@/lib/types';

const SR = 48000;
const endS: PracticeWord = {
  id: 'cats',
  text: 'cats',
  target: 's',
  position: 'end',
  baseWord: 'cat',
  contrastWord: null,
  sign: null,
};

function score(samples: Float32Array) {
  return scoreAttempt(featuresFromSamples(samples, SR), endS);
}

/** vowel, a 50 ms closure, then whatever follows. */
function afterVowel(...tail: Float32Array[]) {
  return concat(silence(100, SR), vowel(200, SR), silence(50, SR), ...tail, silence(100, SR));
}

describe('stop release is not an "s"', () => {
  for (const ms of [60, 90, 120]) {
    it(`"t" release of ${ms} ms: miss`, () => {
      expect(score(afterVowel(stopRelease('t', ms, SR))).verdict).toBe('miss');
    });
    it(`"k" release of ${ms} ms: miss, not close`, () => {
      expect(score(afterVowel(stopRelease('k', ms, SR))).verdict).toBe('miss');
    });
  }

  it('a rejected release says why', () => {
    const r = score(afterVowel(stopRelease('t', 120, SR)));
    expect(r.warnings.join(' ')).toMatch(/held hiss/i);
  });

  it('closure + "t" burst + 150 ms "s" hiss ("cats"): hit', () => {
    const r = score(afterVowel(stopRelease('t', 25, SR), hiss('s', 150, SR)));
    expect(r.verdict).toBe('hit');
    expect(r.heard).toBe('s');
  });

  it('vowel + "s" hiss directly ("bus"): hit', () => {
    const r = score(concat(silence(100, SR), vowel(200, SR), hiss('s', 150, SR), silence(100, SR)));
    expect(r.verdict).toBe('hit');
  });
});
