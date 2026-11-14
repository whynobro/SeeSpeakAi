'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { COPY } from '@/content/copy';
import { PROFILE_LIMITATIONS, pickTargets } from '@/lib/profile';
import { loadProfile, loadSettings, saveProfile, saveSettings } from '@/lib/store';
import type { HearingProfile, LingSound, TargetPick } from '@/lib/types';

const LING: LingSound[] = ['m', 'oo', 'ah', 'ee', 'sh', 's'];

const RISK_LABEL: Record<TargetPick['risk'], string> = {
  high: 'Practice this first',
  some: 'Worth practicing',
  low: 'You likely hear this one',
};

/** Where the learner is in the flow. A number is the index of the sound being checked. */
type Step = 'intro' | number | 'result';

const PRIMARY =
  'flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-accent px-5 py-3 text-center text-xl font-bold text-accent-ink';
const SECONDARY =
  'flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border-2 border-foreground bg-surface px-5 py-3 text-center text-xl font-bold text-foreground';

function EarIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg
      width={32}
      height={32}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8.5a6 6 0 1 1 12 0c0 6-6 6-6 10a3 3 0 0 1-6 0" />
      <path d="M15 8.5a3 3 0 1 0-6 0" />
      {crossed && <path d="M3 3l18 18" />}
    </svg>
  );
}

/** Done dots are filled, the current dot is a wide pill, upcoming dots are hollow. Shape and fill, not color. */
function ProgressDots({ current }: { current: number }) {
  return (
    <div className="flex flex-col gap-2">
      <ol className="flex items-center gap-2" aria-hidden="true">
        {LING.map((sound, i) => {
          const shape =
            i < current
              ? 'h-3 w-3 rounded-full bg-foreground'
              : i === current
                ? 'h-3 w-8 rounded-full bg-accent'
                : 'h-3 w-3 rounded-full border-2 border-foreground';
          return <li key={sound} className={shape} />;
        })}
      </ol>
      <p className="text-base font-bold text-muted">
        Sound {current + 1} of {LING.length}
      </p>
    </div>
  );
}

