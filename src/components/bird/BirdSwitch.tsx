'use client';

import { useSyncExternalStore } from 'react';
import { isBirdHidden, setBirdHidden, subscribeBirdHidden } from './birdSignal';

/**
 * One settings row: the bird, shown or hidden. The choice is saved on this device only.
 * The state is shown with a word (On or Off) as well as the knob, never by color alone.
 * Same look as the other rows in the Settings list on the More tab.
 */
export function BirdSwitch() {
  // The server and the first browser render both say "shown", so the two always match.
  const hidden = useSyncExternalStore(subscribeBirdHidden, isBirdHidden, () => false);
  const on = !hidden;

  return (
    <label className="flex min-h-14 cursor-pointer items-center gap-4 py-3">
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="text-[17px] font-bold">Show the bird</span>
        <span id="bird-switch-note" className="text-[15px] leading-snug text-muted">
          A small bird sits in the corner of the practice screen. Its beak moves with how loud you are,
          nothing else.
        </span>
      </span>
      <span aria-hidden="true" className="w-7 shrink-0 text-right text-[15px] font-bold">
        {on ? 'On' : 'Off'}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={on}
        onChange={(event) => setBirdHidden(!event.target.checked)}
        aria-describedby="bird-switch-note"
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`flex h-8 w-14 shrink-0 items-center rounded-full border p-1 transition-colors duration-150 peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-edge ${
          on ? 'justify-end border-accent bg-accent' : 'justify-start border-muted bg-surface'
        }`}
      >
        <span className={`h-[22px] w-[22px] rounded-full ${on ? 'bg-accent-ink' : 'bg-muted'}`} />
      </span>
    </label>
  );
}
