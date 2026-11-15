import { describe, expect, it } from 'vitest';
import { LISTEN_PAIRS, checkWordsFor } from '@/content/checks';
import {
  type ListenAnswer,
  type SpeakingResult,
  baselineOf,
  buildListeningTrials,
  orderCheckWords,
  shouldStopListening,
  spotKey,
  spotsToTryAlone,
  startingSpot,
  summarizeListening,
  summarizeSpeaking,
} from '@/lib/checks';

/** Repeatable "random" numbers for the tests. */
function seeded(seed: number): () => number {
  let x = seed;
  return () => {
    x = (x * 16807) % 2147483647;
    return (x - 1) / 2147483646;
  };
}

describe('orderCheckWords', () => {
  it('keeps all 18 words and never repeats the same sound and spot back to back', () => {
    const ordered = orderCheckWords(checkWordsFor('teen'));
    expect(ordered).toHaveLength(18);
    expect(new Set(ordered.map((w) => w.id)).size).toBe(18);
    for (let i = 1; i < ordered.length; i++) {
      const a = ordered[i - 1];
      const b = ordered[i];
      expect(a.target === b.target && a.position === b.position).toBe(false);
    }
    expect(ordered.slice(0, 2).map((w) => `${w.target}-${w.position}`)).toEqual(['s-start', 'sh-start']);
  });
});

const r = (sound: 's' | 'sh', position: 'start' | 'middle' | 'end', verdict: SpeakingResult['verdict']) => ({
  sound,
  position,
  verdict,
});

describe('summarizeSpeaking', () => {
  const results: SpeakingResult[] = [
    r('s', 'start', 'hit'),
    r('s', 'start', 'hit'),
    r('s', 'start', null), // skipped
    r('s', 'middle', 'hit'),
    r('s', 'middle', 'miss'),
    r('s', 'end', 'miss'),
    r('s', 'end', 'miss'),
    r('s', 'end', 'miss'),
    r('sh', 'start', 'close'),
  ];
  const summary = summarizeSpeaking(results);
  const spot = (sound: 's' | 'sh', position: 'start' | 'middle' | 'end') =>
    summary.find((s) => s.sound === sound && s.position === position)!;

  it('gives one entry per sound and spot', () => {
    expect(summary).toHaveLength(6);
  });
  it('does not count skips against the learner', () => {
    expect(spot('s', 'start')).toMatchObject({ hits: 2, said: 2, level: 'got' });
  });
  it('calls a mix "almost", a "close" hiss "almost", and no hiss "not yet"', () => {
    expect(spot('s', 'middle').level).toBe('almost');
    expect(spot('sh', 'start').level).toBe('almost');
    expect(spot('s', 'end').level).toBe('not-yet');
  });
  it('asks to try alone only where words were said and none hit', () => {
    expect(spotsToTryAlone(summary).map((s) => spotKey(s.sound, s.position))).toEqual(['s-end', 'sh-start']);
  });
  it('baseline is the share of hits over words said', () => {
    expect(baselineOf(results)).toEqual({ s: 3 / 7, sh: 0 });
  });
  it('starts where the learner could already say the sound alone', () => {
    expect(startingSpot(summary)?.position).toBe('middle'); // "almost" beats "not yet"
    expect(startingSpot(summary, { 's-end': true })).toMatchObject({ sound: 's', position: 'end' });
  });
  it('returns null when every spot was got', () => {
    const all = summarizeSpeaking([r('s', 'start', 'hit')]);
    expect(startingSpot(all)).toBeNull();
  });
});

describe('buildListeningTrials', () => {
  it('has 6 detection trials (3 silent) first, then each pair 3 times', () => {
    const trials = buildListeningTrials(LISTEN_PAIRS.child, seeded(7));
    expect(trials).toHaveLength(18);
    const detect = trials.slice(0, 6);
    expect(detect.every((t) => t.kind === 'detect')).toBe(true);
    expect(detect.filter((t) => t.kind === 'detect' && t.sound === null)).toHaveLength(3);
    for (const pair of LISTEN_PAIRS.child) {
      expect(trials.filter((t) => t.kind === 'pair' && t.pair === pair)).toHaveLength(3);
    }
  });
  it('is repeatable with the same random source', () => {
    expect(buildListeningTrials(LISTEN_PAIRS.adult, seeded(3))).toEqual(
      buildListeningTrials(LISTEN_PAIRS.adult, seeded(3)),
    );
  });
});

describe('summarizeListening', () => {
  const [sipShip, , , control] = LISTEN_PAIRS.child;
  const pairAnswer = (play: 's' | 'sh', picked: 's' | 'sh', pair = sipShip): ListenAnswer => ({
    kind: 'pair',
    pair,
    play,
    picked,
  });

  it('says easy when s and sh pairs are right and the control is right', () => {
    const answers: ListenAnswer[] = [
      { kind: 'detect', sound: 's', heard: true },
      { kind: 'detect', sound: null, heard: false },
      ...Array.from({ length: 5 }, () => pairAnswer('s', 's')),
      pairAnswer('s', 's', control),
    ];
    const sum = summarizeListening(answers);
    expect(sum).toMatchObject({ level: 'easy', contrastCorrect: 5, contrastTotal: 5, falseAlarms: 0 });
    expect(sum.heard).toEqual({ s: true });
  });
  it('says harder when many s and sh pairs are mixed up', () => {
    const answers = [
      pairAnswer('s', 'sh'),
      pairAnswer('sh', 's'),
      pairAnswer('s', 's'),
      pairAnswer('s', 's', control),
    ];
    expect(summarizeListening(answers).level).toBe('harder');
  });
  it('says not sure when the control pair or the silent trials go wrong', () => {
    expect(summarizeListening([pairAnswer('s', 's'), pairAnswer('s', 'sh', control)]).level).toBe('not-sure');
    const alarms: ListenAnswer[] = [
      { kind: 'detect', sound: null, heard: true },
      { kind: 'detect', sound: null, heard: true },
      pairAnswer('s', 's'),
    ];
    expect(summarizeListening(alarms).level).toBe('not-sure');
  });
  it('stops after 3 yes answers on silent trials', () => {
    const yes: ListenAnswer = { kind: 'detect', sound: null, heard: true };
    expect(shouldStopListening([yes, yes])).toBe(false);
    expect(shouldStopListening([yes, yes, yes])).toBe(true);
  });
});
