import type { Attempt } from '@/lib/types';
import type { Streak } from './types';

/** Points for every try, hit or miss, so a miss never feels like a loss. */
export const POINTS_PER_TRY = 1;
/** Extra points for a try that scored a hit. */
export const POINTS_PER_HIT = 2;
/** Tries in one day that earn the daily bonus. */
export const DAILY_GOAL_TRIES = 10;
/** The daily bonus, given once per calendar day. */
export const DAILY_BONUS = 5;
/** Missed days in a row that end a streak. One missed day is forgiven. */
export const MISSED_DAYS_TO_BREAK = 2;

/** Local calendar day as "YYYY-MM-DD", or null when the date is unreadable. */
export function dayKey(d: Date | string): string | null {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return null;
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${day}`;
}

function triesPerDay(attempts: Attempt[]): Map<string, number> {
  const days = new Map<string, number>();
  for (const a of attempts) {
    const key = dayKey(a.createdAt);
    if (key) days.set(key, (days.get(key) ?? 0) + 1);
  }
  return days;
}

/** All points earned so far: 1 per try, +2 per hit, +5 once per day that reaches 10 tries. */
export function pointsFor(attempts: Attempt[]): number {
  let points = 0;
  for (const a of attempts) {
    points += POINTS_PER_TRY;
    if (a.score.verdict === 'hit') points += POINTS_PER_HIT;
  }
  for (const count of triesPerDay(attempts).values()) {
    if (count >= DAILY_GOAL_TRIES) points += DAILY_BONUS;
  }
  return points;
}

/**
 * Days in a row with at least one try, counting back from `today`. A forgiving streak: one missed day does
 * not reset it (the missed day is just not counted), two missed days in a row do. Today with no try yet is
 * not a miss, because the day is not over.
 */
export function streakFor(attempts: Attempt[], today: Date): Streak {
  const days = triesPerDay(attempts);
  const todayKey = dayKey(today);
  const practicedToday = todayKey !== null && days.has(todayKey);
  if (days.size === 0 || todayKey === null) return { days: 0, practicedToday };
  const earliest = [...days.keys()].sort()[0];

  let count = 0;
  let missed = 0;
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  for (let i = 0; i < 3660; i++) {
    const key = dayKey(cursor);
    if (key === null || key < earliest) break;
    if (days.has(key)) {
      count += 1;
      missed = 0;
    } else if (i > 0 || practicedToday) {
      missed += 1;
      if (missed >= MISSED_DAYS_TO_BREAK) break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return { days: count, practicedToday };
}
