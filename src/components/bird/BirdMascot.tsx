'use client';

import { useSyncExternalStore } from 'react';
import { BirdArt } from './BirdArt';
import { isBirdHidden, subscribeBirdHidden } from './birdSignal';

/*
 * The bird on the practice screen. It sits in the top right corner of the page header and stays there:
 * it is a normal part of the page (position: absolute inside the header), so it scrolls with the page like
 * everything else. It does not fly, follow the pointer or a finger, or move on its own.
 *
 * Its beak opens with the mic level while listening. Loudness only: the bird is never a verdict and never
 * reacts to a hit or a miss. With reduced motion it keeps its beak shut and does not blink.
 * It never takes a tap (pointer-events: none) and screen readers skip it (aria-hidden).
 */

/** Width and height of the bird's box, in px. */
export const BIRD_SIZE_PX = 48;
/** Mic level under the floor is ignored, the rest is multiplied by the gain. */
const BEAK_FLOOR = 0.05;
const BEAK_GAIN = 1.8;

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

const REDUCED = '(prefers-reduced-motion: reduce)';
const subscribeReduced = (listener: () => void) => {
  const query = window.matchMedia(REDUCED);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
};
const isReduced = () => window.matchMedia(REDUCED).matches;

/** Put it in a positioned header (`relative`). `level` is the mic level, 0 to 1, or 0 when not listening. */
export function BirdMascot({ level }: { level: number }) {
  const hidden = useSyncExternalStore(subscribeBirdHidden, isBirdHidden, () => false);
  const reduced = useSyncExternalStore(subscribeReduced, isReduced, () => false);
  if (hidden) return null;
  const beak = reduced ? 0 : clamp((level - BEAK_FLOOR) * BEAK_GAIN, 0, 1);
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 right-0 select-none"
      style={{ width: BIRD_SIZE_PX, height: BIRD_SIZE_PX }}
    >
      <BirdArt facing="left" beak={beak} blink={!reduced} className="h-full w-full" />
    </div>
  );
}
