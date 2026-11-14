import { WORD_BANK } from '@/content/words';
import { describeRuns, type RunInfo } from '@/lib/scoring';
import type { AttemptScore, FrameFeatures, PracticeWord, TargetSound, WordPosition } from '@/lib/types';

/**
 * Shared test log, for the team and for people who agree to help us tune.
 * OFF by default. A person switches it on at /lab on their own device. While it is on, every try on that
 * device sends its numbers (never audio, never a full name) to our private store, so the scoring can be
 * tuned on real voices. Real learners who never open /lab are never logged.
 */

/** What the tester says they really said. This is the "right answer" that tuning needs. */
export type Said = 'with-sound' | 'without-sound' | 'other-sound' | 'unsure';

/** One frame, shortened to save space: [tMs, level, hissRatio, centroidHz or -1]. */
export type PackedFrame = [number, number, number, number];

export interface TestLogEntry {
  v: 1;
  at: string; // ISO timestamp
  tester: string; // random id made on the device
  label: string; // optional nickname or initials the tester typed, never a full name
  page: 'practice' | 'lab';
  wordId: string;
  target: TargetSound;
  position: WordPosition;
  said: Said | null; // null on the practice page: we only know the word they were asked to say
  sampleRate: number | null;
  device: string; // browser and system, from the user agent
  score: AttemptScore;
  runs: RunInfo[];
  frames: PackedFrame[];
}

const KEY_ON = 'seespeak.testlog.on';
const KEY_TESTER = 'seespeak.testlog.tester';
const KEY_LABEL = 'seespeak.testlog.label';
const MAX_FRAMES = 600; // about 12 seconds

let lastFrames: FrameFeatures[] = [];
let lastSampleRate: number | null = null;

function read(key: string): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
  } catch {
    // Storage is blocked: sharing simply stays off.
  }
}

export function isSharing(): boolean {
  return read(KEY_ON) === '1';
}
export function setSharing(on: boolean): void {
  write(KEY_ON, on ? '1' : '0');
}
export function getLabel(): string {
  return read(KEY_LABEL) ?? '';
}
export function setLabel(label: string): void {
  write(KEY_LABEL, label.slice(0, 20));
}
function testerId(): string {
  let id = read(KEY_TESTER);
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    write(KEY_TESTER, id);
  }
  return id;
}

/** Called by the mic hook on every stop, so the frames of the last recording are at hand. */
export function rememberRecording(frames: FrameFeatures[], sampleRate: number | null): void {
  lastFrames = frames;
  lastSampleRate = sampleRate;
}

export function packFrames(frames: FrameFeatures[]): PackedFrame[] {
  return frames
    .slice(0, MAX_FRAMES)
    .map((f) => [
      Math.round(f.tMs),
      Number(f.level.toFixed(4)),
      Number(f.hissRatio.toFixed(3)),
      f.centroidHz === null ? -1 : Math.round(f.centroidHz),
    ]);
}

/** Build one log entry. Pure, so it can be tested. */
export function buildEntry(input: {
  page: 'practice' | 'lab';
  word: Pick<PracticeWord, 'id' | 'target' | 'position'> & Partial<PracticeWord>;
  score: AttemptScore;
  frames: FrameFeatures[];
  sampleRate: number | null;
  said: Said | null;
  tester: string;
  label: string;
  device: string;
  at: string;
}): TestLogEntry {
  const word: PracticeWord = {
    text: input.word.id,
    baseWord: null,
    contrastWord: null,
    sign: null,
    ...input.word,
  };
  return {
    v: 1,
    at: input.at,
    tester: input.tester,
    label: input.label,
    page: input.page,
    wordId: word.id,
    target: word.target,
    position: word.position,
    said: input.said,
    sampleRate: input.sampleRate,
    device: input.device.slice(0, 200),
    score: input.score,
    runs: describeRuns(input.frames, word),
    frames: packFrames(input.frames),
  };
}

async function send(entry: TestLogEntry): Promise<boolean> {
  try {
    const response = await fetch('/api/attempts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(entry),
      keepalive: true,
    });
    return response.ok;
  } catch {
    return false; // Logging must never get in the way of practice.
  }
}

/** Share one try from the lab, with what the tester says they really said. Resolves true when stored. */
export function shareLabAttempt(
  word: PracticeWord,
  score: AttemptScore,
  frames: FrameFeatures[],
  sampleRate: number | null,
  said: Said,
): Promise<boolean> {
  if (!isSharing()) return Promise.resolve(false);
  return send(
    buildEntry({
      page: 'lab',
      word,
      score,
      frames,
      sampleRate,
      said,
      tester: testerId(),
      label: getLabel(),
      device: typeof navigator === 'undefined' ? '' : navigator.userAgent,
      at: new Date().toISOString(),
    }),
  );
}

/** Share one try from the practice screen. Called from the store when a try is saved. Does nothing when off. */
export function sharePracticeAttempt(wordId: string, target: TargetSound, score: AttemptScore): void {
  if (!isSharing() || lastFrames.length === 0) return;
  const known = WORD_BANK.find((w) => w.id === wordId);
  const word = known ?? { id: wordId, target, position: 'end' as WordPosition };
  void send(
    buildEntry({
      page: 'practice',
      word,
      score,
      frames: lastFrames,
      sampleRate: lastSampleRate,
      said: null,
      tester: testerId(),
      label: getLabel(),
      device: typeof navigator === 'undefined' ? '' : navigator.userAgent,
      at: new Date().toISOString(),
    }),
  );
}
