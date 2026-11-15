'use client';

import { useState } from 'react';
import { START_OVER } from '@/content/tryIt';
import { clearAll } from '@/lib/store';
import { RestartIcon } from './Icons';

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

  return (
    <div className="flex min-h-11 flex-wrap items-center gap-2 px-3 pt-2 text-sm">
      {asking ? (
        <div role="group" aria-label={START_OVER.ask} className="flex flex-wrap items-center gap-2">
          <span className="font-bold">{START_OVER.ask}</span>
          <button
            type="button"
            onClick={confirm}
            className="min-h-11 rounded-xl bg-foreground px-4 font-bold text-background"
          >
            {START_OVER.yes}
          </button>
          <button
            type="button"
            onClick={() => setAsking(false)}
            className="min-h-11 rounded-xl border border-line bg-surface px-4 font-bold"
          >
            {START_OVER.cancel}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAsking(true)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 font-semibold text-muted hover:bg-accent-soft hover:text-accent-edge"
        >
          <RestartIcon className="h-4 w-4" />
          {START_OVER.button}
        </button>
      )}
    </div>
  );
}
