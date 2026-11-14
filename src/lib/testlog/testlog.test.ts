import { describe, expect, it } from 'vitest';
import { featuresFromSamples } from '@/lib/audio/features';
import { scoreAttempt } from '@/lib/scoring';
import { concat, hiss, silence, vowel } from '@/lib/scoring/synth';
import { buildEntry, isSharing, packFrames, sharePracticeAttempt } from '@/lib/testlog';
import type { PracticeWord } from '@/lib/types';

const SR = 48000;
const word: PracticeWord = {
  id: 'bus',
  text: 'bus',
  target: 's',
  position: 'end',
  baseWord: null,
  contrastWord: null,
  sign: null,
};
const frames = featuresFromSamples(
  concat(silence(100, SR), vowel(250, SR), hiss('s', 200, SR), silence(100, SR)),
  SR,
);

describe('test log', () => {
  it('is off when nothing is stored (and on the server)', () => {
    expect(isSharing()).toBe(false);
  });
  it('does nothing and does not throw when sharing is off', () => {
    expect(() => sharePracticeAttempt('bus', 's', scoreAttempt(frames, word))).not.toThrow();
  });
  it('packs frames as four short numbers and caps the count', () => {
    const packed = packFrames(frames);
    expect(packed.length).toBe(frames.length);
    expect(packed[0]).toHaveLength(4);
    expect(packed.every((f) => Number.isInteger(f[0]) && Number.isInteger(f[3]))).toBe(true);
    expect(packFrames(Array.from({ length: 2000 }, () => frames[0])).length).toBe(600);
  });
  it('builds an entry with the score, the runs and no audio', () => {
    const score = scoreAttempt(frames, word);
    const entry = buildEntry({
      page: 'lab',
      word,
      score,
      frames,
      sampleRate: SR,
      said: 'with-sound',
      tester: 'abc12345',
      label: 'MF',
      device: 'x'.repeat(500),
      at: '2026-11-14T00:00:00.000Z',
    });
    expect(entry.v).toBe(1);
    expect(entry.score.verdict).toBe('hit');
    expect(entry.runs.length).toBeGreaterThan(0);
    expect(entry.runs.some((r) => r.passed.inPlace)).toBe(true);
    expect(entry.device.length).toBe(200);
    expect(JSON.stringify(entry).length).toBeLessThan(120_000);
    expect(Object.keys(entry)).not.toContain('audio');
  });
});
