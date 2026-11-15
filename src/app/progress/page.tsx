'use client';

import { useEffect, useState } from 'react';
import { BeforeAfterBars } from '@/components/BeforeAfterBars';
import { ArrowDownIcon, ArrowUpIcon, EqualsIcon, ShareIcon, TrashIcon } from '@/components/Icons';
import { Button, Card, IconTile } from '@/components/ui';
import { COPY } from '@/content/copy';
import { TARGET_SOUNDS } from '@/lib/scoring/constants';
import { MIN_TRIES_FOR_CHANGE, clearAll, loadAttempts, progressFor, progressWindow } from '@/lib/store';
import type { Attempt, SoundProgress, TargetSound } from '@/lib/types';

/** "s" and "sh" always show. "z" and "ch" show once there is a try, so a new learner sees two cards, not four. */
const ALWAYS: TargetSound[] = ['s', 'sh'];

// Before and after compare the first half of the tries with the second half (at most 10 each), from 6 tries on.

interface SoundView {
  p: SoundProgress;
  /** Tries where the sound was there, out of all tries for this sound. */
  hits: number;
}

function viewsFrom(attempts: Attempt[]): SoundView[] {
  const sounds = TARGET_SOUNDS.filter((s) => ALWAYS.includes(s) || attempts.some((a) => a.target === s));
  return sounds.map((sound) => ({
    p: progressFor(attempts, sound),
    hits: attempts.filter((a) => a.target === sound && a.score.verdict === 'hit').length,
  }));
}

function hasBeforeAfter(p: SoundProgress): boolean {
  return p.attempts >= MIN_TRIES_FOR_CHANGE && p.firstAccuracy !== null && p.latestAccuracy !== null;
}

function tries(n: number): string {
  return n === 1 ? '1 try' : `${n} tries`;
}

/** One plain line per sound for the summary and the shared text. Numbers only. */
function summaryLine({ p, hits }: SoundView): string {
  if (p.attempts === 0) return `${p.sound}: no tries yet`;
  if (hasBeforeAfter(p)) {
    const w = progressWindow(p.attempts);
    const first = Math.round((p.firstAccuracy ?? 0) * w);
    const latest = Math.round((p.latestAccuracy ?? 0) * w);
    return `${p.sound}: ${first} of the first ${w}, ${latest} of the latest ${w}, ${tries(p.attempts)}`;
  }
  return `${p.sound}: ${hits} of ${tries(p.attempts)} so far`;
}

function Change({ p }: { p: SoundProgress }) {
  const diff = Math.round((p.latestAccuracy ?? 0) * 100) - Math.round((p.firstAccuracy ?? 0) * 100);
  if (diff > 0) {
    return (
      <p className="flex items-center justify-center gap-2 text-2xl font-extrabold text-hit-strong">
        <ArrowUpIcon className="h-8 w-8" />
        {diff} points better
      </p>
    );
  }
  if (diff < 0) {
    return (
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="flex items-center justify-center gap-2 text-2xl font-extrabold">
          <ArrowDownIcon className="h-8 w-8" />
          {-diff} points lower
        </p>
        <p className="text-muted">Scores go up and down from day to day. Every try is practice.</p>
      </div>
    );
  }
  return (
    <p className="flex items-center justify-center gap-2 text-2xl font-extrabold">
      <EqualsIcon className="h-8 w-8" />
      About the same
    </p>
  );
}

function SoundCard({ view }: { view: SoundView }) {
  const { p, hits } = view;
  return (
    <Card as="section" aria-labelledby={`sound-${p.sound}`} className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <IconTile tone="soft" size="lg" className="text-3xl font-extrabold">
          {p.sound}
        </IconTile>
        <h2 id={`sound-${p.sound}`} className="flex-1 text-3xl font-extrabold">
          &ldquo;{p.sound}&rdquo;
        </h2>
        <span className="text-base font-bold text-muted">{tries(p.attempts)}</span>
      </div>

      {p.attempts === 0 ? (
        <>
          <p className="text-lg">No tries yet. Your first word takes a few seconds.</p>
          <Button href={`/practice?sound=${p.sound}`}>Practice &ldquo;{p.sound}&rdquo;</Button>
        </>
      ) : hasBeforeAfter(p) ? (
        <>
          <p className="text-muted">Tries where the sound was there</p>
          <BeforeAfterBars
            bars={[
              {
                label: `First ${progressWindow(p.attempts)} tries`,
                value: p.firstAccuracy ?? 0,
                kind: 'before',
              },
              {
                label: `Latest ${progressWindow(p.attempts)} tries`,
                value: p.latestAccuracy ?? 0,
                kind: 'after',
              },
            ]}
          />
          <Change p={p} />
        </>
      ) : (
        <>
          <p className="text-muted">Tries where the sound was there</p>
          <BeforeAfterBars bars={[{ label: 'So far', value: hits / p.attempts, kind: 'after' }]} />
          <p className="text-center text-lg">Keep going: after more tries you will see before and after.</p>
          <p className="text-center text-muted">{tries(MIN_TRIES_FOR_CHANGE - p.attempts)} to go.</p>
        </>
      )}
    </Card>
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
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-4 pb-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] leading-tight font-extrabold tracking-tight">Progress</h1>
      </header>

      <Card as="section" tone="accent" aria-labelledby="summary-heading" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-2">
          <h2 id="summary-heading" className="text-xl font-bold">
            SeeSpeak summary
          </h2>
          <span className="text-sm font-bold text-muted">{today}</span>
        </div>
        <p className="text-muted">Tries where the sound was there:</p>
        <ul className="flex flex-col gap-1 text-lg font-semibold">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="text-sm text-muted">{COPY.notTherapy}</p>
        {canShare && (
          <Button variant="secondary" onClick={share}>
            <ShareIcon className="h-6 w-6" />
            Share
          </Button>
        )}
      </Card>

      {views.map((view) => (
        <SoundCard key={view.p.sound} view={view} />
      ))}

      <Button href="/practice" size="lg">
        Practice now
      </Button>

      {confirming ? (
        <Card className="flex flex-col gap-4 border-dashed">
          <p className="text-lg font-bold">Delete your profile, settings and tries from this phone?</p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="danger" onClick={clear}>
              Yes, clear it
            </Button>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      ) : (
        <Button variant="danger" onClick={() => setConfirming(true)}>
          <TrashIcon className="h-5 w-5" />
          Clear my data on this phone
        </Button>
      )}

      <p className="text-sm text-muted">{COPY.privacy}</p>
    </main>
  );
}
