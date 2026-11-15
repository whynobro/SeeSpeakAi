import { LEVELS, isLevelId, type LevelId } from '@/lib/levels';
import { TARGET_SOUNDS, isTargetSound } from '@/lib/scoring/constants';
import type { TargetSound } from '@/lib/types';

/*
 * What a speech therapist set for home practice: sounds, a starting level and days a week.
 * It travels in a link (/assign?sounds=s,sh&level=start&days=5) and is kept in this browser only.
 * It never holds a name or any free text, so nothing that could identify a learner is in a URL.
 */

/** Sounds a therapist can pick that the app shows but never scores. */
export const SHOW_ONLY_SOUNDS = ['r', 'th'] as const;
export const DAY_CHOICES = [3, 5, 7] as const;
export type AssignDays = (typeof DAY_CHOICES)[number];

export interface Assignment {
  /** Scored sounds first, then show-only ones. Never empty. */
  sounds: string[];
  level: LevelId;
  /** null when the link had no valid number of days. */
  days: AssignDays | null;
}

const KEY = 'seespeak:assignment';
const ALLOWED: readonly string[] = [...TARGET_SOUNDS, ...SHOW_ONLY_SOUNDS];

function isDays(v: unknown): v is AssignDays {
  return (DAY_CHOICES as readonly unknown[]).includes(v);
}

/** Strict check of values from outside (a link or storage). Unknown sounds are dropped. No sounds left: null. */
export function toAssignment(sounds: unknown, level: unknown, days: unknown): Assignment | null {
  if (!Array.isArray(sounds)) return null;
  const asked = new Set(sounds.filter((s): s is string => typeof s === 'string'));
  // Built from our own list, so the order is fixed and nothing typed into a link is ever shown.
  const kept = ALLOWED.filter((s) => asked.has(s));
  if (kept.length === 0) return null;
  return {
    sounds: kept,
    level: isLevelId(level) ? level : LEVELS[0].id,
    days: isDays(days) ? days : null,
  };
}

/** Read an assignment from link params. A hand-edited link gives a smaller assignment or null, never a crash. */
export function assignmentFromParams(get: (key: string) => string | null): Assignment | null {
  const sounds = (get('sounds') ?? '')
    .slice(0, 100)
    .split(',')
    .map((s) => s.trim().toLowerCase());
  return toAssignment(sounds, get('level'), Number(get('days')));
}

/** The path and query of the practice link. Put the site origin in front. */
export function assignPath(a: Assignment): string {
  const days = a.days === null ? '' : `&days=${a.days}`;
  return `/assign?sounds=${a.sounds.join(',')}&level=${a.level}${days}`;
}

export function scoredSounds(a: Assignment): TargetSound[] {
  return a.sounds.filter(isTargetSound);
}

/** Where Start goes: the first scored sound at the set level, or the plan when no sound can be scored. */
export function assignmentStartHref(a: Assignment): string {
  const first = scoredSounds(a)[0];
  return first ? `/practice?sound=${first}&level=${a.level}` : '/plan';
}

export function quotedSounds(sounds: readonly string[]): string {
  return sounds.map((s) => `"${s}"`).join(', ');
}

export function saveAssignment(a: Assignment): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    // Storage blocked (private mode): practice still starts, the home card just does not show.
  }
}

export function loadAssignment(): Assignment | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<Assignment> | null;
    // The same strict check as a link, so an old or broken value never crashes a screen.
    return v && typeof v === 'object' ? toAssignment(v.sounds, v.level, v.days) : null;
  } catch {
    return null;
  }
}
