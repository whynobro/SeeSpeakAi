'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { LaptopIcon, PhoneIcon } from './Icons';
import { StartOver } from './StartOver';

type ViewMode = 'phone' | 'laptop';

const STORAGE_KEY = 'seespeak:view-mode';

/*
 * Lets a laptop show the app two ways: inside a phone-sized frame (how a learner sees it on a phone) or full width.
 * The switch and the frame only appear on wide screens. On a real phone the app always fills the screen.
 * The choice is a display preference only, kept in this browser.
 * The switch hides once the page is scrolled down, so it never covers the app during a demo, and comes back at the top.
 */

/** Scrolled this far down (px), the Phone / Laptop switch hides. */
const HIDE_AFTER_PX = 40;
export function ViewModeFrame({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ViewMode>('phone');
  const [scrolled, setScrolled] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  // In the phone frame the frame itself scrolls; full width, the window does. Scroll events do not bubble,
  // so one listener in the capture phase hears both.
  useEffect(() => {
    const check = () => {
      const top = Math.max(window.scrollY, frameRef.current?.scrollTop ?? 0);
      setScrolled(top > HIDE_AFTER_PX);
    };
    document.addEventListener('scroll', check, { capture: true, passive: true });
    return () => document.removeEventListener('scroll', check, { capture: true });
  }, []);

  // Read the saved choice after the page is on screen, so the server and browser render the same first frame.
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // Storage blocked (private mode): keep the default.
    }
    if (saved === 'phone' || saved === 'laptop') queueMicrotask(() => setMode(saved));
  }, []);

  function choose(next: ViewMode) {
    setMode(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not saved, still switches for this visit.
    }
  }

  const phone = mode === 'phone';
  return (
    <div
      data-view={mode}
      className={`flex min-h-full flex-1 flex-col ${phone ? 'md:items-center md:bg-line/60 md:py-10' : ''}`}
    >
      <div
        role="group"
        aria-label="Preview size"
        className={`fixed top-4 right-4 z-50 hidden gap-1 rounded-2xl border border-line bg-surface p-1 transition-opacity duration-200 md:flex ${
          scrolled ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        {(
          [
            { value: 'phone', label: 'Phone', Icon: PhoneIcon },
            { value: 'laptop', label: 'Laptop', Icon: LaptopIcon },
          ] as const
        ).map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => choose(value)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-base font-bold transition-colors ${
              mode === value
                ? 'bg-accent text-accent-ink'
                : 'text-muted hover:bg-accent-soft hover:text-accent-edge'
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </div>
      {/*
       * Phone frame: the outer box does not scroll and holds the transform, so the fixed tab bar and the bird
       * pin to it and stay put. The inner box scrolls. (Before, the box that scrolled was also the one the
       * tab bar pinned to, so the tab bar scrolled away with the page.)
       */}
      <div
        className={
          phone
            ? 'flex flex-1 flex-col md:h-[844px] md:max-h-[calc(100vh-5rem)] md:w-[390px] md:flex-none md:overflow-hidden md:rounded-[48px] md:border-[12px] md:border-foreground md:bg-background md:[transform:translateZ(0)]'
            : 'flex flex-1 flex-col md:[&_main]:max-w-6xl md:[&_main]:px-12 md:[&_main]:pt-20'
        }
      >
        <div
          ref={frameRef}
          className={phone ? 'flex flex-1 flex-col md:min-h-0 md:overflow-y-auto' : 'contents'}
        >
          <StartOver />
          {children}
        </div>
      </div>
    </div>
  );
}
