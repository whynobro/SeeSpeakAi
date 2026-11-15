'use client';

import Link from 'next/link';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useTryItNow } from '@/components/HomeStart';
import { LockIcon } from '@/components/Icons';
import { COPY } from '@/content/copy';
import { HOME_HERO } from '@/content/home';
import { LANDING } from '@/content/landing';
import { THERAPIST } from '@/content/therapist';
import { TRY_IT } from '@/content/tryIt';
import { Wordmark } from './Wordmark';

/*
 * The home screen's kingfisher (redesign, Nov 14).
 *
 * - The video (public/home/kingfisher.mp4) was generated in Google Flow: one continuous shot of a kingfisher
 *   flying in and landing on a branch that crosses the whole frame. It plays once, as it is (no filter, so it
 *   stays sharp), then holds on the last frame.
 * - Instead of cutting the video's background out, the page takes the video's color: it reads the video's bottom
 *   rows and sets the home screen's background to match. The video's plain-sky top and bottom edges fade into it.
 * - The words and the two links fade in once the bird has landed. A leafy branch (public/home/branch.png, made in
 *   ChatGPT) crosses the open space above the checks.
 * - Never stuck: the words show anyway after a few seconds, if the video fails, and at once with reduced motion.
 *   After the first view in a tab, home opens with the bird already perched.
 */

const VIDEO = '/home/kingfisher.mp4';
/** Seconds into the clip when the bird has landed; the words fade in from here. */
const LANDED_AT = 3.3;
/** Where the bird perches, as a share of the video frame (measured on the clip). */
const FEET = { x: 0.5, y: 0.63 };
/** Wider than this (in px), the words sit beside the bird; narrower, under it. */
const WIDE = 1000;
const SEEN_KEY = 'seespeak:home-flyin-seen';

function seen(): boolean {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}
function markSeen(): void {
  try {
    window.sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Storage blocked: it plays again next time.
  }
}

/** Haptic click on Android (iPhones have no web vibration); the button's sinking edge is the visual twin. */
function buzz() {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(12);
}

