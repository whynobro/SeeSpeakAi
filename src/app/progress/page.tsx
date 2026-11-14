'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BeforeAfterBars } from '@/components/BeforeAfterBars';
import { ArrowDownIcon, ArrowUpIcon, EqualsIcon, ShareIcon } from '@/components/Icons';
import { COPY } from '@/content/copy';
import { clearAll, loadAttempts, progressFor } from '@/lib/store';
import type { Attempt, SoundProgress, TargetSound } from '@/lib/types';

const SOUNDS: TargetSound[] = ['s', 'sh'];

/** progressFor uses the first 10 and the latest 10 tries. They share no tries only from 20 tries on. */
const WINDOW = 10;
const SEPARATE_WINDOWS = WINDOW * 2;

const PRIMARY =
  'flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-lg font-bold text-accent-ink';
const SECONDARY =
  'flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-foreground bg-surface px-4 text-lg font-bold';

interface SoundView {
  p: SoundProgress;
  /** Tries where the sound was there, out of all tries for this sound. */
  hits: number;
}

function viewsFrom(attempts: Attempt[]): SoundView[] {
  return SOUNDS.map((sound) => ({
    p: progressFor(attempts, sound),
    hits: attempts.filter((a) => a.target === sound && a.score.verdict === 'hit').length,
  }));
}

function hasBeforeAfter(p: SoundProgress): boolean {
  return p.attempts >= SEPARATE_WINDOWS && p.firstAccuracy !== null && p.latestAccuracy !== null;
}

function tries(n: number): string {
  return n === 1 ? '1 try' : `${n} tries`;
}

/** One plain line per sound for the summary and the shared text. Numbers only. */
function summaryLine({ p, hits }: SoundView): string {
  if (p.attempts === 0) return `${p.sound}: no tries yet`;
  if (hasBeforeAfter(p)) {
    const first = Math.round((p.firstAccuracy ?? 0) * WINDOW);
    const latest = Math.round((p.latestAccuracy ?? 0) * WINDOW);
    return `${p.sound}: ${first} of the first 10, ${latest} of the latest 10, ${tries(p.attempts)}`;
  }
  return `${p.sound}: ${hits} of ${tries(p.attempts)} so far`;
}

function Change({ p }: { p: SoundProgress }) {
  const diff = Math.round((p.latestAccuracy ?? 0) * 100) - Math.round((p.firstAccuracy ?? 0) * 100);
  if (diff > 0) {
    return (
      <p className="flex items-center justify-center gap-2 text-2xl font-bold">
        <ArrowUpIcon className="h-8 w-8" />
        {diff} points better
      </p>
    );
  }
  if (diff < 0) {
    return (
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="flex items-center justify-center gap-2 text-2xl font-bold">
          <ArrowDownIcon className="h-8 w-8" />
          {-diff} points lower
        </p>
        <p className="text-muted">Scores go up and down from day to day. Every try is practice.</p>
      </div>
    );
  }
  return (
    <p className="flex items-center justify-center gap-2 text-2xl font-bold">
      <EqualsIcon className="h-8 w-8" />
      About the same
    </p>
  );
}

function SoundCard({ view }: { view: SoundView }) {
  const { p, hits } = view;
  return (
    <section
      aria-labelledby={`sound-${p.sound}`}
      className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 shadow-sm"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 id={`sound-${p.sound}`} className="text-3xl font-bold">
          &ldquo;{p.sound}&rdquo;
        </h2>
        <span className="text-muted">{tries(p.attempts)}</span>
      </div>

      {p.attempts === 0 ? (
        <>
          <p className="text-lg">No tries yet. Your first word takes a few seconds.</p>
          <Link href={`/practice?sound=${p.sound}`} className={PRIMARY}>
            Practice &ldquo;{p.sound}&rdquo;
          </Link>
        </>
      ) : hasBeforeAfter(p) ? (
        <>
          <p className="text-muted">Tries where the sound was there</p>
          <BeforeAfterBars
            bars={[
              { label: 'First 10 tries', value: p.firstAccuracy ?? 0, kind: 'before' },
              { label: 'Latest 10 tries', value: p.latestAccuracy ?? 0, kind: 'after' },
            ]}
          />
          <Change p={p} />
        </>
      ) : (
        <>
          <p className="text-muted">Tries where the sound was there</p>
          <BeforeAfterBars bars={[{ label: 'So far', value: hits / p.attempts, kind: 'after' }]} />
          <p className="text-center text-lg">Keep going: after more tries you will see before and after.</p>
          <p className="text-center text-muted">{tries(SEPARATE_WINDOWS - p.attempts)} to go.</p>
        </>
      )}
    </section>
  );
}

export default function ProgressPage() {
  const [views, setViews] = useState<SoundView[]>(() => viewsFrom([]));
  const [confirming, setConfirming] = useState(false);
  const [today, setToday] = useState('');
  const [canShare, setCanShare] = useState(false);

  // Browser storage, the date and the share check are read only here, after the page is on screen.
  useEffect(() => {
    const id = setTimeout(() => {
      setViews(viewsFrom(loadAttempts()));
      setToday(new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }));
      setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
    }, 0);
    return () => clearTimeout(id);
  }, []);

  function clear() {
    clearAll();
    setViews(viewsFrom([]));
    setConfirming(false);
  }

  const lines = views.map(summaryLine);
  const shareText = [
    `SeeSpeak practice summary${today ? `, ${today}` : ''}`,
    'Tries where the sound was there:',
    ...lines,
    COPY.notTherapy,
  ].join('\n');

  async function share() {
    try {
      await navigator.share({ title: 'SeeSpeak practice summary', text: shareText });
    } catch {
      // The person closed the share sheet, or sharing failed. The summary is still on screen.
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-6 pb-8">
      <header className="flex flex-col gap-2">
        <Link href="/" className="flex min-h-12 w-fit items-center text-lg underline underline-offset-4">
          Home
        </Link>
        <h1 className="text-4xl font-bold">Progress</h1>
      </header>

      <section
        aria-labelledby="summary-heading"
        className="flex flex-col gap-2 rounded-2xl border-2 border-foreground bg-surface p-4"
      >
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="summary-heading" className="text-xl font-bold">
            SeeSpeak summary
          </h2>
          <span className="text-muted">{today}</span>
        </div>
        <p className="text-muted">Tries where the sound was there:</p>
        <ul className="flex flex-col gap-1 text-lg">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="text-sm text-muted">{COPY.notTherapy}</p>
        {canShare && (
          <button type="button" onClick={share} className={SECONDARY}>
            <ShareIcon className="h-6 w-6" />
            Share
          </button>
        )}
      </section>

      {views.map((view) => (
        <SoundCard key={view.p.sound} view={view} />
      ))}

      <Link href="/practice" className={PRIMARY}>
        Practice now
      </Link>

      {confirming ? (
        <div className="flex flex-col gap-2 rounded-2xl border-2 border-miss bg-surface p-4">
          <p className="font-bold">Delete your profile, settings and tries from this phone?</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={clear}
              className="min-h-14 rounded-2xl border-2 border-miss px-2 font-bold"
            >
              Yes, clear it
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="min-h-14 rounded-2xl border-2 border-foreground px-2"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="min-h-14 rounded-2xl border-2 border-line px-4 text-lg"
        >
          Clear my data on this phone
        </button>
      )}

      <p className="text-sm text-muted">{COPY.privacy}</p>
    </main>
  );
}
