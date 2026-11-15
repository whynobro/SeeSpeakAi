'use client';

import { useSyncExternalStore } from 'react';
import { isBirdHidden, setBirdHidden, subscribeBirdHidden } from './birdSignal';

/**
 * A labeled on/off switch for the bird. The choice is saved on this device only.
 * The state is shown with a word (On or Off) as well as the knob, never by color alone.
 */
export function BirdSwitch() {
  // The server and the first browser render both say "shown", so the two always match.
  const hidden = useSyncExternalStore(subscribeBirdHidden, isBirdHidden, () => false);
  const on = !hidden;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setBirdHidden(on)}
      className="flex min-h-16 w-full items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-4 py-3 text-left shadow-edge-line"
    >
      <span className="flex flex-col gap-0.5">
        <span className="text-lg font-bold">Show the bird</span>
        <span className="text-sm leading-snug text-muted">
          A small bird keeps you company. Its beak moves with how loud you are, nothing else.
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className={`w-7 text-right text-base font-bold ${on ? 'text-accent-edge' : 'text-muted'}`}>
          {on ? 'On' : 'Off'}
        </span>
        <span
          aria-hidden="true"
          className={`flex h-8 w-14 items-center rounded-full border-2 px-0.5 transition-colors ${
            on ? 'border-accent-edge bg-accent' : 'border-muted bg-line'
          }`}
        >
          <span
            className={`h-6 w-6 rounded-full bg-surface transition-transform motion-reduce:transition-none ${
              on ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </span>
      </span>
    </button>
  );
}
