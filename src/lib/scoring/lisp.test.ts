import { describe, expect, it } from 'vitest';
import { LISP_COPY } from '@/content/copy';
import { feedbackFromRules } from '@/lib/ai/feedback';
import { featuresFromSamples } from '@/lib/audio/features';
import { readFrame, scoreAttempt } from '@/lib/scoring';
import { BOUNDARY, LISP_FLATNESS_MIN, LISP_METER_POSITION } from '@/lib/scoring/constants';
import { concat, hiss, lispHiss, scale, silence, voicedHiss, vowel } from '@/lib/scoring/synth';
import { summarizeTrace } from '@/lib/scoring/trace';
import type { PracticeWord, TargetSound, WordPosition } from '@/lib/types';

const SR = 48000;

function word(target: TargetSound, position: WordPosition): PracticeWord {
  return { id: 'test', text: 'test', target, position, baseWord: null, contrastWord: null, sign: null };
}

const bus = () => concat(silence(100, SR), vowel(200, SR), hiss('s', 200, SR), silence(100, SR));
const busLisp = () => concat(silence(100, SR), vowel(200, SR), lispHiss(200, SR), silence(100, SR));
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

describe('flatness feature', () => {
  it('a clear "s" is peaky and a lisp is flat', () => {
    const flat = (x: Float32Array) =>
      median(
        featuresFromSamples(x, SR)
          .slice(2, -2)
          .map((f) => f.flatness ?? 0),
      );
    expect(flat(hiss('s', 300, SR))).toBeLessThan(0.1);
    expect(flat(lispHiss(300, SR))).toBeGreaterThanOrEqual(LISP_FLATNESS_MIN);
  });

  it('silence has flatness 0, so it never looks like a flat hiss', () => {
    expect(featuresFromSamples(silence(100, SR), SR).every((f) => f.flatness === 0)).toBe(true);
  });
});

describe('lisp', () => {
  it('vowel + clear "s" at the end is still a hit, with no lisp flag', () => {
    const r = scoreAttempt(featuresFromSamples(bus(), SR), word('s', 'end'));
    expect(r.verdict).toBe('hit');
    expect(r.lisp).toBeUndefined();
  });

  it('the lisp hiss lands on the "s" side, which is why it used to score as a hit', () => {
    const frames = featuresFromSamples(lispHiss(300, SR), SR).slice(2, -2);
    const positions = frames.map((f) => readFrame(f).position ?? 0);
    expect(median(positions)).toBeGreaterThan(BOUNDARY);
  });

  it('vowel + lisp hiss at the end is close, lisp true, heard "s", with no warning', () => {
    const r = scoreAttempt(featuresFromSamples(busLisp(), SR), word('s', 'end'));
    expect(r.verdict).toBe('close');
    expect(r.lisp).toBe(true);
    expect(r.heard).toBe('s');
    expect(r.meterPosition).toBe(LISP_METER_POSITION);
    expect(r.warnings).toEqual([]);
  });

  it('a lisp at the start ("sun") is close too', () => {
    const clip = concat(silence(100, SR), lispHiss(200, SR), vowel(200, SR), silence(100, SR));
    const r = scoreAttempt(featuresFromSamples(clip, SR), word('s', 'start'));
    expect(r.verdict).toBe('close');
    expect(r.lisp).toBe(true);
  });

  it('"z": a voiced lisp is close with lisp true; a clear "z" is still a hit', () => {
    const lisped = concat(silence(100, SR), vowel(200, SR), lispHiss(200, SR, true), silence(100, SR));
    const r = scoreAttempt(featuresFromSamples(lisped, SR), word('z', 'end'));
    expect(r.verdict).toBe('close');
    expect(r.lisp).toBe(true);
    const clear = concat(silence(100, SR), vowel(200, SR), voicedHiss(200, SR), silence(100, SR));
    const ok = scoreAttempt(featuresFromSamples(clear, SR), word('z', 'end'));
    expect(ok.verdict).toBe('hit');
    expect(ok.lisp).toBeUndefined();
  });

  it('"sh" targets are never flagged as a lisp', () => {
    const r = scoreAttempt(featuresFromSamples(busLisp(), SR), word('sh', 'end'));
    expect(r.lisp).toBeUndefined();
  });

  it('gives the same verdicts at 0.1x and 5x gain', () => {
    for (const gain of [0.1, 5]) {
      const clear = scoreAttempt(featuresFromSamples(scale(bus(), gain), SR), word('s', 'end'));
      expect(clear.verdict).toBe('hit');
      const lisped = scoreAttempt(featuresFromSamples(scale(busLisp(), gain), SR), word('s', 'end'));
      expect(lisped.verdict).toBe('close');
      expect(lisped.lisp).toBe(true);
    }
  });

  it('works at 44100 Hz too', () => {
    const clip = concat(silence(100, 44100), vowel(200, 44100), lispHiss(200, 44100), silence(100, 44100));
    const r = scoreAttempt(featuresFromSamples(clip, 44100), word('s', 'end'));
    expect(r.lisp).toBe(true);
  });

  it('frames saved without flatness (older logs) are never called a lisp', () => {
    const frames = featuresFromSamples(busLisp(), SR).map((f) => ({ ...f, flatness: undefined }));
    const r = scoreAttempt(frames, word('s', 'end'));
    expect(r.lisp).toBeUndefined();
  });
});

describe('live meter and lisp', () => {
  /** Run the frames through readFrame the way the mic hook does, with the loudest level so far. */
  function live(samples: Float32Array) {
    let peak = 0;
    return featuresFromSamples(samples, SR).map((f) => {
      peak = Math.max(peak, f.level);
      return readFrame(f, peak);
    });
  }

  it('a lisp after the vowel is never placed in the "s" zone and is marked lisp', () => {
    const hissing = live(busLisp()).filter((r) => r.hissing);
    expect(hissing.length).toBeGreaterThan(3);
    for (const r of hissing) expect(r.position ?? 0).toBeLessThan(BOUNDARY);
    expect(hissing.filter((r) => r.lisp).length).toBeGreaterThan(hissing.length / 2);
  });

  it('a clear "s" after the vowel stays in the "s" zone with no lisp mark', () => {
    const hissing = live(bus()).filter((r) => r.hissing);
    expect(hissing.length).toBeGreaterThan(3);
    expect(hissing.some((r) => r.lisp)).toBe(false);
    expect(median(hissing.map((r) => r.position ?? 0))).toBeGreaterThan(BOUNDARY);
  });

  it('meter and verdict agree on a lisp: the result sits where the live marker sat', () => {
    const r = scoreAttempt(featuresFromSamples(busLisp(), SR), word('s', 'end'));
    const marks = live(busLisp()).filter((x) => x.lisp);
    expect(marks.every((x) => x.position === r.meterPosition)).toBe(true);
  });
});

describe('lisp feedback words', () => {
  it('the rules coach says it sounded like a lisp, even when the trace says the hiss was soft', () => {
    const last = scoreAttempt(featuresFromSamples(busLisp(), SR), word('s', 'end'));
    const fb = feedbackFromRules({
      target: 's',
      word: 'bus',
      recent: [last],
      trace: summarizeTrace(featuresFromSamples(busLisp(), SR), word('s', 'end')),
    });
    expect(fb.message).toBe(LISP_COPY.message);
    expect(fb.message).toBe('Close: that sounded like a lisp. Keep your tongue behind your teeth.');
    expect(fb.nextAction).toBe('repeat');
  });
});
