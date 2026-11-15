'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { LaptopIcon, PhoneIcon } from './Icons';

type ViewMode = 'phone' | 'laptop';

const STORAGE_KEY = 'seespeak:view-mode';

/*
 * Lets a laptop show the app two ways: inside a phone-sized frame (how a learner sees it on a phone) or full width.
 * The switch and the frame only appear on wide screens. On a real phone the app always fills the screen.
 * The choice is a display preference only, kept in this browser.
 */
export function ViewModeFrame({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ViewMode>('phone');

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
        className="fixed top-4 right-4 z-50 hidden gap-1 rounded-2xl border-2 border-line bg-surface p-1 shadow-clay md:flex"
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
      <div
        className={
          phone
            ? 'flex flex-1 flex-col md:h-[844px] md:max-h-[calc(100vh-5rem)] md:w-[390px] md:flex-none md:overflow-y-auto md:rounded-[48px] md:border-[12px] md:border-foreground md:bg-background md:[transform:translateZ(0)]'
            : 'flex flex-1 flex-col md:[&_main]:max-w-3xl md:[&_main]:px-8 md:[&_main]:pt-20'
        }
      >
        {children}
      </div>
    </div>
  );
}
