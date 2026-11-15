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
 *
 * The bird is also the help button. It is a real button (48 px, focus ring, labelled "Ask the bird for help").
 * After three tries in a row that did not count, a small bubble says "Stuck? Tap me" (words, not color).
 * If the learner switched the bird off in settings, a plain "Help" button takes its place so help stays reachable.
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

/**
 * Put it in a positioned header (`relative`). `level` is the mic level, 0 to 1, or 0 when not listening.
 * `onPress` is the help action. `nudge` shows the "Stuck? Tap me" bubble.
 */
export function BirdMascot({
  level,
  onPress,
  nudge = false,
}: {
  level: number;
  onPress: () => void;
  nudge?: boolean;
}) {
  const hidden = useSyncExternalStore(subscribeBirdHidden, isBirdHidden, () => false);
  const reduced = useSyncExternalStore(subscribeReduced, isReduced, () => false);
  const beak = reduced ? 0 : clamp((level - BEAK_FLOOR) * BEAK_GAIN, 0, 1);
  return (
    <div className="absolute top-0 right-0 z-10 flex items-center gap-2 select-none">
      {nudge && (
        <span
          id="bird-nudge"
          className="relative rounded-xl border-2 border-accent-edge bg-surface px-3 py-1.5 text-[15px] leading-tight font-bold text-foreground motion-safe:animate-spring-in"
        >
          {hidden ? 'Stuck? Tap Help' : 'Stuck? Tap me'}
          <span
            aria-hidden="true"
            className="absolute top-1/2 -right-[7px] h-3 w-3 -translate-y-1/2 rotate-45 border-t-2 border-r-2 border-accent-edge bg-surface"
          />
        </span>
      )}
      <button
        type="button"
        onClick={onPress}
        aria-label={hidden ? 'Get help' : 'Ask the bird for help'}
        aria-describedby={nudge ? 'bird-nudge' : undefined}
        className={
          hidden
            ? 'flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-line bg-surface px-3 text-base font-bold text-accent-edge'
            : 'flex items-center justify-center rounded-xl'
        }
        style={hidden ? undefined : { width: BIRD_SIZE_PX, height: BIRD_SIZE_PX }}
      >
        {hidden ? 'Help' : <BirdArt facing="left" beak={beak} blink={!reduced} className="h-full w-full" />}
      </button>
    </div>
  );
}
