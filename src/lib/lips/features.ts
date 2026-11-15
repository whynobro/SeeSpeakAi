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
/** The stronger of rounded and spread must reach this, or the lips are 'neutral'. Starting value. */
export const MIN_SHAPE_SCORE = 0.2;
/** The stronger must beat the other by this much to count as clear. Starting value. */
export const SHAPE_MARGIN = 0.1;
/** Share of the try treated as "the end", where an end-of-word sound sits. */
export const END_SHARE = 1 / 3;

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

function callShape(rounded: number, spread: number): LipShape {
  const top = Math.max(rounded, spread);
  if (top < MIN_SHAPE_SCORE || Math.abs(rounded - spread) < SHAPE_MARGIN) return 'neutral';
  return rounded > spread ? 'rounded' : 'spread';
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

/** One short sentence when the lips do not match the target sound. Null when they match or are unknown. */
export function lipHint(target: 's' | 'sh', summary: LipSummary): string | null {
  if (target === 's' && summary.shape === 'rounded') {
    return 'Your lips were rounded. For "s", smile so your lips pull back.';
  }
  if (target === 'sh' && summary.shape === 'spread') {
    return 'Your lips were pulled back. For "sh", round your lips and push them forward.';
  }
  return null;
}
