import type { CheckSound, ListenPair } from '@/content/checks';
import type { PracticeWord, Verdict, WordPosition } from '@/lib/types';

/*
 * Pure logic for the speaking check and the listening check (issue #39). No browser, no storage.
 * Thresholds here are design choices (3 tries per spot is a small sample), not clinical cut-offs.
 */

const POSITIONS: WordPosition[] = ['start', 'middle', 'end'];
const SOUNDS: CheckSound[] = ['s', 'sh'];

// ---------- Speaking ----------

/**
 * Order the 18 check words so the same sound and spot never come twice in a row:
 * s start, sh start, s middle, sh middle, s end, sh end, then round two and three.
 */
export function orderCheckWords(words: PracticeWord[]): PracticeWord[] {
  const out: PracticeWord[] = [];
  const maxRounds = Math.max(0, ...POSITIONS.map((p) => words.filter((w) => w.position === p).length));
  for (let round = 0; round < maxRounds; round++) {
    for (const position of POSITIONS) {
      for (const sound of SOUNDS) {
        const cell = words.filter((w) => w.target === sound && w.position === position);
        if (round < cell.length) out.push(cell[round]);
      }
    }
  }
  return out;
}

/** One answered (or skipped) word in the speaking check. */
export interface SpeakingResult {
  sound: CheckSound;
  position: WordPosition;
  /** null when the learner skipped the word. Skips do not count against them. */
  verdict: Verdict | null;
}

export type SpotLevel = 'got' | 'almost' | 'not-yet';

export interface SpotSummary {
  sound: CheckSound;
  position: WordPosition;
  hits: number;
  /** Words that were said (skips left out). */
  said: number;
  level: SpotLevel;
}

/** got: every word said had the sound. almost: some did, or a hiss was there but nearer the other one. */
function levelOf(hits: number, closes: number, said: number): SpotLevel {
  if (said > 0 && hits === said) return 'got';
  if (hits > 0 || closes > 0) return 'almost';
  return 'not-yet';
}

export function summarizeSpeaking(results: SpeakingResult[]): SpotSummary[] {
  return SOUNDS.flatMap((sound) =>
    POSITIONS.map((position) => {
      const mine = results.filter((r) => r.sound === sound && r.position === position && r.verdict !== null);
      const hits = mine.filter((r) => r.verdict === 'hit').length;
      const closes = mine.filter((r) => r.verdict === 'close').length;
      return { sound, position, hits, said: mine.length, level: levelOf(hits, closes, mine.length) };
    }),
  );
}

/** Spots for the "try it alone" step: words were said there and none had the sound. */
export function spotsToTryAlone(summary: SpotSummary[]): SpotSummary[] {
  return summary.filter((s) => s.said > 0 && s.hits === 0);
}

/** Share of hits per sound, 0 to 1, over the words that were said. Goes into AssessmentReport.baseline. */
export function baselineOf(results: SpeakingResult[]): Partial<Record<CheckSound, number>> {
  const out: Partial<Record<CheckSound, number>> = {};
  for (const sound of SOUNDS) {
    const said = results.filter((r) => r.sound === sound && r.verdict !== null);
    if (said.length > 0) out[sound] = said.filter((r) => r.verdict === 'hit').length / said.length;
  }
  return out;
}

export type SpotKey = `${CheckSound}-${WordPosition}`;
export const spotKey = (sound: CheckSound, position: WordPosition): SpotKey => `${sound}-${position}`;

/**
 * Where practice starts. Among spots that are not "got": first a spot where the learner could say the
 * sound on its own (closest to working), then "almost", then "not yet". Ties go to "s" before "sh" and
 * start, middle, end. null when every spot is "got" (or nothing was said).
 */
