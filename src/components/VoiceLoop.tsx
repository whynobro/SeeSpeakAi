'use client';

import { useEffect, useRef } from 'react';
import { VOICE_LOOP } from '@/content/voiceLoop';

/*
 * "The voice that comes back different" (docs/lanes/screens.md).
 * A bird sings "sip". The wave leaves the beak, loops around and comes back to the bird's own ear.
 * On the way back the high, fast "s" hiss flattens and a lower, slower "sh" hiss takes its place, so "ship" arrives.
 *
 * How it is built: the finished picture (both waves, both labels) is the plain markup. The animation only
 * hides parts of it and brings them back in order, so with reduced motion, or with no CSS animation at all,
 * the still picture is what shows. Only transform, opacity and stroke-dashoffset are animated.
 *
 * Everything worth tuning is in the constants below.
 */

/* ---------- Timing, in seconds from the start of one loop. Each pair is [start, end]. ---------- */
const TIMING = {
  /** Length of one whole loop, pause included. The story ends at fadeOut[0]. */
  total: 7.2,
  /** The big, slow wave for the rest of the word ("ip") draws out of the beak. */
  sayCat: [0.3, 1.5],
  /** The tight "s" hiss draws right after it. */
  sayS: [1.5, 2.1],
  /** The line turns around on the right. */
  bend: [2.1, 3.0],
  /** The returning wave slides in toward the ear. */
  back: [3.0, 4.5],
  /** The "s" on the returning wave flattens and the "sh" grows in its place. Keep inside `back`. */
  sFade: [3.5, 4.5],
  /** The last stretch of line draws down into the ear. */
  arrive: [4.5, 5.1],
  /** One ring pulses at the ear. */
  earPulse: [5.0, 5.8],
  /** Everything animated fades away. What is left of `total` after this is the pause. */
  fadeOut: [6.0, 6.4],
} as const;

/** How far to the right the returning wave starts its slide, in picture units. */
const BACK_SLIDE = 26;
/** How flat the returning "s" gets (1 is full height, 0 is a straight line). */
const S_FLAT_SCALE = 0.06;

/* ---------- Layout, in picture units. The picture is VIEW_W wide and VIEW_H tall and scales to fit. ---------- */
const VIEW_W = 360;
const VIEW_H = 146;

/** Where the bird sits (top left corner of its own 90 x 66 drawing). */
const BIRD = { x: 6, y: 70 };
/** Height of the lane the wave leaves on (level with the beak) and the lane it comes back on. */
const OUT_Y = BIRD.y + 26;
const BACK_Y = 38;
/** Left to right, both lanes: line starts, word wave, small gap, "s" hiss (the first sound, so the farthest out), line ends. */
const X = { start: 97, catFrom: 102, catTo: 222, sFrom: 229, sTo: 285 };

/** The word wave: big, slow, low. Height and length of one wiggle, going out and coming back. */
const CAT_WAVE = { outHeight: 14, backHeight: 12, wiggle: 30 };
/** The "s" hiss: small, fast, tight. */
const S_WAVE = { height: 5, wiggle: 5.5 };
/** The "sh" it turns into: lower pitch, so wider wiggles, a little taller. */
const SH_WAVE = { height: 6.5, wiggle: 11 };

/** The turn on the right. Lopsided on purpose so it reads as drawn by hand. */
const BEND_PATH = `M ${X.sTo} ${OUT_Y} C 316 ${OUT_Y + 3}, 348 ${OUT_Y - 5}, 345 66 C 343 45, 321 ${BACK_Y - 4}, ${X.sTo} ${BACK_Y}`;
/** A small arrowhead on the turn, so the direction shows without motion. */
const BEND_ARROW = 'M 339.5 71.5 L 345.2 63.5 L 351 70.5';
/** The ear, in picture units, and the last stretch of line that lands on it. */
const EAR = { x: BIRD.x + 44, y: BIRD.y + 22, r: 4.5 };
const ARRIVE_PATH = `M ${X.start + 3} ${BACK_Y} C 78 ${BACK_Y - 1}, 57 44, 51 63 C 48.5 71, 49 79, ${EAR.x} ${EAR.y - EAR.r}`;
/** A pale strip under the end of that line, only where it crosses the bird's head, so it stays readable. */
const ARRIVE_GAP_PATH = `M 49.4 ${BIRD.y + 7} L ${EAR.x} ${EAR.y - EAR.r}`;

/* ---------- Wave drawing ---------- */

type Shape = (u: number) => number;

