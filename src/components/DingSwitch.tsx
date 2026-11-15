'use client';

import { useEffect, useState } from 'react';
import { loadDingOn, saveDingOn } from './hitDing';

/** One settings row: the ding on a hit, on or off. The state is shown with a word, not color alone. */
export function DingSwitch() {
  const [on, setOn] = useState(true);

  // Storage is read after the page loads, never during render.
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setOn(loadDingOn());
    });
    return () => {
      active = false;
    };
  }, []);

  function onChange(next: boolean) {
    setOn(next);
    saveDingOn(next);
  }

  return (
    <label className="flex min-h-14 cursor-pointer items-center gap-4 py-3">
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="text-[17px] font-bold">Ding when you get it right</span>
        <span id="ding-switch-note" className="text-[15px] leading-snug text-muted">
          A short, quiet sound. The result is always shown in words too.
        </span>
      </span>
      <span aria-hidden="true" className="w-7 shrink-0 text-right text-[15px] font-bold">
        {on ? 'On' : 'Off'}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={on}
        onChange={(event) => onChange(event.target.checked)}
        aria-describedby="ding-switch-note"
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
