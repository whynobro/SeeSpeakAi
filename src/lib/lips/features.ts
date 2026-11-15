import type { LipFrame, LipShape, LipSummary } from './types';

/*
 * Blendshape names reported by the face_landmarker model (checked inside the model file):
 *   mouthPucker, mouthFunnel                      lips pushed forward and rounded ("sh")
 *   mouthSmileLeft, mouthSmileRight               smile
 *   mouthStretchLeft, mouthStretchRight           lips pulled sideways ("s")
 *   jawOpen                                       how far the mouth is open
 * Each score runs from 0 to 1.
 */

/** Needs a face in at least this share of frames, or the call is 'unknown'. Starting value. */
export const MIN_FACE_SHARE = 0.5;
/** Fewer frames than this and the call is 'unknown'. Starting value. */
export const MIN_FRAMES = 3;
/** Share of the try treated as "the end", where an end-of-word sound sits. */
export const END_SHARE = 1 / 3;

/*
 * Cutoffs for the shape call. They work on "lean" = rounded minus spread (-1 to 1), not on absolute scores,
 * because a real face reaches nowhere near 1 on either. All of these come from ONE capture of ONE face
 * (Michael, Windows laptop webcam, 2026-11-14, "sss" then "shh" held in the same capture):
 *   the whole capture (mostly "sss"): rounded 0.107, spread 0.449, lean -0.34
 *   the last third ("shh"):           rounded 0.207, spread 0.408, lean -0.20
 * Rounding doubled for "sh" but stayed under spread, so "rounded" cannot mean "rounded beats spread".
 * They need more faces. Re-tune from the saved lip captures on /lab/lips before trusting them.
 */
/** Lean at or below this is a smile ("s" lips). Starting value, one face. */
export const SPREAD_LEAN = -0.3;
/** Lean at or above this (and rounding of at least MIN_ROUNDED) is rounded ("sh" lips). Starting value, one face. */
export const ROUNDED_LEAN = -0.22;
/** Rounding must be at least this, so a relaxed mouth is never called rounded. Starting value, one face. */
export const MIN_ROUNDED = 0.15;
/** With a person's own smile as the baseline: rounded needs lean this much above the baseline. */
export const BASELINE_ROUNDED_SHIFT = 0.1;
/** With a baseline: lean within this much above the baseline still counts as the same smile. */
export const BASELINE_SPREAD_SHIFT = 0.04;
/** The "sh" capture must sit at least this far above the "s" capture in lean to say they are separable. */
export const MIN_SEPARATION = 0.1;
/** Kill switch for lip tips. The badge and the saved numbers stay. Set false if the cutoffs prove unreliable. */
export const LIP_TIPS_ENABLED = true;

/** A person's own "s" (smile) lean, taken from their "sss" capture. Later calls are judged against it. */
export interface LipBaseline {
  smileLean: number;
}

const clamp01 = (n: number): number => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);
const avg = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function lipFrameFromBlendshapes(scores: Record<string, number>, tMs: number): LipFrame {
  const get = (name: string): number => clamp01(scores[name] ?? 0);
  const smile = avg([get('mouthSmileLeft'), get('mouthSmileRight')]);
  const stretch = avg([get('mouthStretchLeft'), get('mouthStretchRight')]);
  return {
    tMs,
    faceSeen: true,
    rounded: Math.max(get('mouthPucker'), get('mouthFunnel')),
    spread: Math.max(smile, stretch),
    jawOpen: get('jawOpen'),
  };
}

/** Roundedness minus spread. Positive: rounder than wide. */
export const leanOf = (rounded: number, spread: number): number => rounded - spread;

function callShape(rounded: number, spread: number, baseline?: LipBaseline): LipShape {
  const lean = leanOf(rounded, spread);
  if (baseline) {
    const shift = lean - baseline.smileLean;
    if (shift >= BASELINE_ROUNDED_SHIFT && rounded >= MIN_ROUNDED) return 'rounded';
    return shift <= BASELINE_SPREAD_SHIFT ? 'spread' : 'neutral';
  }
  if (lean <= SPREAD_LEAN) return 'spread';
  if (lean >= ROUNDED_LEAN && rounded >= MIN_ROUNDED) return 'rounded';
  return 'neutral';
}

/** The shape of one camera frame, for a live badge. 'unknown' when no face was seen. */
export function frameShape(f: LipFrame | null): LipShape {
  return f && f.faceSeen ? callShape(f.rounded, f.spread) : 'unknown';
}

export function baselineFrom(smile: LipSummary): LipBaseline {
  return { smileLean: leanOf(smile.rounded, smile.spread) };
}

/** The call for a try, judged against the person's own smile instead of fixed cutoffs. */
export function shapeAgainst(summary: LipSummary, baseline: LipBaseline): LipShape {
  if (summary.shape === 'unknown') return 'unknown';
  return callShape(summary.rounded, summary.spread, baseline);
}

/** How far the "sh" capture sits above the "s" capture in lean. Needs MIN_SEPARATION or more. */
export function lipSeparation(s: LipSummary, sh: LipSummary): number {
  return leanOf(sh.rounded, sh.spread) - leanOf(s.rounded, s.spread);
}

export function summarizeLips(frames: LipFrame[]): LipSummary {
  const seen = frames.filter((f) => f.faceSeen);
  const endFrom = Math.floor(frames.length * (1 - END_SHARE));
  const endSeen = frames.slice(endFrom).filter((f) => f.faceSeen);
  const rounded = avg(seen.map((f) => f.rounded));
  const spread = avg(seen.map((f) => f.spread));
  const roundedEnd = avg(endSeen.map((f) => f.rounded));
  const spreadEnd = avg(endSeen.map((f) => f.spread));
  const faceSeenShare = frames.length ? seen.length / frames.length : 0;
  const usable = frames.length >= MIN_FRAMES && faceSeenShare >= MIN_FACE_SHARE;
  return {
    frames: frames.length,
    faceSeenShare,
    rounded,
    spread,
    jawOpen: avg(seen.map((f) => f.jawOpen)),
    roundedEnd,
    spreadEnd,
    shape: usable ? callShape(rounded, spread) : 'unknown',
    shapeEnd: usable && endSeen.length > 0 ? callShape(roundedEnd, spreadEnd) : 'unknown',
  };
}

/** One short sentence when the lips do not match the target sound. Null when they match, are unknown or tips are off. */
export function lipHint(target: 's' | 'sh', summary: LipSummary): string | null {
  if (!LIP_TIPS_ENABLED) return null;
  if (target === 's' && summary.shape === 'rounded') {
    return 'Your lips were rounded. For "s", smile so your lips pull back.';
  }
  if (target === 'sh' && summary.shape === 'spread') {
    return 'Your lips were pulled back. For "sh", round your lips and push them forward.';
  }
  return null;
}

/** The same tip, for a "close" try where the hiss came out as the other sound. The tip comes first. */
export function lipCloseHint(target: 's' | 'sh', summary: LipSummary): string | null {
  if (!LIP_TIPS_ENABLED) return null;
  if (target === 's' && summary.shape === 'rounded') {
    return 'Your lips rounded, so it came out nearer "sh". For "s", smile so your lips pull back.';
  }
  if (target === 'sh' && summary.shape === 'spread') {
    return 'Your lips were pulled back, so it came out nearer "s". For "sh", round your lips and push them forward.';
  }
  return null;
}