/** A speech burst: swells, dips a little, tails off. Uneven on purpose. */
const catShape: Shape = (u) => Math.sin(Math.PI * u) ** 0.55 * (0.74 + 0.26 * Math.sin(u * 7.3 + 0.6));
/** A hiss: comes on fast, stays about level, with a slight tremble. */
const hissShape: Shape = (u) => Math.sin(Math.PI * u) ** 0.35 * (0.82 + 0.18 * Math.sin(u * 19));

/** A wiggly line from x0 to x1 around the height y. `shape` sets how tall the wiggle is along the way. */
function wave(x0: number, x1: number, y: number, height: number, wiggle: number, shape: Shape, step: number) {
  const points: string[] = [];
  const length = x1 - x0;
  const count = Math.round(length / step);
  for (let i = 0; i <= count; i++) {
    const u = i / count;
    const d = u * length;
    // The wiggles get a touch tighter toward the end, like a hand speeding up.
    const turns = (d / wiggle) * (1 + 0.1 * u);
    // Math.max guards the tiny negative that sin(pi) gives at the very end.
    const dy = -height * shape(Math.min(Math.max(u, 0), 0.999999)) * Math.sin(2 * Math.PI * turns);
    points.push(`${(x0 + d).toFixed(1)} ${(y + dy).toFixed(1)}`);
  }
  return points.join(' L ');
}

const catWave = (y: number, height: number) =>
  wave(X.catFrom, X.catTo, y, height, CAT_WAVE.wiggle, catShape, 1.5);
/** The hiss is drawn around height 0 and moved into place, so it can flatten onto its own middle line. */
const HISS_LENGTH = X.sTo - X.sFrom;
const HISS = `M 0 0 L ${wave(3, HISS_LENGTH - 3, 0, S_WAVE.height, S_WAVE.wiggle, hissShape, 0.7)} L ${HISS_LENGTH} 0`;
const SH_HISS = `M 0 0 L ${wave(3, HISS_LENGTH - 3, 0, SH_WAVE.height, SH_WAVE.wiggle, hissShape, 0.7)} L ${HISS_LENGTH} 0`;

const OUT_CAT_PATH = `M ${X.start} ${OUT_Y} L ${catWave(OUT_Y, CAT_WAVE.outHeight)} L ${X.sFrom} ${OUT_Y}`;
const BACK_CAT_PATH = `M ${X.start + 3} ${BACK_Y} L ${catWave(BACK_Y, CAT_WAVE.backHeight)} L ${X.sFrom} ${BACK_Y}`;

/* ---------- The animation, written from the timings above ---------- */

const pct = (seconds: number) => `${((seconds / TIMING.total) * 100).toFixed(2)}%`;
const FADE_FROM = pct(TIMING.fadeOut[0]);
const FADE_TO = pct(TIMING.fadeOut[1]);

/** Draw a line on from its start, hold it, then fade it with everything else. */
function drawOn(name: string, [from, to]: readonly [number, number]) {
  return `@keyframes ${name} {
    0%, ${pct(from)} { stroke-dashoffset: 1; opacity: 0; }
    ${pct(from + 0.03)} { stroke-dashoffset: 1; opacity: 1; }
    ${pct(to)}, ${FADE_FROM} { stroke-dashoffset: 0; opacity: 1; }
    ${FADE_TO}, 100% { stroke-dashoffset: 0; opacity: 0; }
  }`;
}

const BACK_LENGTH = TIMING.back[1] - TIMING.back[0];
const BEND_MIDDLE = (TIMING.bend[0] + TIMING.bend[1]) / 2;

