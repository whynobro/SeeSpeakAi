import { isTargetSound } from '@/lib/scoring/constants';
import { sharePracticeAttempt } from '@/lib/testlog';
import type { Attempt, HearingProfile, LearnerSettings, SoundProgress, TargetSound } from '@/lib/types';

/** Everything here stays on this device. Every function is safe with no storage, blocked storage or bad JSON. */

const KEYS = {
  profile: 'seespeak.profile',
  settings: 'seespeak.settings',
  attempts: 'seespeak.attempts',
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

export function saveAttempt(a: Attempt): void {
  writeJson(KEYS.attempts, [...loadAttempts(), a]);
  // Does nothing unless a tester switched on the shared test log at /lab.
  sharePracticeAttempt(a.wordId, a.target, a.score);
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

/** Before and after numbers for one sound. Pure: no storage. */
export function progressFor(attempts: Attempt[], sound: TargetSound): SoundProgress {
  const mine = attempts
    .filter((a) => a.target === sound)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));
  return {
    sound,
    attempts: mine.length,
    firstAccuracy: hitShare(mine.slice(0, 10)),
    latestAccuracy: hitShare(mine.slice(-10)),
  };
}
