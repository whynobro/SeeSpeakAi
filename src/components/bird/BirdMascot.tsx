'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { BirdArt, type BirdFacing, EYE_REACH } from './BirdArt';
import { getBirdLevel, isBirdHidden, subscribeBirdHidden } from './birdSignal';

/*
 * The bird that lives on the site. Mounted once in the layout, next to the tab bar.
 *
 * - On load it flies one loop, then lands in the bottom right corner, standing on the tab bar, and stays
 *   there. It does not follow the mouse or a tap (followPointer and followTouch below): that got in the way
 *   while using the site. Its eyes still look toward the pointer.
 * - On /practice it sits still at the top right and its beak opens with the mic level. Loudness only:
 *   the bird is never a verdict and never reacts to a hit or a miss.
 * - Reduced motion: no flight, no following, no beak. It sits still in its corner.
 * - It never takes a click (pointer-events: none) and screen readers skip it (aria-hidden).
 *
 * Everything moves with requestAnimationFrame and CSS transforms. React renders again only when the bird
 * turns around or starts and stops flapping.
 */

/** Every number worth tuning, in one place. Sizes in px, times in ms, angles in degrees. */
export const BIRD_TUNING = {
  /** Width and height of the bird's box. The drawn bird is a little smaller. */
  sizePx: 56,
  /** The bird is drawn at this scale on the practice screen, so it stays out of the way. */
  practiceScale: 0.86,
  /** Gap between the bird and the side of the screen when it sits in a corner. */
  edgeGapPx: 12,
  /** Share of the box that is empty under the bird's belly. Lets it stand right on the tab bar's top edge. */
  footGap: 0.145,

  /** The loop on load: how long it takes, and when the path starts bending toward the landing spot (0 to 1). */
  flightMs: 2000,
  flightBlendFrom: 0.66,
  /** The loop is never wider or taller than this, so it is not a race on a big monitor. */
  flightMaxRadiusX: 340,
  flightMaxRadiusY: 240,
  /** Where on the loop the bird starts, in turns of a circle. 0.125 is the lower right. */
  flightStartTurn: 0.125,
  fadeInMs: 280,

  /** Off: after the loop on load, the bird stays in its corner instead of following the mouse or a tap. */
  followPointer: false,
  followTouch: false,
  /** Lag behind the pointer. Bigger is lazier. */
  followLagMs: 150,
  /** Top speed, px per second, so a jump across the screen is a glide and not a teleport. */
  maxSpeedPxPerSec: 1500,
  /** Where it sits next to the pointer: this far to the side of it and this far above it. */
  cursorSidePx: 46,
  cursorUpPx: 24,
  /** Farther than this from its spot, it flaps. Closer than landNearPx, it has landed and hops. */
  flapFarPx: 48,
  landNearPx: 3,
  hopMs: 420,
  hopHeightPx: 9,

  /** Head tilt: at rest (negative looks up a little), how far it leans to look at the pointer, and in flight. */
  restTiltDeg: -4,
  lookTiltDeg: 6,
  flightTiltMaxDeg: 14,
  /** A slow, small sway while perched. */
  swayDeg: 1.5,
  swayPeriodMs: 3400,
  tiltLagMs: 120,
  eyeLagMs: 90,

  /** Beak on practice: mic level under the floor is ignored, the rest is multiplied by the gain. */
  beakFloor: 0.05,
  beakGain: 1.8,
  /** How fast the beak opens and shuts. */
  beakOpenMs: 35,
  beakShutMs: 110,

  /** After a tap on an empty spot (touch), the bird sits there this long, this far above the finger. */
  touchStayMs: 6000,
  touchLiftPx: 44,

  /** Practice perch: distance from the top to the bird's middle. The wide value is for a full-width laptop view. */
  practiceTopPx: 30,
  practiceTopWidePx: 104,
  wideMinPx: 768,
  /** How often it looks up the phone frame, the tab bar and the motion setting again. */
  remeasureMs: 400,
} as const;

/** A tap on one of these is a press, not a call for the bird, so the bird never lands on a control. */
const CONTROLS = 'a, button, input, select, textarea, label, summary, [role="button"], [role="switch"]';

/** The loop on load plays once per page load, even if the bird is switched off and on again. */
let hasFlown = false;

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const smooth = (t: number) => {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
};
/** How much of the gap to close this frame, for a lag given in ms. */
const ease = (dtMs: number, lagMs: number) => 1 - Math.exp(-dtMs / lagMs);

