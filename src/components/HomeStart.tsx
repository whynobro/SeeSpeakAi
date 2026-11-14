'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { pickTargets } from '@/lib/profile';
import { loadAttempts, loadProfile, progressFor } from '@/lib/store';
import type { Attempt, HearingProfile } from '@/lib/types';
import { ArrowRightIcon, CheckCircleIcon, EarIcon, EyeIcon, SpeakIcon } from './Icons';
import { LessonCard } from './LessonCard';
import { Button, Card, IconTile } from './ui';

const STEPS = [
  { Icon: EyeIcon, text: 'See how to make the sound' },
  { Icon: SpeakIcon, text: 'Say the word' },
  { Icon: CheckCircleIcon, text: 'See if the sound was there' },
];

function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="flex flex-col gap-4">
      <h2 id="how-heading" className="text-xl font-bold">
        How it works
      </h2>
      <ol className="flex flex-col gap-3">
        {STEPS.map(({ Icon, text }, i) => (
          <li key={text} className="flex items-center gap-4">
            <IconTile tone="soft" size="sm">
              <Icon className="h-5 w-5" />
            </IconTile>
            <span className="text-lg">
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
      <section aria-labelledby="start-heading" className="flex flex-col gap-4">
        <h2 id="start-heading" className="text-xl font-bold">
          Get started
        </h2>
        <Link
          href="/profile"
          className="flex items-center gap-4 rounded-3xl border-2 border-line bg-surface p-4 shadow-clay transition-[transform,box-shadow] duration-75 active:translate-y-1 active:shadow-none"
        >
          <IconTile>
            <EarIcon className="h-7 w-7" />
          </IconTile>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-lg font-bold">Take the hearing check</span>
            <span className="text-base text-muted">About 1 minute</span>
          </span>
          <ArrowRightIcon className="h-6 w-6 shrink-0 text-accent-edge" />
        </Link>
        {/* TODO(#audiogram): add the "Enter audiogram" card (typed audiogram entry) here once that issue lands. */}
        <div className="flex flex-col gap-2 pt-2">
          <Button href="/profile" size="lg">
            Get started
          </Button>
          <Button href="/practice?sound=s" variant="ghost" block={false} className="self-center">
            Skip for now
          </Button>
        </div>
      </section>
      <HowItWorks />
    </>
  );
}

function Lessons({ profile, attempts }: { profile: HearingProfile; attempts: Attempt[] }) {
  const picks = pickTargets(profile);
  return (
    <>
      <section aria-labelledby="lesson-heading" className="flex flex-col gap-4">
        <h2 id="lesson-heading" className="text-xl font-bold">
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
      <nav aria-label="More" className="flex flex-col gap-4">
        <Button href="/progress" variant="secondary">
          See my progress
        </Button>
        <Button href="/profile" variant="secondary">
          Redo the hearing check
        </Button>
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
    return (
      <Card aria-hidden="true" className="min-h-48 opacity-50">
        {null}
      </Card>
    );
  }
  if (saved.profile === null) return <FirstVisit />;
  return <Lessons profile={saved.profile} attempts={saved.attempts} />;
}
