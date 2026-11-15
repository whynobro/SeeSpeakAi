import { afterEach, describe, expect, it, vi } from 'vitest';
import { featuresFromSamples } from '@/lib/audio/features';
import { scoreAttempt } from '@/lib/scoring';
import { concat, hiss, silence, vowel } from '@/lib/scoring/synth';
import {
  buildEntry,
  buildLipEntry,
  guessPosition,
  isLabSharing,
  isSharing,
  packFrames,
  rememberRecording,
  setSharing,
  sharePracticeAttempt,
  type TestLogEntry,
} from '@/lib/testlog';
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
  it('saves lab tries unless switched off', () => {
    expect(isLabSharing()).toBe(true);
  });
  it('does nothing and does not throw when sharing is off', () => {
    expect(() => sharePracticeAttempt('bus', 's', scoreAttempt(frames, word))).not.toThrow();
  });
  it('packs frames as five short numbers (flatness, then voicing) and caps the count', () => {
    const packed = packFrames(frames);
    expect(packed.length).toBe(frames.length);
    expect(packed[0]).toHaveLength(6);
    expect(packed.every((f) => f[4] >= 0 && f[4] <= 1)).toBe(true);
    expect(packFrames([{ ...frames[0], flatness: undefined }])[0][4]).toBe(-1);
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
      attemptId: 'a1',
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

describe('practice tries in the test log', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Switch practice sharing on with an in-memory storage, and catch what would be sent. */
  function capture(): TestLogEntry[] {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
    const sent: TestLogEntry[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: { body: string }) => {
        sent.push(JSON.parse(init.body) as TestLogEntry);
        return new Response('{}');
      }),
    );
    setSharing(true);
    rememberRecording(frames, SR);
    return sent;
  }

  it('logs the position the word was scored with, not "end" for words outside the bank', () => {
    const sent = capture();
    const score = scoreAttempt(frames, { ...word, id: 'cereal', text: 'cereal', position: 'start' });
    sharePracticeAttempt('cereal', 's', score, 'start');
    sharePracticeAttempt('classic', 's', score, 'middle');
    expect(sent.map((e) => [e.wordId, e.position])).toEqual([
      ['cereal', 'start'],
      ['classic', 'middle'],
    ]);
  });

  it('without a position, uses the word bank, then the spelling', () => {
    expect(guessPosition('bus', 's')).toBe('end');
    expect(guessPosition('sun', 's')).toBe('start');
    expect(guessPosition('classic', 's')).toBe('middle');
    expect(guessPosition('practice', 's')).toBe('end');
  });
});

describe('lip capture entry', () => {
  it('holds the sound and the lip numbers, and nothing else that could be a picture', () => {
    const summary = {
      frames: 30,
      faceSeenShare: 1,
      rounded: 0.1,
      spread: 0.4,
      jawOpen: 0.05,
      roundedEnd: 0.2,
      spreadEnd: 0.4,
      shape: 'spread' as const,
      shapeEnd: 'spread' as const,
    };
    const entry = buildLipEntry({
      sound: 's',
      summary,
      tester: 'abc12345',
      label: 'MF',
      device: 'x'.repeat(500),
      at: '2026-11-14T00:00:00.000Z',
      attemptId: 'l1',
    });
    expect(entry.kind).toBe('lips');
    expect(entry.sound).toBe('s');
    expect(entry.device.length).toBe(200);
    expect(Object.keys(entry).sort()).toEqual(
      ['at', 'attemptId', 'device', 'kind', 'label', 'page', 'sound', 'summary', 'tester', 'v'].sort(),
    );
  });
});