export function KingfisherHome({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [landed, setLanded] = useState(false);
  const [wide, setWide] = useState(true);
  const goTry = useTryItNow();

  // The home screen takes the video's own color. Restored when leaving home.
  useEffect(() => {
    const root = document.documentElement;
    const before = {
      bg: root.style.getPropertyValue('--background'),
      muted: root.style.getPropertyValue('--muted'),
    };
    root.style.setProperty('--background', 'rgb(180, 196, 170)'); // measured on the clip; refined below
    root.style.setProperty('--muted', '#3f4b49'); // darker gray, so small text reads on the green
    return () => {
      root.style.setProperty('--background', before.bg);
      root.style.setProperty('--muted', before.muted);
      if (!before.bg) root.style.removeProperty('--background');
      if (!before.muted) root.style.removeProperty('--muted');
    };
  }, []);

  // Place the video: a little wider than the room, so its branch runs off both sides, the bird where the words
  // leave space. Re-done whenever the hero changes size.
  useEffect(() => {
    const hero = heroRef.current,
      v = videoRef.current;
    if (!hero || !v) return;
    const layout = () => {
      const vw = hero.clientWidth;
      const isWide = vw > WIDE;
      setWide(isWide);
      const W = (isWide ? 1.1 : 1.9) * vw,
        H = (W * 9) / 16;
      const bx = (isWide ? 0.54 : 0.5) * vw;
      let top: number;
      if (isWide) {
        top = hero.clientHeight - 230 - FEET.y * H; // the perch sits well above the tab bar
        hero.style.removeProperty('--stage-h');
      } else {
        top = 64 - 0.24 * H; // under the logo row; the plain sky above the bird runs off the top
        hero.style.setProperty('--stage-h', `${Math.round(top + 0.84 * H)}px`);
      }
      Object.assign(v.style, {
        width: `${W}px`,
        height: `${H}px`,
        left: `${bx - FEET.x * W}px`,
        top: `${top}px`,
      });
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(hero);
    return () => ro.disconnect();
  }, []);

  // Play once, reveal the words when the bird lands, hold the last frame. Match the page to the video's edge.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let done = false;
    const land = () => {
      if (done) return;
      done = true;
      markSeen();
      setLanded(true);
    };
    const matchPage = () => {
      try {
        const c = document.createElement('canvas');
        c.width = 64;
        c.height = 36;
        const x = c.getContext('2d', { willReadFrequently: true });
        if (!x || !v.videoWidth) return;
        x.drawImage(v, 0, 0, 64, 36);
        const d = x.getImageData(0, 31, 64, 4).data; // the bottom rows, where the video meets the page
        let r = 0,
          g = 0,
          b = 0;
        for (let i = 0; i < d.length; i += 4) {
          r += d[i];
          g += d[i + 1];
          b += d[i + 2];
        }
        const n = d.length / 4;
        document.documentElement.style.setProperty(
          '--background',
          `rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`,
        );
      } catch {
        // Keep the measured color.
      }
    };
    const toEnd = () => {
      if (v.duration && Number.isFinite(v.duration)) v.currentTime = Math.max(0, v.duration - 0.05);
    };
    const onTime = () => {
      if (v.currentTime >= LANDED_AT) land();
    };
    const onEnd = () => {
      matchPage();
      land();
    };
    const start = () => {
      matchPage();
      if (reduce || seen()) {
        toEnd();
        land();
        return;
      }
      v.play().catch(() => {
        toEnd();
        land();
      });
    };
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('ended', onEnd);
    v.addEventListener('seeked', matchPage);
    v.addEventListener('error', land);
    const timer = window.setTimeout(land, 6000);
    if (v.readyState >= 2) start();
    else v.addEventListener('loadeddata', start, { once: true });
    return () => {
      window.clearTimeout(timer);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('ended', onEnd);
      v.removeEventListener('seeked', matchPage);
      v.removeEventListener('error', land);
      v.removeEventListener('loadeddata', start);
    };
  }, []);

  const rise = () =>
    `transition-[opacity,translate,filter] duration-900 ease-[cubic-bezier(.2,.7,.1,1)] motion-reduce:transition-none ${
      landed ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-4 blur-[5px]'
    }`;
  const delay = (step: number) => ({ transitionDelay: landed ? `${step * 120}ms` : '0ms' });

  return (
    <div ref={rootRef} className="@container relative isolate flex flex-col [overflow-x:clip]">
      <header
        ref={heroRef}
        className={`relative ${wide ? 'h-[100svh] min-h-[620px]' : 'px-4 pb-6 pt-[var(--stage-h,330px)]'}`}
      >
        {/* The video, exactly as generated. Its top and bottom edges are plain sky, faded into the page. */}
        <video
          ref={videoRef}
          src={VIDEO}
          muted
          playsInline
          preload="auto"
          aria-label={HOME_HERO.birdAlt}
          className="pointer-events-none absolute z-[1] max-w-none [mask-image:linear-gradient(180deg,transparent_0,#000_9%,#000_84%,transparent_100%)]"
        />

        <div
          className={`absolute inset-x-0 top-0 z-[3] flex items-center justify-between gap-3 ${wide ? 'px-8 pt-5' : 'px-4 pt-3'}`}
        >
          <h1 className={wide ? 'w-[250px]' : 'w-[170px]'}>
            <span className="sr-only">SeeSpeak AI</span>
            <Wordmark />
          </h1>
          <p className="flex max-w-[160px] items-center gap-1.5 text-right text-[13px] leading-tight font-bold text-accent-edge @3xl:max-w-none">
            <LockIcon className="h-4 w-4 shrink-0" />
            {LANDING.privacyTitle}
          </p>
        </div>

        <div className={`z-[3] ${wide ? 'absolute top-[22%] left-8 max-w-[440px]' : 'relative'}`}>
          <p
            className={`text-[34px] leading-[1.04] font-extrabold tracking-tight text-balance @5xl:text-[54px] ${rise()}`}
            style={delay(0)}
          >
            {COPY.tagline}
          </p>
          <p className={`mt-3.5 text-[18px] leading-snug font-medium text-muted ${rise()}`} style={delay(1)}>
            {HOME_HERO.lede}
          </p>
          <div className={`mt-6 flex flex-wrap items-center gap-x-6 gap-y-4 ${rise()}`} style={delay(2)}>
            {/* Raised edge under the button; pressing sinks it onto the edge, plus a short buzz on Android. */}
            <button
              type="button"
              onPointerDown={buzz}
              onClick={goTry}
              className="inline-flex min-h-14 items-center gap-3 rounded-full bg-[linear-gradient(180deg,#f6a25f_0%,#ec7a2d_100%)] py-2.5 pr-2.5 pl-6 text-[18px] font-extrabold text-[#1b0f06] shadow-[0_5px_0_#b9561a,0_10px_18px_-8px_rgba(185,86,26,.55)] transition-[translate,box-shadow,filter] duration-75 hover:brightness-105 active:translate-y-1 active:shadow-[0_1px_0_#b9561a,0_3px_8px_-6px_rgba(185,86,26,.5)]"
            >
              {TRY_IT.button}
              <span
                aria-hidden="true"
                className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-white"
              >
                &rarr;
              </span>
            </button>
            <Link
              href="/therapist"
              onPointerDown={buzz}
              className="text-[17px] font-bold text-foreground underline decoration-2 underline-offset-[6px]"
            >
              {THERAPIST.moreLink} <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </header>

      {/* A leafy branch across the open space above the checks. Above the bird video, so it is never cut off. */}
      <div aria-hidden="true" className="pointer-events-none relative z-[2] h-[170px] @5xl:h-[300px]">
        {/* eslint-disable-next-line @next/next/no-img-element -- a large decorative picture that overflows on purpose */}
        <img
          src="/home/branch.png"
          alt=""
          className="absolute top-1/2 left-1/2 w-[120%] max-w-none -translate-x-1/2 -translate-y-1/2 -scale-x-100 rotate-3 @5xl:w-[105%]"
        />
      </div>

      <div className="relative z-[3] mx-auto flex w-full max-w-md flex-col gap-6 px-4 pb-6 @5xl:max-w-[880px]">
        {children}
      </div>
    </div>
  );
}
