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

/** What `giveFeedback` did, so the screen can always show the visual twin. */
export interface FeedbackResult {
  /** True only when the device really accepted the vibration. */
  vibrated: boolean;
  /** The vibration pattern in ms that was asked for (empty for a miss). */
  pattern: number[];
  /** The picture to show on screen: hit = one long pulse, close = two short pulses, miss = none. */
  pulse: 'long' | 'double' | 'none';
}

/**
 * Vibrate for a verdict (where the device can) and report what happened. Always show `pulse` on screen:
 * iPhones cannot vibrate from a web page, and some people will not feel it.
 */
export function giveFeedback(verdict: Verdict): FeedbackResult {
  const pattern = verdict === 'hit' ? [200] : verdict === 'close' ? [60, 80, 60] : [];
  const pulse = verdict === 'hit' ? 'long' : verdict === 'close' ? 'double' : 'none';
  if (pattern.length === 0 || !canVibrate()) return { vibrated: false, pattern, pulse };
  let vibrated = false;
  try {
    vibrated = navigator.vibrate(pattern) === true;
  } catch {
    vibrated = false; // some browsers throw when vibration is blocked
  }
  return { vibrated, pattern, pulse };
}