export function startingSpot(
  summary: SpotSummary[],
  aloneHit: Partial<Record<SpotKey, boolean>> = {},
): SpotSummary | null {
  const open = summary.filter((s) => s.said > 0 && s.level !== 'got');
  const rank = (s: SpotSummary) =>
    aloneHit[spotKey(s.sound, s.position)] ? 0 : s.level === 'almost' ? 1 : 2;
  let best: SpotSummary | null = null;
  for (const s of open) if (best === null || rank(s) < rank(best)) best = s;
  return best;
}

// ---------- Listening ----------

export type ListenTrial =
  | { kind: 'detect'; sound: 's' | 'sh' | 'ah' | null } // null = a silent trial
  | { kind: 'pair'; pair: ListenPair; play: 's' | 'sh' };

/** Fisher-Yates shuffle with an injectable random source, so tests are repeatable. */
export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const PAIR_REPEATS = 3;

/**
 * 6 detection trials (s, sh, ah and 3 silent) in random order, then each pair 3 times in random order,
 * with either word playing. 4 pairs give 18 trials in all, about 2 minutes.
 */
export function buildListeningTrials(pairs: ListenPair[], random: () => number = Math.random): ListenTrial[] {
  const detect: ListenTrial[] = shuffle(
    (['s', 'sh', 'ah', null, null, null] as const).map((sound) => ({ kind: 'detect' as const, sound })),
    random,
  );
  const pairTrials: ListenTrial[] = [];
  for (const pair of pairs) {
    for (let i = 0; i < PAIR_REPEATS; i++) {
      pairTrials.push({ kind: 'pair', pair, play: random() < 0.5 ? 's' : 'sh' });
    }
  }
  return [...detect, ...shuffle(pairTrials, random)];
}

export type ListenAnswer =
  | { kind: 'detect'; sound: 's' | 'sh' | 'ah' | null; heard: boolean }
  | { kind: 'pair'; pair: ListenPair; play: 's' | 'sh'; picked: 's' | 'sh' };

/** Three "yes" answers on silent trials: the learner is guessing or the room is noisy, so stop kindly. */
export const MAX_FALSE_ALARMS = 3;

export function shouldStopListening(answers: ListenAnswer[]): boolean {
  return answers.filter((a) => a.kind === 'detect' && a.sound === null && a.heard).length >= MAX_FALSE_ALARMS;
}

export type ListenLevel = 'easy' | 'harder' | 'not-sure';

export interface ListenSummary {
  /** Detection: which played sounds were heard. Silent trials are left out. */
  heard: Partial<Record<'s' | 'sh' | 'ah', boolean>>;
  falseAlarms: number;
  contrastCorrect: number;
  contrastTotal: number;
  controlCorrect: number;
  controlTotal: number;
  /** Telling "s" and "sh" apart. not-sure when the control pair or the silent trials say the answers are unreliable. */
  level: ListenLevel;
}

/** At least this share of s/sh pair trials right counts as "easy". A design choice, not a norm. */
export const EASY_SHARE = 0.8;

export function summarizeListening(answers: ListenAnswer[]): ListenSummary {
  const heard: ListenSummary['heard'] = {};
  let falseAlarms = 0;
  let contrastCorrect = 0;
  let contrastTotal = 0;
  let controlCorrect = 0;
  let controlTotal = 0;
  for (const a of answers) {
    if (a.kind === 'detect') {
      if (a.sound === null) {
        if (a.heard) falseAlarms++;
      } else heard[a.sound] = a.heard;
    } else if (a.pair.control) {
      controlTotal++;
      if (a.picked === a.play) controlCorrect++;
    } else {
      contrastTotal++;
      if (a.picked === a.play) contrastCorrect++;
    }
  }
  const unreliable =
    contrastTotal === 0 || falseAlarms >= 2 || (controlTotal > 0 && controlCorrect / controlTotal < 0.5);
  const level: ListenLevel = unreliable
    ? 'not-sure'
    : contrastCorrect / contrastTotal >= EASY_SHARE
      ? 'easy'
      : 'harder';
  return { heard, falseAlarms, contrastCorrect, contrastTotal, controlCorrect, controlTotal, level };
}