const CSS = `
.vl-s-back, .vl-ear-ring { opacity: 0; }
@media (prefers-reduced-motion: no-preference) {
  .vl-anim { animation-duration: ${TIMING.total}s; animation-timing-function: linear; animation-iteration-count: infinite; animation-fill-mode: both; }
  .vl[data-paused] .vl-anim { animation-play-state: paused; }
  .vl-draw { stroke-dasharray: 1 1; }
  .vl-say-cat { animation-name: vl-say-cat; }
  .vl-say-s { animation-name: vl-say-s; }
  .vl-bend { animation-name: vl-bend; }
  .vl-bend-arrow { animation-name: vl-bend-arrow; }
  .vl-back { animation-name: vl-back; }
  .vl-s-back { animation-name: vl-s-back; }
  .vl-s-flat { animation-name: vl-s-flat; }
  .vl-arrive { animation-name: vl-arrive; }
  .vl-arrive-gap { animation-name: vl-arrive-gap; }
  .vl-ear-ring { animation-name: vl-ear-ring; }
  ${drawOn('vl-say-cat', TIMING.sayCat)}
  ${drawOn('vl-say-s', TIMING.sayS)}
  ${drawOn('vl-bend', TIMING.bend)}
  ${drawOn('vl-arrive', TIMING.arrive)}
  ${drawOn('vl-arrive-gap', [TIMING.arrive[0] + (TIMING.arrive[1] - TIMING.arrive[0]) * 0.7, TIMING.arrive[1]])}
  @keyframes vl-bend-arrow {
    0%, ${pct(BEND_MIDDLE)} { opacity: 0; }
    ${pct(BEND_MIDDLE + 0.2)}, ${FADE_FROM} { opacity: 1; }
    ${FADE_TO}, 100% { opacity: 0; }
  }
  @keyframes vl-back {
    0%, ${pct(TIMING.back[0])} { opacity: 0; transform: translateX(${BACK_SLIDE}px); animation-timing-function: cubic-bezier(0.3, 0.6, 0.3, 1); }
    ${pct(TIMING.back[0] + BACK_LENGTH * 0.3)} { opacity: 1; }
    ${pct(TIMING.back[1])}, ${FADE_FROM} { opacity: 1; transform: translateX(0px); }
    ${FADE_TO}, 100% { opacity: 0; transform: translateX(0px); }
  }
  @keyframes vl-s-back {
    0%, ${pct(TIMING.sFade[0])} { opacity: 1; transform: scaleY(1); }
    ${pct(TIMING.sFade[1])}, 100% { opacity: 0; transform: scaleY(${S_FLAT_SCALE}); }
  }
  @keyframes vl-s-flat {
    0%, ${pct((TIMING.sFade[0] + TIMING.sFade[1]) / 2)} { opacity: 0; transform: scaleY(0.2); }
    ${pct(TIMING.sFade[1])}, 100% { opacity: 1; transform: scaleY(1); }
  }
  @keyframes vl-ear-ring {
    0%, ${pct(TIMING.earPulse[0])} { opacity: 0; transform: scale(0.8); }
    ${pct(TIMING.earPulse[0] + 0.05)} { opacity: 0.9; transform: scale(0.8); }
    ${pct(TIMING.earPulse[1])}, 100% { opacity: 0; transform: scale(2.6); }
  }
}
`;

/* ---------- The bird ---------- */

/**
 * The singer: a flat blue bird seen from the side, facing right, in the style of the logo.
 * Kept on its own so the full mascot can replace it. Whatever replaces it needs its mouth near
 * (91, 26) and its ear at (44, 22) in this drawing's own units, or BIRD, OUT_Y and EAR above need to move.
 */
function SingerBird({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* Body and head in one shape, tail to the left. */}
      <path
        className="fill-accent"
        d="M 3 43 C 12 44, 20 40, 27 30 C 32 14, 42 5, 53 5 C 65 5, 74 15, 74 28 C 74 48, 64 64, 44 65 C 28 66, 12 60, 3 49 C 1 46, 1 44, 3 43 Z"
      />
      {/* Wing: the pale crescent from the logo. */}
      <path
        className="fill-background"
        d="M 21 50 C 33 50, 46 44, 52 33 C 55 46, 47 57, 34 57 C 28 57, 23 54, 21 50 Z"
      />
      {/* Beak: one piece, pointing at where the sound leaves. */}
      <path
        className="fill-violet stroke-violet"
        strokeWidth={2}
        strokeLinejoin="round"
        d="M 71 19.5 C 78 21, 85 23.5, 91 26.5 C 85 29.5, 78 32, 71 33.5 C 72.5 29, 72.5 24, 71 19.5 Z"
      />
      {/* Eye. */}
      <circle className="fill-foreground" cx={60} cy={19} r={3.3} />
      <circle className="fill-surface" cx={61.1} cy={17.9} r={1} />
      {/* Ear spot: a pale ring on the side of the head, where the wave lands. */}
      <circle className="fill-background stroke-accent-edge" strokeWidth={1.75} cx={44} cy={22} r={4.5} />
    </g>
  );
}

/* ---------- The picture ---------- */

