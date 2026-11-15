import { normalizeLevelResult, type LevelResults } from '@/lib/levels';
import { isTargetSound } from '@/lib/scoring/constants';
import { sharePracticeAttempt } from '@/lib/testlog';
import type {
  Attempt,
  HearingProfile,
  LearnerGoals,
  LearnerSettings,
  SoundProgress,
  TargetSound,
  WordPosition,
} from '@/lib/types';

/** Everything here stays on this device. Every function is safe with no storage, blocked storage or bad JSON. */

const KEYS = {
  profile: 'seespeak.profile',
  settings: 'seespeak.settings',
  attempts: 'seespeak.attempts',
  goals: 'seespeak.goals',
  listening: 'seespeak.listening',
  /** Owned and equipped shop items. Written by src/lib/rewards. */
  wallet: 'seespeak.wallet',
  /** Best result per sound and level. Shape in src/lib/levels. */
  levels: 'seespeak.levels',
} as const;

const DEFAULT_SETTINGS: LearnerSettings = {
  nickname: '',
  showSigns: false,
  channels: ['color', 'vibration'],
};

function readJson(key: string): unknown {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is full or blocked: practice still works, it just is not remembered.
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function loadProfile(): HearingProfile | null {
  const v = readJson(KEYS.profile);
  if (!isRecord(v)) return null;
  if (v.source !== 'ling6' && v.source !== 'audiogram') return null;
  if (typeof v.createdAt !== 'string') return null;
  return v as unknown as HearingProfile;
}

export function saveProfile(p: HearingProfile): void {
  writeJson(KEYS.profile, p);
}

export function loadSettings(): LearnerSettings {
  const v = readJson(KEYS.settings);
  if (!isRecord(v)) return { ...DEFAULT_SETTINGS, channels: [...DEFAULT_SETTINGS.channels] };
  return {
    nickname: typeof v.nickname === 'string' ? v.nickname : DEFAULT_SETTINGS.nickname,
    showSigns: typeof v.showSigns === 'boolean' ? v.showSigns : DEFAULT_SETTINGS.showSigns,
    channels: Array.isArray(v.channels)
      ? (v.channels.filter(
          (c) => c === 'color' || c === 'vibration' || c === 'shifted-audio',
        ) as LearnerSettings['channels'])
      : [...DEFAULT_SETTINGS.channels],
  };
}

export function saveSettings(s: LearnerSettings): void {
  writeJson(KEYS.settings, s);
}

export function loadAttempts(): Attempt[] {
  const v = readJson(KEYS.attempts);
  if (!Array.isArray(v)) return [];
  return v.filter(
    (a): a is Attempt => isRecord(a) && typeof a.createdAt === 'string' && isTargetSound(a.target),
  );
}

/** `position` is where the sound sits in the scored word, so the shared test log records it right. */
export function saveAttempt(a: Attempt, position?: WordPosition): void {
  writeJson(KEYS.attempts, [...loadAttempts(), a]);
  // Does nothing unless a tester switched on the shared test log at /lab.
  sharePracticeAttempt(a.wordId, a.target, a.score, position);
}

/** The learner's goals from the goals screen, already cleaned of names. */
export function loadGoals(): LearnerGoals | null {
  const v = readJson(KEYS.goals);
  if (!isRecord(v) || typeof v.text !== 'string' || !Array.isArray(v.chips)) return null;
  return { chips: v.chips.filter((c): c is string => typeof c === 'string'), text: v.text };
}

export function saveGoals(g: LearnerGoals): void {
  writeJson(KEYS.goals, g);
}

/** One listening check result, kept so the next run can be compared with it. Numbers only. */
export interface ListeningRun {
  createdAt: string;
  ageGroup: 'child' | 'teen' | 'adult';
  level: 'easy' | 'harder' | 'not-sure';
  contrastCorrect: number;
  contrastTotal: number;
  devices: 'on' | 'off' | 'none';
}

const MAX_LISTENING_RUNS = 20;

export function loadListeningRuns(): ListeningRun[] {
  const v = readJson(KEYS.listening);
  if (!Array.isArray(v)) return [];
  return v.filter(
    (r): r is ListeningRun =>
      isRecord(r) &&
      typeof r.createdAt === 'string' &&
      (r.level === 'easy' || r.level === 'harder' || r.level === 'not-sure') &&
      typeof r.contrastCorrect === 'number' &&
      typeof r.contrastTotal === 'number',
  );
}

export function saveListeningRun(run: ListeningRun): void {
  writeJson(KEYS.listening, [...loadListeningRuns(), run].slice(-MAX_LISTENING_RUNS));
}

/** Saved level results (see `src/lib/levels`). Anything that is not a valid result is dropped. */
export function loadLevelResults(): LevelResults {
  const raw = readJson(KEYS.levels);
  if (!isRecord(raw)) return {};
  const out: LevelResults = {};
  for (const [key, v] of Object.entries(raw)) {
    const r = normalizeLevelResult(v);
    if (r) out[key] = r;
  }
  return out;
}

export function saveLevelResults(results: LevelResults): void {
  writeJson(KEYS.levels, results);
}

export function clearAll(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    for (const key of Object.values(KEYS)) localStorage.removeItem(key);
  } catch {
    // Nothing to clear when storage is blocked.
  }
}

function hitShare(list: Attempt[]): number | null {
  if (list.length === 0) return null;
  return list.filter((a) => a.score.verdict === 'hit').length / list.length;
}

/** Fewest tries before before-and-after numbers are shown (the first half against the second half). */
export const MIN_TRIES_FOR_CHANGE = 6;

/** How many tries each of "before" and "after" covers: half the tries, at most 10, so they never overlap. */
export function progressWindow(tries: number): number {
  return Math.min(10, Math.floor(tries / 2));
}

/** Before and after numbers for one sound. Pure: no storage. */
export function progressFor(attempts: Attempt[], sound: TargetSound): SoundProgress {
  const mine = attempts
    .filter((a) => a.target === sound)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));
  return {
    sound,
    attempts: mine.length,
    firstAccuracy: hitShare(mine.slice(0, Math.max(1, progressWindow(mine.length)))),
    latestAccuracy: hitShare(mine.slice(-Math.max(1, progressWindow(mine.length)))),
  };
}