export default function ProfilePage() {
  const [step, setStep] = useState<Step>('intro');
  const [answers, setAnswers] = useState<Partial<Record<LingSound, boolean>>>({});
  const [picks, setPicks] = useState<TargetPick[] | null>(null);
  const [showSigns, setShowSigns] = useState(false);

  // Focus moves to the new step's heading so screen reader users hear the new sound.
  // It only moves after the learner acts, never on first load.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);

  // Browser storage is read only here, after the page is on screen.
  useEffect(() => {
    const id = setTimeout(() => {
      const saved = loadProfile();
      if (saved?.source === 'ling6' && saved.ling) {
        setAnswers(saved.ling);
        setPicks(pickTargets(saved));
        setStep('result');
      }
      setShowSigns(loadSettings().showSigns);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    headingRef.current?.focus();
  }, [step]);

  function go(next: Step) {
    moveFocus.current = true;
    setStep(next);
  }

  function answer(index: number, heard: boolean) {
    const next = { ...answers, [LING[index]]: heard };
    setAnswers(next);
    if (index < LING.length - 1) {
      go(index + 1);
      return;
    }
    const profile: HearingProfile = {
      source: 'ling6',
      ling: next as Record<LingSound, boolean>,
      createdAt: new Date().toISOString(),
    };
    saveProfile(profile);
    setPicks(pickTargets(profile));
    go('result');
  }

  function restart() {
    setAnswers({});
    go('intro');
  }

  function toggleSigns(on: boolean) {
    setShowSigns(on);
    saveSettings({ ...loadSettings(), showSigns: on });
  }

  const extras = (
    <>
      <section className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4">
        <label className="flex min-h-12 items-center gap-3 text-lg font-bold">
          <input
            type="checkbox"
            className="h-6 w-6 accent-accent"
            checked={showSigns}
            onChange={(e) => toggleSigns(e.target.checked)}
          />
          Show sign cards
        </label>
        <p className="text-sm text-muted">{COPY.optIn}</p>
      </section>

      {PROFILE_LIMITATIONS.length > 0 && (
        <section className="flex flex-col gap-2 text-sm text-muted">
          <h2 className="text-base font-bold">What this check cannot tell us</h2>
          <ul className="list-disc pl-5">
            {PROFILE_LIMITATIONS.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </section>
      )}
    </>
  );

  const homeLink = (
    <Link href="/" className="inline-flex min-h-12 items-center self-start text-lg underline">
      Home
    </Link>
  );

  if (typeof step === 'number') {
    const sound = LING[step];
    const previous = answers[sound];
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 bg-background p-4 text-foreground">
        <button
          type="button"
          onClick={() => go(step === 0 ? 'intro' : step - 1)}
          className="inline-flex min-h-12 items-center gap-2 self-start rounded-2xl px-1 text-lg font-bold underline"
        >
          <span aria-hidden="true">&larr;</span> Back
        </button>

        <ProgressDots current={step} />

        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-10">
          <h1 ref={headingRef} tabIndex={-1} className="text-7xl font-bold tracking-tight outline-none">
            <span className="sr-only">
              Sound {step + 1} of {LING.length}:{' '}
            </span>
            &ldquo;{sound}&rdquo;
          </h1>
          <p className="text-lg text-muted">Helper: say this sound now</p>
        </div>

        <div className="mt-auto flex flex-col gap-3">
          {[true, false].map((heard) => {
            const chosen = previous === heard;
            return (
              <button
                key={String(heard)}
                type="button"
                aria-pressed={chosen}
                onClick={() => answer(step, heard)}
                className={`flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-surface px-5 py-4 text-xl font-bold text-foreground ${
                  chosen ? 'border-4 border-accent' : 'border-2 border-foreground'
                }`}
              >
                <EarIcon crossed={!heard} />
                {heard ? 'Heard it' : 'Did not hear it'}
                {chosen && (
                  <span className="rounded-full border-2 border-current px-2 text-sm">Your answer</span>
                )}
              </button>
            );
          })}
        </div>
      </main>
    );
  }

  if (step === 'result' && picks) {
    const top = picks[0];
    const recommend = top && top.risk !== 'low';
    return (
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 bg-background p-4 text-foreground">
        {homeLink}
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold outline-none">
          Your sounds
        </h1>

        <ul className="flex flex-col gap-4" aria-label="Sounds to practice">
          {picks.map((p, i) => (
            <li
              key={p.sound}
              className={`flex flex-col gap-3 rounded-2xl bg-surface p-4 ${
                i === 0 && recommend ? 'border-4 border-accent' : 'border border-line'
              }`}
            >
              {i === 0 && recommend && (
                <span className="self-start rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-ink">
                  Recommended for you
                </span>
              )}
              <h2 className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-4xl font-bold">&ldquo;{p.sound}&rdquo;</span>
                <span className="text-lg font-bold">{RISK_LABEL[p.risk]}</span>
              </h2>
              <p>{p.reason}</p>
              <Link href={`/practice?sound=${p.sound}`} className={i === 0 ? PRIMARY : SECONDARY}>
                Practice this sound
              </Link>
            </li>
          ))}
        </ul>

        <button type="button" onClick={restart} className={SECONDARY}>
          Do the check again
        </button>

        {extras}
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 bg-background p-4 text-foreground">
      {homeLink}
      <header className="flex flex-col gap-3">
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold outline-none">
          Hearing check
        </h1>
        <p className="text-lg">
          Have someone say each sound in a normal voice from about 1 metre away, with their mouth covered.
        </p>
        <p className="text-muted">{COPY.notTherapy}</p>
        {/* TODO(ui lane): play the six sounds from the phone as an alternative to a helper. */}
        {/* TODO(tech lane): typed audiogram entry and audiogram photo reading go here. */}
      </header>

      <button type="button" onClick={() => go(0)} className={PRIMARY}>
        Start
      </button>

      {extras}
    </main>
  );
}
