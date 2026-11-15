import { WORD_BANK } from '@/content/words';
import { describeRuns, type RunInfo } from '@/lib/scoring';
import type { AttemptScore, FrameFeatures, PracticeWord, TargetSound, WordPosition } from '@/lib/types';

/**
 * Shared test log, for the team and for people who agree to help us tune.
 * Every try made on /lab is saved (numbers only, never audio, never a full name) unless the person
 * switches that off on the page. /lab is our tuning page and says so. Tries on the practice screen are
 * only saved when a tester switched that on at /lab. Real learners who never open /lab are never logged.
 * The saved tries are copied to the public `test-log` branch of the repo, so nothing private goes in.
 */

/**
 * What the tester says they really said. This is the "right answer" that tuning needs.
 * 'lisp': the sound was said with a lisp on purpose (tongue between the teeth), so the right verdict is close.
 */
export type Said = 'with-sound' | 'without-sound' | 'other-sound' | 'lisp' | 'unsure';

/**
 * One frame, shortened to save space: [tMs, level, hissRatio, centroidHz or -1, flatness or -1].
 * Entries logged before 2026-11-14 evening have only the first four numbers.
 */
export type PackedFrame = [number, number, number, number, number];

export interface TestLogEntry {
  v: 1;
  attemptId: string; // the same for every entry about one try, so a later answer replaces the first
  at: string; // ISO timestamp
  tester: string; // random id made on the device
  label: string; // optional nickname or initials the tester typed, never a full name
  page: 'practice' | 'lab' | 'guided';
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
const KEY_LAB = 'seespeak.testlog.lab';
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

/** Practice-screen sharing: off unless a tester switched it on. */
export function isSharing(): boolean {
  return read(KEY_ON) === '1';
}
/** Lab sharing: ON unless someone switched it off. /lab is our tuning page, not a learner screen. */
export function isLabSharing(): boolean {
  return read(KEY_LAB) !== '0';
}
export function setLabSharing(on: boolean): void {
  write(KEY_LAB, on ? '1' : '0');
}
export function newAttemptId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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
      f.flatness === undefined ? -1 : Number(f.flatness.toFixed(3)),
    ]);
}

/** Build one log entry. Pure, so it can be tested. */
export function buildEntry(input: {
  page: 'practice' | 'lab' | 'guided';
  word: Pick<PracticeWord, 'id' | 'target' | 'position'> & Partial<PracticeWord>;
  score: AttemptScore;
  frames: FrameFeatures[];
  sampleRate: number | null;
  said: Said | null;
  tester: string;
  label: string;
  device: string;
  at: string;
  attemptId: string;
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
    attemptId: input.attemptId,
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
  said: Said | null,
  attemptId: string,
  page: 'lab' | 'guided' = 'lab',
): Promise<boolean> {
  if (!isLabSharing()) return Promise.resolve(false);
  return send(
    buildEntry({
      page,
      word,
      score,
      frames,
      sampleRate,
      said,
      tester: testerId(),
      label: getLabel(),
      device: typeof navigator === 'undefined' ? '' : navigator.userAgent,
      at: new Date().toISOString(),
      attemptId,
    }),
  );
}

/**
 * Where the sound sits in a word the caller did not give a position for: the word bank first, then a guess
 * from the spelling (starts with the sound: start; ends with it: end; else middle). Plan and check words
 * that are not in the bank ("cereal", "classic") used to be logged as "end" every time.
 */
export function guessPosition(wordId: string, target: TargetSound): WordPosition {
  const known = WORD_BANK.find((w) => w.id === wordId && w.target === target);
  if (known) return known.position;
  const text = wordId.trim().toLowerCase();
  if (text.startsWith(target)) return 'start';
  if (text.endsWith(target) || (target === 's' && /(ce|se)$/.test(text))) return 'end';
  return 'middle';
}

/**
 * Share one try from the practice screen. Called from the store when a try is saved. Does nothing when off.
 * Pass `position` (the scored word's own position), so the log matches how the try was scored.
 */
export function sharePracticeAttempt(
  wordId: string,
  target: TargetSound,
  score: AttemptScore,
  position?: WordPosition,
): void {
  if (!isSharing() || lastFrames.length === 0) return;
  const word = { id: wordId, target, position: position ?? guessPosition(wordId, target) };
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
      attemptId: newAttemptId(),
    }),
  );
}