const noSubscribe = () => () => {};

export function BirdMascot() {
  const path = usePathname() ?? '/';
  // False on the server and during hydration, true after: nothing is rendered until the page is live.
  const mounted = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  const hidden = useSyncExternalStore(subscribeBirdHidden, isBirdHidden, () => false);
  const [facing, setFacing] = useState<BirdFacing>('left');
  const [flap, setFlap] = useState(false);
  const [calm, setCalm] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef(path);
  useEffect(() => {
    pathRef.current = path;
  }, [path]);

  // Not on the /lab tuning pages, the same rule as the tab bar.
  const show = mounted && !hidden && !path.startsWith('/lab');

  useEffect(() => {
    if (!show) return;
    const root = rootRef.current;
    const tiltEl = tiltRef.current;
    if (!root || !tiltEl) return;

    const T = BIRD_TUNING;
    const half = T.sizePx / 2;

    // The last known mouse position, and the last touched empty spot. Both in window coordinates.
    const mouse = { x: 0, y: 0, seen: false };
    let touchSpot: { x: number; y: number; until: number } | null = null;

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      mouse.seen = true;
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return;
      mouse.seen = false;
      const onControl = event.target instanceof Element && event.target.closest(CONTROLS) !== null;
      touchSpot = onControl
        ? null
        : { x: event.clientX, y: event.clientY, until: performance.now() + T.touchStayMs };
    };
    const onMouseLeave = () => {
      mouse.seen = false;
    };
    // The page moved under the bird: go back to the corner so it does not end up on top of something.
    const onScroll = () => {
      touchSpot = null;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    document.documentElement.addEventListener('mouseleave', onMouseLeave);

    // Things that are slow to look up are checked a few times a second, not every frame.
    let measuredAt = -Infinity;
    let frameEl: HTMLElement | null = null;
    let navEl: Element | null = null;
    let mainEl: Element | null = null;
    let reduced = false;
    let finePointer = false;
    const measure = (now: number) => {
      measuredAt = now;
      reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      finePointer = window.matchMedia('(pointer: fine)').matches;
      // On a laptop the app sits in a phone frame. The frame has a CSS transform, which makes it the box that
      // "fixed" children are placed in (the tab bar relies on the same thing). Find it, so the bird stays inside.
      frameEl = null;
      for (let el = root.parentElement; el && el !== document.body; el = el.parentElement) {
        if (window.getComputedStyle(el).transform !== 'none') {
          frameEl = el;
          break;
        }
      }
      navEl = document.querySelector('nav[aria-label="Main"]');
      mainEl = document.querySelector('main');
    };

    let raf = 0;
    let last = 0;
    let placed = false;
    let flying = false; // the loop on load
    let flightStart = 0;
    let airborne = false; // far from its spot, wings beating
    let hopStart = -Infinity;
    const pos = { x: 0, y: 0 };
    let scale = 1;
    let tilt: number = T.restTiltDeg;
    let eyeX = 0;
    let eyeY = 0;
    let beak = 0;
    let facingNow: BirdFacing = 'left';
    let flapNow = false;
    let calmNow = false;
    let lastTransform = '';
    let lastTilt = '';

    const frame = (now: number) => {
      raf = window.requestAnimationFrame(frame);
      const dt = last ? Math.min(50, now - last) : 16;
      last = now;
      if (now - measuredAt > T.remeasureMs) measure(now);
      if (reduced !== calmNow) {
        calmNow = reduced;
        setCalm(reduced);
      }

      // The box the bird lives in: the phone frame if there is one, else the window.
      let left = 0;
      let top = 0;
      let width = document.documentElement.clientWidth;
      let height = window.innerHeight;
      let scrollX = 0;
      let scrollY = 0;
      if (frameEl) {
        const rect = frameEl.getBoundingClientRect();
        left = rect.left + frameEl.clientLeft;
        top = rect.top + frameEl.clientTop;
        width = frameEl.clientWidth;
        height = frameEl.clientHeight;
        // Inside the frame a "fixed" element scrolls with the page, so add the scroll back to hold still.
        scrollX = frameEl.scrollLeft;
        scrollY = frameEl.scrollTop;
      }

      // The floor is the top edge of the tab bar when it is on screen, else the bottom of the box.
      let floor = height;
      if (navEl) {
        const navTop = navEl.getBoundingClientRect().top - top;
        if (navTop > height * 0.5 && navTop <= height) floor = navTop;
      }

      const minX = half + 2;
      const maxX = Math.max(minX, width - half - 2);
      const minY = half + 2;
      const maxY = Math.max(minY, floor - half + T.sizePx * T.footGap);

      const onPractice = pathRef.current.startsWith('/practice');
      const mouseX = mouse.x - left;
      const mouseY = mouse.y - top;
      const mouseLive = !reduced && finePointer && mouse.seen;
      const mouseInside =
        T.followPointer && mouseLive && mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;

      // Pick the spot to sit on.
      let spot: 'home' | 'practice' | 'cursor' | 'touch' = 'home';
      let targetX = width - T.edgeGapPx - half;
      let targetY = maxY;
      if (onPractice) {
        spot = 'practice';
        const mainRight = mainEl ? mainEl.getBoundingClientRect().right - left : width;
        targetX = Math.min(width, mainRight > 0 ? mainRight : width) - T.edgeGapPx - half;
        targetY = frameEl || width < T.wideMinPx ? T.practiceTopPx : T.practiceTopWidePx;
      } else if (mouseInside) {
        spot = 'cursor';
        // Beside the pointer and above it, never under it. Swap sides when there is no room on the right.
        const side = mouseX + T.cursorSidePx + half + 2 > width ? -1 : 1;
        targetX = mouseX + side * T.cursorSidePx;
        targetY = mouseY - T.cursorUpPx;
      } else if (T.followTouch && !reduced && touchSpot && now < touchSpot.until) {
        spot = 'touch';
        targetX = touchSpot.x - left;
        targetY = touchSpot.y - top - T.touchLiftPx;
      }
      targetX = clamp(targetX, minX, maxX);
      targetY = clamp(targetY, minY, maxY);

      const prevX = pos.x;
      const prevY = pos.y;

      if (!placed) {
        placed = true;
        // No loop on the practice screen: it would cross the word and the meter.
        // No loop on home either: the kingfisher flies in there, and two birds at once is too much.
        const onHome = pathRef.current === '/';
        if (onHome) hasFlown = true;
        if (!reduced && !onPractice && !onHome && !hasFlown) {
          hasFlown = true;
          flying = true;
          flightStart = now;
        }
        pos.x = targetX;
        pos.y = targetY;
      }

      let opacity = 1;
      if (flying) {
        const u = clamp((now - flightStart) / T.flightMs, 0, 1);
        const radiusX = Math.max(0, Math.min(width / 2 - T.sizePx, T.flightMaxRadiusX));
        const radiusY = Math.max(0, Math.min(floor / 2 - T.sizePx, T.flightMaxRadiusY));
        // Along the bottom, up the left side, over the top and down the right side.
        const angle = (T.flightStartTurn + smooth(u)) * Math.PI * 2;
        const loopX = width / 2 + radiusX * Math.cos(angle);
        const loopY = floor * 0.46 + radiusY * Math.sin(angle);
        // Near the end the path bends toward the landing spot, so there is no sudden turn.
        const blend = smooth((u - T.flightBlendFrom) / (1 - T.flightBlendFrom));
        pos.x = clamp(loopX + (targetX - loopX) * blend, minX, maxX);
        pos.y = clamp(loopY + (targetY - loopY) * blend, minY, maxY);
        opacity = clamp((now - flightStart) / T.fadeInMs, 0, 1);
        if (u >= 1) {
          flying = false;
          airborne = false;
          hopStart = now;
        }
      } else {
        const dx = targetX - pos.x;
        const dy = targetY - pos.y;
        const distance = Math.hypot(dx, dy);
        if (reduced) {
          pos.x = targetX;
          pos.y = targetY;
          airborne = false;
        } else {
          let stepX = dx * ease(dt, T.followLagMs);
          let stepY = dy * ease(dt, T.followLagMs);
          const step = Math.hypot(stepX, stepY);
          const cap = (T.maxSpeedPxPerSec * dt) / 1000;
          if (step > cap) {
            stepX *= cap / step;
            stepY *= cap / step;
          }
          pos.x += stepX;
          pos.y += stepY;
          if (distance > T.flapFarPx) airborne = true;
          else if (airborne && distance < T.landNearPx) {
            airborne = false;
            hopStart = now; // a small hop on landing
          }
        }
      }

      const inAir = flying || airborne;
      const speedX = ((pos.x - prevX) / dt) * 1000;
      const speedY = ((pos.y - prevY) / dt) * 1000;

      // Which way it faces: where it is going while flying, toward the pointer when perched beside it,
      // and into the screen when it sits at the right edge.
      let wantFacing = facingNow;
      if (inAir) {
        if (Math.abs(speedX) > 60) wantFacing = speedX > 0 ? 'right' : 'left';
      } else if (spot === 'cursor') {
        if (Math.abs(mouseX - pos.x) > 8) wantFacing = mouseX > pos.x ? 'right' : 'left';
      } else if (spot !== 'touch') {
        wantFacing = 'left';
      }
      if (wantFacing !== facingNow) {
        facingNow = wantFacing;
        setFacing(wantFacing);
      }
      if (inAir !== flapNow) {
        flapNow = inAir;
        setFlap(inAir);
      }

      // Head tilt. Positive means beak down.
      let wantTilt: number = T.restTiltDeg;
      if (inAir) {
        wantTilt = clamp(speedY * 0.02, -T.flightTiltMaxDeg, T.flightTiltMaxDeg);
      } else if (!reduced && spot !== 'practice') {
        wantTilt += Math.sin((now / T.swayPeriodMs) * Math.PI * 2) * T.swayDeg;
        if (mouseLive) wantTilt += clamp((mouseY - pos.y) / 120, -1, 1) * T.lookTiltDeg;
      }
      tilt = reduced ? wantTilt : tilt + (wantTilt - tilt) * ease(dt, T.tiltLagMs);

      // Eyes look at the pointer, wherever it is in the window.
      let wantEyeX = 0;
      let wantEyeY = 0;
      if (mouseLive) {
        const gapX = mouseX - pos.x;
        const gapY = mouseY - pos.y;
        const gap = Math.hypot(gapX, gapY);
        if (gap > 1) {
          const reach = Math.min(1, gap / 40) * EYE_REACH;
          // The drawing is mirrored when it faces left, so flip x to match.
          wantEyeX = (gapX / gap) * reach * (facingNow === 'left' ? -1 : 1);
          wantEyeY = (gapY / gap) * reach;
        }
      }
      eyeX += (wantEyeX - eyeX) * ease(dt, T.eyeLagMs);
      eyeY += (wantEyeY - eyeY) * ease(dt, T.eyeLagMs);

      // Beak: mic loudness on the practice screen, nothing else. Quick to open, a little slower to shut.
      const loud = onPractice && !reduced ? getBirdLevel() : 0;
      const wantBeak = clamp((loud - T.beakFloor) * T.beakGain, 0, 1);
      beak += (wantBeak - beak) * ease(dt, wantBeak > beak ? T.beakOpenMs : T.beakShutMs);

      const wantScale = onPractice ? T.practiceScale : 1;
      scale = reduced ? wantScale : scale + (wantScale - scale) * ease(dt, T.followLagMs);

      // Two small bounces that die out.
      let hop = 0;
      const hopT = (now - hopStart) / T.hopMs;
      if (!reduced && hopT >= 0 && hopT < 1) {
        hop = -T.hopHeightPx * Math.abs(Math.sin(hopT * Math.PI * 2)) * (1 - hopT);
      }

      const x = pos.x - half + scrollX;
      const y = pos.y - half + scrollY + hop;
      const transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      if (transform !== lastTransform) {
        lastTransform = transform;
        root.style.transform = transform;
      }
      // The tilt wraps the mirrored drawing, so the turn is flipped for a bird that faces left.
      const turn = `rotate(${(tilt * (facingNow === 'left' ? -1 : 1)).toFixed(2)}deg)`;
      if (turn !== lastTilt) {
        lastTilt = turn;
        tiltEl.style.transform = turn;
      }
      root.style.opacity = opacity.toFixed(2);
      root.style.setProperty('--bird-beak', beak.toFixed(3));
      root.style.setProperty('--bird-eye-x', eyeX.toFixed(2));
      root.style.setProperty('--bird-eye-y', eyeY.toFixed(2));
    };
    raf = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('scroll', onScroll, { capture: true });
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [show]);

  if (!show) return null;
  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-30 select-none"
      // Invisible until the first frame has put it in place.
      style={{ width: BIRD_TUNING.sizePx, height: BIRD_TUNING.sizePx, opacity: 0, willChange: 'transform' }}
    >
      <div ref={tiltRef} className="h-full w-full">
        <BirdArt facing={facing} flap={flap} blink={!calm} className="h-full w-full" />
      </div>
    </div>
  );
}
