'use client';

import Link from 'next/link';
import { type ReactNode, useEffect, useState } from 'react';
import { pickTargets } from '@/lib/profile';
import { loadAttempts, loadProfile, progressFor } from '@/lib/store';
import type { Attempt, HearingProfile } from '@/lib/types';
import { ArrowRightIcon, CheckCircleIcon, EarIcon, EyeIcon, MicIcon, SpeakIcon, UploadIcon } from './Icons';
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
          <li
            key={text}
            className="flex items-center gap-4 motion-safe:animate-rise"
            style={{ animationDelay: `${700 + i * 90}ms` }}
          >
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

/** A whole-card link for one way to start. The card presses down like a button. */
function StartChoice({
  href,
  title,
  detail,
  icon,
  tone,
  order,
}: {
  href: string;
  title: string;
  detail: string;
  icon: ReactNode;
  tone: 'accent' | 'violet';
  /** Position in the list: cards arrive one after another. */
  order: number;
}) {
  return (
    <Link
      href={href}
      style={{ animationDelay: `${350 + order * 90}ms` }}
      className="group flex items-center gap-4 rounded-3xl border-2 border-line bg-surface p-4 shadow-clay transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-0.5 hover:border-accent active:translate-y-1 active:shadow-none motion-safe:animate-rise"
    >
      <IconTile tone={tone}>{icon}</IconTile>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-lg leading-snug font-bold">{title}</span>
        <span className="text-base text-muted">{detail}</span>
      </span>
      <ArrowRightIcon className="h-6 w-6 shrink-0 text-accent-edge transition-transform duration-200 group-hover:translate-x-1" />
    </Link>
  );
}

function FirstVisit() {
  return (
    <>
      <section aria-labelledby="start-heading" className="flex flex-col gap-4">
        <h2
          id="start-heading"
          className="text-xl font-bold motion-safe:animate-rise"
          style={{ animationDelay: '280ms' }}
        >
          How do you want to start?
        </h2>
        <StartChoice
          href="/profile"
          order={0}
          tone="accent"
          title="Hearing check"
          detail="Which sounds reach you, about 1 minute"
          icon={<EarIcon className="h-7 w-7" />}
        />
        <StartChoice
          href="/speech-check"
          order={1}
          tone="accent"
          title="Speech check"
          detail="Say 6 words, about 1 minute"
          icon={<MicIcon className="h-7 w-7" />}
        />
        <StartChoice
          href="/report"
          order={2}
          tone="violet"
          title="Upload a previous report"
          detail="From a speech therapist or audiologist"
          icon={<UploadIcon className="h-7 w-7" />}
        />
        {/* TODO(#4): add the "Enter audiogram" choice here once typed audiogram entry lands. */}
        <Button
          href="/practice?sound=s"
          variant="ghost"
          block={false}
          className="self-start motion-safe:animate-rise motion-safe:[animation-delay:650ms]"
        >
          Skip and try a word
        </Button>
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
