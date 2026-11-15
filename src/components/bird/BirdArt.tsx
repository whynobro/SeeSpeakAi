'use client';

import { type CSSProperties, useEffect, useRef } from 'react';

/*
 * The SeeSpeak bird, drawn flat to match the logo: one round teal body with a tail, a white wing,
 * a navy eye and a yellow beak in two parts so it can open. The art faces right.
 *
 * The beak and the eye read CSS variables, so a parent can move them every frame without a React render:
 *   --bird-beak    0 (shut) to 1 (wide open)
 *   --bird-eye-x   eye shift in drawing units, positive is toward the beak
 *   --bird-eye-y   eye shift in drawing units, positive is down
 * Passing the `beak` or `eye` prop sets the same variables on this drawing.
 */

/** How far each half of the beak swings when fully open, in degrees. */
const BEAK_UP_DEG = 17;
const BEAK_DOWN_DEG = 21;
/** One wing beat (up or down), in ms. */
const WING_BEAT_MS = 130;
/** The eye closes for this long, and waits a random time between the two values below. All in ms. */
const BLINK_MS = 170;
const BLINK_GAP_MIN_MS = 2600;
const BLINK_GAP_MAX_MS = 6500;

/** The point where the two halves of the beak meet the head, and where the wing joins the body, in drawing units. */
const BEAK_HINGE = '59.5px 16px';
const WING_SHOULDER = '46px 30px';

/** The eye moves at most this far from its middle, in drawing units. */
export const EYE_REACH = 1.3;

export type BirdFacing = 'left' | 'right';

type Props = {
  /** How open the beak is, 0 to 1. Leave out to let a parent set --bird-beak. */
  beak?: number;
  /** Which way the bird looks. The art is mirrored for "left". */
  facing?: BirdFacing;
  /** Where the eye looks, as seen on screen: x and y each from -1 to 1. Leave out to let a parent set the variables. */
  eye?: { x: number; y: number };
  /** True while flying: the wing beats. */
  flap?: boolean;
  /** Blink now and then. Turn off for people who ask for reduced motion. */
  blink?: boolean;
  className?: string;
};

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

export function BirdArt({ beak, facing = 'right', eye, flap = false, blink = true, className }: Props) {
  const wingRef = useRef<SVGPathElement>(null);
  const lidRef = useRef<SVGGElement>(null);

  // Wing beats while flying. The Web Animations API keeps this off the React render path.
  useEffect(() => {
    const wing = wingRef.current;
    if (!flap || !wing || typeof wing.animate !== 'function') return;
    const beat = wing.animate([{ transform: 'rotate(-10deg)' }, { transform: 'rotate(52deg)' }], {
      duration: WING_BEAT_MS,
      direction: 'alternate',
      iterations: Infinity,
      easing: 'ease-in-out',
    });
    return () => beat.cancel();
  }, [flap]);

  // A blink now and then, at uneven gaps so it does not look like a timer.
  useEffect(() => {
    if (!blink) return;
    let timer = 0;
    const schedule = () => {
      const gap = BLINK_GAP_MIN_MS + Math.random() * (BLINK_GAP_MAX_MS - BLINK_GAP_MIN_MS);
      timer = window.setTimeout(() => {
        const lid = lidRef.current;
        if (lid && typeof lid.animate === 'function') {
          lid.animate(
            [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0.08)' }, { transform: 'scaleY(1)' }],
            { duration: BLINK_MS, easing: 'ease-in-out' },
          );
        }
        schedule();
      }, gap);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [blink]);

  const vars: Record<string, string | number> = {};
  if (beak !== undefined) vars['--bird-beak'] = clamp(beak, 0, 1);
  if (eye) {
    // The art is mirrored when it faces left, so flip x to keep "right on screen" meaning right.
    vars['--bird-eye-x'] = clamp(eye.x, -1, 1) * EYE_REACH * (facing === 'left' ? -1 : 1);
    vars['--bird-eye-y'] = clamp(eye.y, -1, 1) * EYE_REACH;
  }

  return (
    <svg
      viewBox="0 0 76 66"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={
        {
          ...vars,
          overflow: 'visible',
          pointerEvents: 'none',
          transform: facing === 'left' ? 'scaleX(-1)' : undefined,
        } as CSSProperties
      }
    >
      {/* Body, head and tail in one shape, like the logo. */}
      <path
        className="fill-accent"
        d="M49 6C58 6 64 12 63 20C67 27 67 38 63 46C58 56 50 60 42 60C28 60 14 54 6 42C3.5 38 6 35.5 10 36.5C15 37.5 18.4 36 22 33C27 28.8 30 26 31 20C32 11 40 6 49 6Z"
      />
      {/* Wing. The teal outline is hidden against the body and shows only when the wing lifts off it. */}
      <path
        ref={wingRef}
        className="fill-surface stroke-accent"
        strokeWidth="2"
        strokeLinejoin="round"
        style={{ transformOrigin: WING_SHOULDER }}
        d="M18.5 43C28 43 40 38 46 29C49 40 42 49 32 49C26 49 21 46.5 18.5 43Z"
      />
      {/* Beak: the top half swings up and the bottom half swings down from the same hinge. */}
      <path
        className="fill-violet stroke-violet"
        strokeWidth="1.5"
        strokeLinejoin="round"
        style={{
          transformOrigin: BEAK_HINGE,
          transform: `rotate(calc(var(--bird-beak, 0) * -${BEAK_UP_DEG}deg))`,
        }}
        d="M58 11C62.5 10.4 66 11.6 68.8 13.9L59.5 16Z"
      />
      <path
        className="fill-violet stroke-violet"
        strokeWidth="1.5"
        strokeLinejoin="round"
        style={{
          transformOrigin: BEAK_HINGE,
          transform: `rotate(calc(var(--bird-beak, 0) * ${BEAK_DOWN_DEG}deg))`,
        }}
        d="M59.5 16L68.4 14.3C66.5 17.2 63 19.2 58 19.3Z"
      />
      {/* Eye: the outer group looks around, the inner group blinks. */}
      <g
        style={{
          transform: 'translate(calc(var(--bird-eye-x, 0) * 1px), calc(var(--bird-eye-y, 0) * 1px))',
        }}
      >
        <g ref={lidRef} style={{ transformOrigin: '50px 15.5px' }}>
          <circle className="fill-foreground" cx="50" cy="15.5" r="3.5" />
          <circle className="fill-surface" cx="51.3" cy="14.2" r="1.15" />
        </g>
      </g>
    </svg>
  );
}
