'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';

/*
 * The fly-in at the top of home: a kingfisher flies in and lands, then the rest of home fades in below it.
 *
 * Video and technique: the free "Kingfisher" hero prompt by Thinking Gods (thinkingods.com). The clip loads
 * from their site, as the prompt asks. Credited in docs/HACKATHON.md.
 *
 * The trick: a giant word sits ON TOP of the video with mix-blend-mode: darken. At every pixel the browser keeps
 * the darker of the word and the video. The bird is darker than the word everywhere, so it looks like it flies in
 * front of the word. No cut-out and no masking per frame.
 *
 * Never blank and never stuck: the page shows anyway when the video ends, fails, cannot play, or after HARD_STOP_MS.
 * Reduced motion: jump to the last frame and show everything at once. After the first view in a tab, home opens
 * with everything showing (the bird already perched), so coming back to home is never a 4 second wait.
 */

const VIDEO_URL = 'https://thinkingods.com/demos/kingfisher-hero/hero.mp4';
/** Seconds into the clip when the bird has landed. Change this if the clip changes. */
const REVEAL_AT = 4.5;
/** Show the page anyway after this long, whatever the video is doing. */
const HARD_STOP_MS = 7000;
/** Where to read the backdrop color, as a share of the video's width and height (a plain part of the sky). */
const SAMPLE = { x: 0.94, y: 0.12 };
/** The word is this much darker than the backdrop: barely visible, so the bird reads in front of it. */
const GHOST = 0.955;
/** The backdrop color measured from the clip, used until the video has loaded. */
const FALLBACK_BG = 'rgb(183, 196, 182)';
/** Set once the fly-in has played in this tab. */
const SEEN_KEY = 'seespeak:flyin-seen';

function seenThisTab(): boolean {
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
    // Storage blocked: it plays again next time, which is fine.
  }
}

export function KingfisherHero({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  // Until the browser decides, everything shows: the server render and a page with no script are never blank.
  const [phase, setPhase] = useState<'idle' | 'waiting' | 'revealed'>('idle');

  useEffect(() => {
    const video = videoRef.current;
    const hero = heroRef.current;
    if (!video || !hero) return;

    let done = false;
    const reveal = () => {
      if (done) return;
      done = true;
      markSeen();
      setPhase('revealed');
    };

    // Match the page to the footage: read one pixel of plain sky and use it for the backdrop and the word.
    const matchBackdrop = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx || !video.videoWidth) return;
        ctx.drawImage(video, video.videoWidth * SAMPLE.x, video.videoHeight * SAMPLE.y, 1, 1, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        hero.style.setProperty('--kf-bg', `rgb(${r}, ${g}, ${b})`);
        hero.style.setProperty(
          '--kf-ghost',
          `rgb(${Math.round(r * GHOST)}, ${Math.round(g * GHOST)}, ${Math.round(b * GHOST)})`,
        );
      } catch {
        // The pixel could not be read: keep the fallback colors.
      }
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const skip = reduced || seenThisTab();

    const toLastFrame = () => {
      matchBackdrop();
      if (video.duration && Number.isFinite(video.duration))
        video.currentTime = Math.max(0, video.duration - 0.05);
    };

    if (skip) {
      // Show everything at once, with the bird already perched.
      queueMicrotask(reveal);
      if (video.readyState >= 1) toLastFrame();
      else video.addEventListener('loadedmetadata', toLastFrame, { once: true });
      video.addEventListener('loadeddata', matchBackdrop, { once: true });
      return;
    }

    queueMicrotask(() => setPhase('waiting'));
    const onTime = () => {
      if (video.currentTime >= REVEAL_AT) reveal();
    };
    const timer = window.setTimeout(reveal, HARD_STOP_MS);
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('ended', reveal);
    video.addEventListener('error', reveal);
    const start = () => {
      matchBackdrop();
      video.play().catch(reveal);
    };
    if (video.readyState >= 2) start();
    else video.addEventListener('loadeddata', start, { once: true });

    return () => {
      window.clearTimeout(timer);
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('ended', reveal);
      video.removeEventListener('error', reveal);
      video.removeEventListener('loadeddata', start);
    };
  }, []);

  return (
    <div className={`kf flex flex-col gap-6 ${phase === 'waiting' ? 'kf-waiting' : ''}`}>
      <style>{`
        .kf-hero { --kf-bg: ${FALLBACK_BG}; --kf-ghost: rgb(175, 187, 174); background: var(--kf-bg); container-type: inline-size; }
        .kf-word { color: var(--kf-ghost); mix-blend-mode: darken;
          -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 38%, rgba(0,0,0,.35) 62%, transparent 86%);
          mask-image: linear-gradient(180deg, #000 0%, #000 38%, rgba(0,0,0,.35) 62%, transparent 86%); }
        .kf-rest > * { transition: opacity .9s cubic-bezier(.2,.7,.1,1), transform .9s cubic-bezier(.2,.7,.1,1), filter .9s cubic-bezier(.2,.7,.1,1); }
        .kf-rest > *:nth-child(2) { transition-delay: 90ms; }
        .kf-rest > *:nth-child(3) { transition-delay: 180ms; }
        .kf-rest > *:nth-child(4) { transition-delay: 270ms; }
        .kf-rest > *:nth-child(n+5) { transition-delay: 360ms; }
        .kf-waiting .kf-rest > * { opacity: 0; transform: translateY(18px); filter: blur(6px); pointer-events: none; }
        @media (prefers-reduced-motion: reduce) { .kf-rest > * { transition: none; } }
      `}</style>
      <section
        ref={heroRef}
        aria-label="A kingfisher flies in and lands on a branch"
        className="kf-hero relative aspect-video max-h-[360px] w-full overflow-hidden rounded-xl"
      >
        <video
          ref={videoRef}
          src={VIDEO_URL}
          crossOrigin="anonymous"
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <p
          aria-hidden="true"
          className="kf-word pointer-events-none absolute inset-x-0 top-[8%] text-center font-serif text-[22cqw] leading-none tracking-tight select-none"
        >
          See<span className="italic">Speak</span>
        </p>
      </section>
      <div className="kf-rest flex flex-col gap-6">{children}</div>
    </div>
  );
}
