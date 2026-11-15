'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { pickTargets } from '@/lib/profile';
import { loadAttempts, loadProfile, progressFor } from '@/lib/store';
import type { Attempt, HearingProfile } from '@/lib/types';
import { CheckCircleIcon, ChevronRightIcon, EarIcon, EyeIcon, MicIcon, SpeakIcon, UploadIcon } from './Icons';
import { LessonCard } from './LessonCard';
import { Button, IconTile } from './ui';
import { loadPlan, savePlan } from './planStore';
import { TRY_IT } from '@/content/tryIt';
import { planFromRules } from '@/lib/ai/rulesPlan';

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

/** One row in the grouped start list. The whole row is the tap target. */
function StartRow({
  href,
  title,
  detail,
  icon,
}: {
  href: string;
  title: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <li className="border-t border-line first:border-t-0">
      <Link
        href={href}
        className="group flex min-h-20 items-center gap-4 px-4 py-4 transition-colors duration-150 hover:bg-accent-soft/60 active:bg-accent-soft"
      >
        <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center">
          {icon}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-lg leading-snug font-bold">{title}</span>
          <span className="text-base text-muted">{detail}</span>
        </span>
        <ChevronRightIcon className="h-5 w-5 shrink-0 text-muted transition-transform duration-150 group-hover:translate-x-0.5" />
      </Link>
    </li>
  );
}

/** One tap into practice with "s" then "sh" words. No report and no check, and no network. */
function TryItNow() {
  const router = useRouter();
  function go() {
    let plan = loadPlan();
    if (!plan || !plan.steps.some((st) => st.scored && st.sound === 's')) {
      plan = planFromRules({
        source: 'therapist',
        therapistSounds: ['s', 'sh'],
        therapistNotes: '',
        profile: null,
        baseline: {},
        ageGroup: 'teen',
        interests: [],
        createdAt: new Date().toISOString(),
      });
      savePlan(plan);
    }
    const step = plan.steps.findIndex((st) => st.scored && st.sound === 's');
    router.push(`/practice?sound=s&plan=${encodeURIComponent(plan.id)}&step=${step}`);
  }
  return (
    <section aria-label={TRY_IT.button} className="flex flex-col gap-2">
      <Button size="xl" onClick={go}>
        <MicIcon className="h-7 w-7" />
        {TRY_IT.button}
      </Button>
      <p className="text-base text-muted">{TRY_IT.detail}</p>
    </section>
  );
}

function FirstVisit() {
  return (
    <>
      <TryItNow />
      <section aria-labelledby="start-heading" className="flex flex-col gap-3">
        <h2 id="start-heading" className="text-xl font-bold">
          {TRY_IT.personalTitle}
        </h2>
        {/* One grouped list, so the three ways in read as a single choice. Rows clip to the list's corners. */}
        <ul className="overflow-hidden rounded-2xl border border-line bg-surface motion-safe:animate-rise">
          <StartRow
            href="/profile"
            title="Hearing check"
            detail="Which sounds reach you · about 1 minute"
            icon={<EarIcon className="h-6 w-6 text-accent-edge" />}
          />
          <StartRow
            href="/speech-check"
            title="Speech check"
            detail="Say 18 words · about 2 to 3 minutes"
            icon={<MicIcon className="h-6 w-6 text-accent-edge" />}
          />
          <StartRow
            href="/listening-check"
            title="Listening check"
            detail="Tell sounds and words apart · about 2 minutes"
            icon={<EarIcon className="h-6 w-6 text-accent-edge" />}
          />
          <StartRow
            href="/report"
            title="Upload a previous report"
            detail="From a speech therapist or audiologist"
            icon={<UploadIcon className="h-6 w-6 text-violet-edge" />}
          />
        </ul>
        {/* TODO(#4): add the "Enter audiogram" choice here once typed audiogram entry lands. */}
        <Button href="/practice?sound=s" variant="ghost" block={false} className="self-start">
          Skip and try a word
        </Button>
      </section>
      <HowItWorks />
    </>
  );
}

/** Gray rows the shape of the start list, shown for the moment before this phone's saved data is read. */
function StartSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      <div className="h-7 w-56 rounded-lg bg-line motion-safe:animate-pulse" />
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex min-h-20 items-center gap-4 border-t border-line px-4 py-4 first:border-t-0"
          >
            <div className="h-6 w-6 rounded-md bg-line motion-safe:animate-pulse" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-2/5 rounded bg-line motion-safe:animate-pulse" />
              <div className="h-3.5 w-3/5 rounded bg-line/70 motion-safe:animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
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
    // A skeleton the shape of the start list, so the wrong state never flashes.
    return <StartSkeleton />;
  }
  if (saved.profile === null) return <FirstVisit />;
  return <Lessons profile={saved.profile} attempts={saved.attempts} />;
}
