'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { pickTargets } from '@/lib/profile';
import { loadAttempts, loadProfile, progressFor } from '@/lib/store';
import type { Attempt, HearingProfile } from '@/lib/types';
import { CheckCircleIcon, EyeIcon, SpeakIcon } from './Icons';
import { LessonCard } from './LessonCard';

const SECONDARY =
  'flex min-h-14 items-center justify-center rounded-2xl border-2 border-foreground bg-surface px-4 text-lg font-bold';

const STEPS = [
  { Icon: EyeIcon, text: 'See how to make the sound' },
  { Icon: SpeakIcon, text: 'Say the word' },
  { Icon: CheckCircleIcon, text: 'See if the sound was there' },
];

function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="flex flex-col gap-3">
      <h2 id="how-heading" className="text-lg font-bold">
        How it works
      </h2>
      <ol className="grid grid-cols-3 gap-2">
        {STEPS.map(({ Icon, text }, i) => (
          <li
            key={text}
            className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-3 text-center"
          >
            <Icon className="h-7 w-7 text-accent" />
            <span className="text-sm leading-snug">
              <span className="font-bold">{i + 1}.</span> {text}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function FirstVisit() {
  return (
    <>
      <section aria-labelledby="start-heading" className="flex flex-col gap-3">
        <h2 id="start-heading" className="text-2xl font-bold">
          Get started
        </h2>
        <p className="text-lg">A quick listening check picks the sounds to practice first.</p>
        <Link
          href="/profile"
          className="flex min-h-14 flex-col items-center justify-center rounded-2xl bg-accent px-4 py-3 text-center text-accent-ink shadow-sm"
        >
          <span className="text-xl font-bold">Take the hearing check</span>
          <span className="text-sm">Takes about 1 minute</span>
        </Link>
        {/* TODO(#audiogram): add the "Input report" link (typed audiogram entry) here once that issue lands. */}
        <Link
          href="/practice?sound=s"
          className="flex min-h-12 items-center justify-center text-lg underline underline-offset-4"
        >
          Skip for now and try a word
        </Link>
      </section>
      <HowItWorks />
    </>
  );
}

function Lessons({ profile, attempts }: { profile: HearingProfile; attempts: Attempt[] }) {
  const picks = pickTargets(profile);
  return (
    <>
      <section aria-labelledby="lesson-heading" className="flex flex-col gap-3">
        <h2 id="lesson-heading" className="text-2xl font-bold">
          Start a lesson
        </h2>
        {picks.map((pick, i) => (
          <LessonCard
            key={pick.sound}
            pick={pick}
            attempts={progressFor(attempts, pick.sound).attempts}
            primary={i === 0}
          />
        ))}
      </section>
      <nav aria-label="More" className="flex flex-col gap-3">
        <Link href="/progress" className={SECONDARY}>
          See my progress
        </Link>
        <Link href="/profile" className={SECONDARY}>
          Redo the hearing check
        </Link>
      </nav>
    </>
  );
}

type Saved = { profile: HearingProfile | null; attempts: Attempt[] };

/** The part of the home screen that depends on what is saved on this phone. */
export function HomeStart() {
  const [saved, setSaved] = useState<Saved | null>(null);

  // Browser storage is read only here, after the page is on screen.
  useEffect(() => {
    const id = setTimeout(() => {
      setSaved({ profile: loadProfile(), attempts: loadAttempts() });
    }, 0);
    return () => clearTimeout(id);
  }, []);

  if (saved === null) {
    // Neutral placeholder the size of the buttons, so the wrong state never flashes.
    return <div aria-hidden="true" className="min-h-48 rounded-2xl bg-line/30" />;
  }
  if (saved.profile === null) return <FirstVisit />;
  return <Lessons profile={saved.profile} attempts={saved.attempts} />;
}
