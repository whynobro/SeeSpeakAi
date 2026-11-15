/**
 * Hands-free recording: decide when a try is over. Pure, so it can be tested.
 * A try ends when the person has made sound and then been quiet for a while, or when time runs out.
 * "Quiet" is relative to the loudest moment of this recording, so it works at any mic gain.
 */

/** One reading of loudness: time in ms, and the level (0 to 1). */
export interface LevelPoint {
  tMs: number;
  level: number;
}

/** Stop after this much quiet that follows sound (ms). */
export const AUTO_STOP_QUIET_MS = 1000;
/** Stop no matter what after this long (ms). */
export const AUTO_STOP_MAX_MS = 4000;
/** The loudest moment must reach this level before it counts as "made sound". Above mic noise. */
export const AUTO_STOP_MIN_PEAK = 0.004;
/** A moment counts as quiet when it is below this share of the loudest moment. */
export const AUTO_STOP_QUIET_SHARE = 0.15;

export type AutoStopReason = 'quiet' | 'max-time' | null;

/** Whether to stop now, and why. `null` means keep listening. */
export function autoStopReason(points: LevelPoint[]): AutoStopReason {
  if (points.length === 0) return null;
  const first = points[0].tMs;
  const last = points[points.length - 1].tMs;
  const peak = points.reduce((m, p) => Math.max(m, p.level), 0);
  if (peak >= AUTO_STOP_MIN_PEAK) {
    const quietBelow = peak * AUTO_STOP_QUIET_SHARE;
    // Walk back from the newest reading while it stays quiet.
    let quietSince = last;
    for (let i = points.length - 1; i >= 0 && points[i].level < quietBelow; i--) quietSince = points[i].tMs;
    // Only quiet that comes after the loudest moment counts: a person pausing mid-word has not finished.
    const peakAt = points.find((p) => p.level === peak)?.tMs ?? first;
    if (quietSince > peakAt && last - quietSince >= AUTO_STOP_QUIET_MS) return 'quiet';
  }
  if (last - first >= AUTO_STOP_MAX_MS) return 'max-time';
  return null;
}

/** True when the whole recording never rose above mic noise: nothing was said. */
export function heardNothing(points: LevelPoint[]): boolean {
  return points.every((p) => p.level < AUTO_STOP_MIN_PEAK);
}
