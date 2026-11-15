'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/** Remove every SeeSpeak key from one storage area. Safe when storage is blocked. */
function clearArea(area: Storage | undefined): number {
  if (!area) return 0;
  const keys: string[] = [];
  for (let i = 0; i < area.length; i++) {
    const key = area.key(i);
    if (key && key.toLowerCase().startsWith('seespeak')) keys.push(key);
  }
  keys.forEach((key) => area.removeItem(key));
  return keys.length;
}

/**
 * Start over: clears the hearing check, plan, practice history, settings and tester nickname saved on this
 * device, so the next person starts fresh. Everything lives on the device, so this is all there is to clear.
 */
export default function ResetPage() {
  const [cleared, setCleared] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      let n = 0;
      try {
        n += clearArea(window.localStorage);
        n += clearArea(window.sessionStorage);
      } catch {
        // Storage blocked: nothing was saved, so there is nothing to clear.
      }
      setCleared(n);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-6 text-center">
      <h1 className="text-3xl font-bold">Start over</h1>
      <p role="status" className="text-lg">
        {cleared === null
          ? 'Clearing this device...'
          : 'Done. Everything saved on this device is cleared: hearing check, plan, practice and progress.'}
      </p>
      <Link href="/" className="min-h-14 rounded-2xl bg-teal-700 px-6 py-4 text-xl font-bold text-white">
        Start from the beginning
      </Link>
    </main>
  );
}
