'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { COPY } from '@/content/copy';
import { clearAll, loadAttempts, progressFor } from '@/lib/store';
import type { SoundProgress, TargetSound } from '@/lib/types';

const SOUNDS: TargetSound[] = ['s', 'sh'];

function pct(n: number | null): string {
  return n === null ? 'No tries yet' : `${Math.round(n * 100)}%`;
}

function change(p: SoundProgress): string | null {
  if (p.firstAccuracy === null || p.latestAccuracy === null || p.attempts < 2) return null;
  const diff = Math.round(p.latestAccuracy * 100) - Math.round(p.firstAccuracy * 100);
  if (diff > 0) return '↑ better';
  if (diff < 0) return '↓ lower';
  return '= same';
}

export default function ProgressPage() {
  const [progress, setProgress] = useState<SoundProgress[]>(() => SOUNDS.map((s) => progressFor([], s)));
  const [confirming, setConfirming] = useState(false);

  // Browser storage is read only here, after the page is on screen.
  useEffect(() => {
    const id = setTimeout(() => {
      const attempts = loadAttempts();
      setProgress(SOUNDS.map((s) => progressFor(attempts, s)));
    }, 0);
    return () => clearTimeout(id);
  }, []);

  function clear() {
    clearAll();
    setProgress(SOUNDS.map((s) => progressFor([], s)));
    setConfirming(false);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-4">
      <header className="flex flex-col gap-2">
        <Link href="/" className="underline">
          Home
        </Link>
        <h1 className="text-3xl font-bold">Progress</h1>
      </header>

      {progress.map((p) => {
        const c = change(p);
        return (
          <section key={p.sound} className="flex flex-col gap-1 rounded-lg border-2 border-current p-3">
            <h2 className="text-2xl font-bold">&ldquo;{p.sound}&rdquo;</h2>
            <p>Tries: {p.attempts}</p>
            <p>First 10 tries: {pct(p.firstAccuracy)}</p>
            <p>Latest 10 tries: {pct(p.latestAccuracy)}</p>
            {c && <p className="text-xl font-bold">{c}</p>}
          </section>
        );
      })}

      {confirming ? (
        <div className="flex flex-col gap-2 rounded-lg border-2 border-current p-3">
          <p className="font-bold">Delete your profile, settings and tries from this phone?</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={clear}
              className="min-h-14 rounded-lg border-2 border-current px-2 font-bold"
            >
              Yes, clear it
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="min-h-14 rounded-lg border-2 border-current px-2"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="min-h-14 rounded-lg border-2 border-current px-4 text-lg"
        >
          Clear my data on this phone
        </button>
      )}

      <p className="text-sm">{COPY.privacy}</p>
    </main>
  );
}