export function VoiceLoop() {
  const ref = useRef<HTMLElement>(null);

  // Stop the animation while the picture is off screen.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const watcher = new IntersectionObserver(([entry]) => {
      el.toggleAttribute('data-paused', !entry.isIntersecting);
    });
    watcher.observe(el);
    return () => watcher.disconnect();
  }, []);

  const sMiddle = (X.sFrom + X.sTo) / 2;
  const line = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

  return (
    <figure ref={ref} className="vl mx-auto flex w-full max-w-[290px] flex-col gap-1">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label={VOICE_LOOP.alt}
        className="block h-auto w-full overflow-visible"
        style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
      >
        <SingerBird x={BIRD.x} y={BIRD.y} />

        {/* Going out: the full word. "ip" is the big slow wave, "s" is the thin tight hiss. */}
        <path
          className="vl-anim vl-draw vl-say-cat stroke-accent"
          strokeWidth={3.75}
          pathLength={1}
          d={OUT_CAT_PATH}
          {...line}
        />
        <g transform={`translate(${X.sFrom} ${OUT_Y})`}>
          <path
            className="vl-anim vl-draw vl-say-s stroke-foreground"
            strokeWidth={1.9}
            pathLength={1}
            d={HISS}
            {...line}
          />
        </g>
        {/* A tag under the hiss, so it is never told apart by color alone. */}
        <g transform={`translate(${sMiddle} ${OUT_Y + 19})`}>
          <circle className="fill-violet" r={8.5} />
          <text className="fill-violet-ink" textAnchor="middle" dy="0.32em" fontSize={12.5} fontWeight={800}>
            {VOICE_LOOP.sound}
          </text>
        </g>

        {/* The turn. */}
        <path
          className="vl-anim vl-draw vl-bend stroke-accent"
          strokeWidth={2.5}
          pathLength={1}
          d={BEND_PATH}
          {...line}
        />
        <path className="vl-anim vl-bend-arrow stroke-accent" strokeWidth={2.5} d={BEND_ARROW} {...line} />

        {/* Coming back: "ip" is still there. Where the "s" was, a lower, wider "sh" hiss. */}
        <g className="vl-anim vl-back">
          <path className="stroke-accent" strokeWidth={3.75} d={BACK_CAT_PATH} {...line} />
          <g transform={`translate(${X.sFrom} ${BACK_Y})`}>
            <path className="vl-anim vl-s-back stroke-foreground" strokeWidth={1.9} d={HISS} {...line} />
            <path className="vl-anim vl-s-flat stroke-foreground" strokeWidth={2.2} d={SH_HISS} {...line} />
          </g>
        </g>
        {/* A tag under it: the same sound, now "sh". A word, never color alone. */}
        <g transform={`translate(${sMiddle} ${BACK_Y + 20})`}>
          <circle className="fill-surface stroke-accent-edge" strokeWidth={1.5} r={10} />
          <text className="fill-foreground" textAnchor="middle" dy="0.32em" fontSize={11.5} fontWeight={800}>
            {VOICE_LOOP.heardSound}
          </text>
        </g>

        {/* Into the ear. The pale line under it keeps it readable where it crosses the bird's head. */}
        <path
          className="vl-anim vl-draw vl-arrive-gap stroke-background"
          strokeWidth={6.5}
          pathLength={1}
          d={ARRIVE_GAP_PATH}
          {...line}
        />
        <path
          className="vl-anim vl-draw vl-arrive stroke-accent-edge"
          strokeWidth={2.75}
          pathLength={1}
          d={ARRIVE_PATH}
          {...line}
        />
        <g transform={`translate(${EAR.x} ${EAR.y})`}>
          <circle
            className="vl-anim vl-ear-ring stroke-accent-edge"
            fill="none"
            strokeWidth={1.5}
            r={EAR.r + 1.5}
          />
        </g>

        {/* The words, on screen the whole time. */}
        <text className="fill-muted" x={X.start + 3} y={15} fontSize={17} fontWeight={600}>
          {VOICE_LOOP.hearLabel}{' '}
          <tspan className="fill-foreground underline" fontWeight={800}>
            {VOICE_LOOP.heardSound}
          </tspan>
          <tspan className="fill-foreground" fontWeight={800}>
            {VOICE_LOOP.rest}
          </tspan>
        </text>
        <text className="fill-muted" x={X.start + 3} y={VIEW_H - 5} fontSize={17} fontWeight={600}>
          {VOICE_LOOP.sayLabel}{' '}
          <tspan className="fill-foreground underline" fontWeight={800}>
            {VOICE_LOOP.sound}
          </tspan>
          <tspan className="fill-foreground" fontWeight={800}>
            {VOICE_LOOP.rest}
          </tspan>
        </text>
      </svg>
      <figcaption className="text-center text-[13px] leading-snug text-muted">
        {VOICE_LOOP.caption}
      </figcaption>
    </figure>
  );
}
