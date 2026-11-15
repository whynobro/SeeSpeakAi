'use client';

import { useEffect, useState } from 'react';
import { BeforeAfterBars } from '@/components/BeforeAfterBars';
import { ArrowDownIcon, ArrowUpIcon, EqualsIcon, ShareIcon, TrashIcon } from '@/components/Icons';
import { loadAssignment, quotedSounds, type Assignment } from '@/components/assignmentStore';
import { PageHeader, SECTION_TITLE, Screen } from '@/components/PageHeader';
import { Button, Card, IconTile } from '@/components/ui';
import { COPY } from '@/content/copy';
import { ASSIGN, THERAPIST_SUMMARY } from '@/content/therapist';
import { LEVELS, levelById, levelPassed, type LevelResults } from '@/lib/levels';
import { TARGET_SOUNDS } from '@/lib/scoring/constants';
import {
  MIN_TRIES_FOR_CHANGE,
  clearAll,
  loadAttempts,
  loadLevelResults,
  progressFor,
  progressWindow,
} from '@/lib/store';
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

/** On how many of the last 7 days (today included) there was at least one saved try. */
function daysPracticed(attempts: Attempt[], now: Date): number {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);
  const days = new Set<string>();
  for (const a of attempts) {
    const at = new Date(a.createdAt);
    if (at >= start && at <= now) days.add(at.toDateString());
  }
  return days.size;
}

/** One line per sound that has a passed level, from the saved level results. */
function levelLines(results: LevelResults): string[] {
  const lines: string[] = [];
  for (const sound of TARGET_SOUNDS) {
    const done = LEVELS.filter((l) => levelPassed(results, sound, l.id));
    if (done.length > 0) {
      lines.push(`${sound}: ${done.map((l) => THERAPIST_SUMMARY.levelPassed(l.number, l.title)).join(', ')}`);
    }
  }
  return lines;
}

/** The line that repeats what the speech therapist set, so they can match the summary to their link. */
function assignedLine(a: Assignment): string {
  const level = levelById(a.level);
  return THERAPIST_SUMMARY.assigned(
    quotedSounds(a.sounds),
    THERAPIST_SUMMARY.levelPassed(level.number, level.title),
    a.days === null ? '' : ASSIGN.days(a.days).toLowerCase(),
  );
}

/** Everything in the summary besides the per-sound tries. All of it is read from this device. */
interface Extra {
  /** false until there is a saved try or a passed level: then there is nothing true to share. */
  hasData: boolean;
  days: number;
  levels: string[];
  assignment: Assignment | null;
}

const NO_EXTRA: Extra = { hasData: false, days: 0, levels: [], assignment: null };

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
  const [extra, setExtra] = useState<Extra>(NO_EXTRA);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  // Browser storage, the date and the share check are read only here, after the page is on screen.
  useEffect(() => {
    const id = setTimeout(() => {
      const attempts = loadAttempts();
      const levels = levelLines(loadLevelResults());
      setViews(viewsFrom(attempts));
      setExtra({
        hasData: attempts.length > 0 || levels.length > 0,
        days: daysPracticed(attempts, new Date()),
        levels,
        assignment: loadAssignment(),
      });
      setToday(new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }));
      setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
    }, 0);
    return () => clearTimeout(id);
  }, []);

  function clear() {
    clearAll();
    setViews(viewsFrom([]));
    setExtra({ ...NO_EXTRA, assignment: extra.assignment });
    setCopyState('idle');
    setConfirming(false);
  }

  const lines = views.map(summaryLine);
  const shareText = [
    THERAPIST_SUMMARY.heading(today),
    ...(extra.assignment ? [assignedLine(extra.assignment)] : []),
    THERAPIST_SUMMARY.daysPracticed(extra.days),
    THERAPIST_SUMMARY.triesHeading,
    ...lines,
    ...(extra.levels.length > 0
      ? [THERAPIST_SUMMARY.levelsHeading, ...extra.levels]
      : [THERAPIST_SUMMARY.noLevels]),
    COPY.notTherapy,
  ].join('\n');

  async function share() {
    try {
      await navigator.share({ title: THERAPIST_SUMMARY.heading(''), text: shareText });
    } catch {
      // The person closed the share sheet, or sharing failed. The summary is still on screen.
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  }

  return (
    <Screen>
      <PageHeader title="Progress" />

      <Card as="section" tone="accent" aria-labelledby="summary-heading" className="flex flex-col gap-3">
        <h2 id="summary-heading" className={SECTION_TITLE}>
          {THERAPIST_SUMMARY.title}
        </h2>
        {extra.hasData ? (
          <>
            <p className="text-[15px] text-muted">{THERAPIST_SUMMARY.exact}</p>
            {/* The same string that is shared or copied, line for line, so the learner sees what leaves. */}
            <p className="rounded-lg border border-line bg-surface px-4 py-3 text-[15px] leading-relaxed whitespace-pre-line">
              {shareText}
            </p>
            <div className={`grid gap-3 ${canShare ? 'grid-cols-2' : ''}`}>
              {canShare && (
                <Button onClick={share}>
                  <ShareIcon className="h-6 w-6" />
                  {THERAPIST_SUMMARY.share}
                </Button>
              )}
              <Button variant="secondary" onClick={copy}>
                {THERAPIST_SUMMARY.copy}
              </Button>
            </div>
            <p role="status" className="min-h-6 font-bold">
              {copyState === 'copied' && THERAPIST_SUMMARY.copied}
              {copyState === 'failed' && THERAPIST_SUMMARY.copyFailed}
            </p>
          </>
        ) : (
          <p className="text-[17px] text-muted">{THERAPIST_SUMMARY.empty}</p>
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
    </Screen>
  );
}
