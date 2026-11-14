import type { Verdict } from '@/lib/types';

/** True only when this browser has a vibration motor API. */
export function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

/**
 * Vibrate the phone for a verdict: hit = one long pulse, close = two short pulses, miss = nothing.
 * iPhone Safari has no vibration API, so vibration works on Android only. Color is always shown too.
 * Returns false when nothing was vibrated.
 */
export function buzz(verdict: Verdict): boolean {
  if (!canVibrate()) return false;
  if (verdict === 'hit') return navigator.vibrate(200);
  if (verdict === 'close') return navigator.vibrate([60, 80, 60]);
  return false;
}
