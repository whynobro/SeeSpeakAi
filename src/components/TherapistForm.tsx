'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { THERAPIST } from '@/content/therapist';
import { LEVELS, type LevelId } from '@/lib/levels';
import { TARGET_SOUNDS } from '@/lib/scoring/constants';
import { ArrowRightIcon, ShareIcon } from './Icons';
import { DAY_CHOICES, SHOW_ONLY_SOUNDS, assignPath, toAssignment, type AssignDays } from './assignmentStore';
import { Button, SegmentedControl } from './ui';

/** A check mark for a chosen chip, so the choice is never shown by color alone. */
function Tick() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function SoundChip({ sound, on, toggle }: { sound: string; on: boolean; toggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={toggle}
      className={`inline-flex min-h-12 min-w-[76px] items-center justify-center gap-1.5 rounded-full px-4 text-xl font-extrabold ${
        on ? 'bg-accent text-accent-ink' : 'border border-accent bg-surface text-accent-edge'
      }`}
    >
      {on && <Tick />}
      {sound}
    </button>
  );
}

type CopyState = 'idle' | 'copied' | 'failed';

/**
 * The speech therapist's form: sounds, a starting level and days a week, turned into a practice link.
 * There is no name field and no free text on purpose: everything chosen here ends up in a URL.
 */
export function TherapistForm() {
  const [sounds, setSounds] = useState<string[]>([]);
  const [level, setLevel] = useState<LevelId>(LEVELS[0].id);
  const [days, setDays] = useState<AssignDays>(5);
  /** The made link: the path for our own router, and the full URL to copy or share. */
  const [made, setMade] = useState<{ path: string; url: string } | null>(null);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setCanShare(typeof navigator.share === 'function'), 0);
    return () => clearTimeout(id);
  }, []);

  // Any change makes the old link wrong, so it is taken away until the therapist makes a new one.
  function changed() {
    setMade(null);
    setCopyState('idle');
  }

  function toggle(sound: string) {
    setSounds((list) => (list.includes(sound) ? list.filter((s) => s !== sound) : [...list, sound]));
    changed();
  }

  function make() {
    const assignment = toAssignment(sounds, level, days);
    if (!assignment) return;
    const path = assignPath(assignment);
    setMade({ path, url: `${window.location.origin}${path}` });
    setCopyState('idle');
  }

  async function copy() {
    if (!made) return;
    try {
      await navigator.clipboard.writeText(made.url);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  }

  async function share() {
    if (!made) return;
    try {
      await navigator.share({ title: THERAPIST.shareTitle, url: made.url });
    } catch {
      // The share sheet was closed, or sharing failed. The link is still on screen to copy.
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <section aria-labelledby="sounds-heading" className="flex flex-col gap-3">
        <h2 id="sounds-heading" className="text-[20px] font-bold">
          {THERAPIST.soundsTitle}
        </h2>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div role="group" aria-label={THERAPIST.scoredLabel} className="flex flex-col gap-2 px-4 py-4">
            <p className="text-[15px] font-bold">{THERAPIST.scoredLabel}</p>
            <div className="flex flex-wrap gap-2">
              {TARGET_SOUNDS.map((s) => (
                <SoundChip key={s} sound={s} on={sounds.includes(s)} toggle={() => toggle(s)} />
              ))}
            </div>
          </div>
          <div
            role="group"
            aria-label={THERAPIST.showOnlyLabel}
            className="flex flex-col gap-2 border-t border-line px-4 py-4"
          >
            <p className="text-[15px] font-bold">{THERAPIST.showOnlyLabel}</p>
            <div className="flex flex-wrap gap-2">
              {SHOW_ONLY_SOUNDS.map((s) => (
                <SoundChip key={s} sound={s} on={sounds.includes(s)} toggle={() => toggle(s)} />
              ))}
            </div>
            <p className="text-[15px] text-muted">{THERAPIST.showOnlyNote}</p>
          </div>
        </div>
      </section>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-[20px] font-bold">{THERAPIST.levelTitle}</legend>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {LEVELS.map((l) => (
            <label
              key={l.id}
              className={`flex min-h-14 cursor-pointer items-center gap-3 border-t border-line px-4 py-3 first:border-t-0 ${
                l.id === level ? 'bg-accent-soft' : ''
              }`}
            >
              <input
                type="radio"
                name="level"
                value={l.id}
                checked={l.id === level}
                onChange={() => {
                  setLevel(l.id);
                  changed();
                }}
                className="h-5 w-5 shrink-0 accent-accent"
              />
              <span className="w-4 text-[17px] font-bold text-muted">{l.number}</span>
              <span className="text-[17px] font-bold">{l.title}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <section aria-labelledby="days-heading" className="flex flex-col gap-3">
        <h2 id="days-heading" className="text-[20px] font-bold">
          {THERAPIST.daysTitle}
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <SegmentedControl
              label={THERAPIST.daysTitle}
              options={DAY_CHOICES.map((n) => ({ value: String(n), label: THERAPIST.daysOption(n) }))}
              value={String(days)}
              onChange={(v) => {
                setDays(DAY_CHOICES.find((n) => String(n) === v) ?? 5);
                changed();
              }}
            />
          </div>
          <span className="text-[17px] text-muted">{THERAPIST.daysUnit}</span>
        </div>
      </section>

      <div className="flex flex-col gap-3">
        <Button size="lg" onClick={make} disabled={sounds.length === 0}>
          {THERAPIST.make}
        </Button>
        <p className="text-[15px] text-muted">
          {sounds.length === 0 ? THERAPIST.needSound : THERAPIST.linkHolds}
        </p>
      </div>

      {made && (
        <section aria-labelledby="link-heading" className="flex flex-col gap-3 border-t border-line pt-6">
          <h2 id="link-heading" className="text-[20px] font-bold">
            {THERAPIST.linkTitle}
          </h2>
          <p className="rounded-lg border border-line bg-surface px-4 py-3 font-mono text-[15px] break-all select-all">
            {made.url}
          </p>
          <div className={`grid gap-3 ${canShare ? 'grid-cols-2' : ''}`}>
            <Button onClick={copy}>{THERAPIST.copy}</Button>
            {canShare && (
              <Button variant="secondary" onClick={share}>
                <ShareIcon className="h-6 w-6" />
                {THERAPIST.share}
              </Button>
            )}
          </div>
          <p role="status" className="min-h-6 text-[17px] font-bold">
            {copyState === 'copied' && THERAPIST.copied}
            {copyState === 'failed' && THERAPIST.copyFailed}
          </p>
          <Link
            href={made.path}
            className="inline-flex min-h-12 items-center gap-2 self-start text-[17px] font-bold text-accent-edge underline decoration-2 underline-offset-4"
          >
            {THERAPIST.openAsLearner}
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </section>
      )}
    </div>
  );
}
