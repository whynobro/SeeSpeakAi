'use client';

import { useState } from 'react';
import { START_OVER } from '@/content/tryIt';
import { clearAll } from '@/lib/store';

/** Every saved key this app writes starts with "seespeak." or "seespeak:". The view size choice is only a display setting, so it stays. */
const KEEP = 'seespeak:view-mode';

function clearEverything(): void {
  clearAll();
  try {
    for (const store of [window.localStorage, window.sessionStorage]) {
      for (const key of Object.keys(store)) {
        if ((key.startsWith('seespeak.') || key.startsWith('seespeak:')) && key !== KEEP)
          store.removeItem(key);
      }
    }
  } catch {
    // Storage blocked: nothing was saved.
  }
}

/** A small "Start over" control at the top-left of every page. One tap asks, a second tap on Yes clears. */
export function StartOver() {
  const [asking, setAsking] = useState(false);

  function confirm() {
    clearEverything();
    setAsking(false);
    // A full load, so every screen reads the empty storage fresh.
    window.location.assign('/');
  }

  // Quiet on purpose: small gray text with a hairline underline. Every control is still 44 px tall.
  return (
    <div className="flex min-h-11 flex-wrap items-center gap-x-1 px-1 pt-1 text-[13px]">
      {asking ? (
        <div role="group" aria-label={START_OVER.ask} className="flex flex-wrap items-center gap-x-1">
          <span className="px-3 font-bold">{START_OVER.ask}</span>
          <button
            type="button"
            onClick={confirm}
            className="group inline-flex min-h-11 min-w-11 items-center justify-center px-1 font-bold text-miss-ink"
          >
            <span className="rounded-lg border border-miss-ink px-3 py-1 group-hover:bg-miss-soft group-active:bg-miss-soft">
              {START_OVER.yes}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setAsking(false)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center px-3 font-semibold text-muted underline decoration-line decoration-2 underline-offset-4 hover:text-foreground"
          >
            {START_OVER.cancel}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAsking(true)}
          className="inline-flex min-h-11 items-center px-3 font-semibold text-muted underline decoration-line decoration-2 underline-offset-4 hover:text-foreground"
        >
          {START_OVER.button}
        </button>
      )}
    </div>
  );
}
