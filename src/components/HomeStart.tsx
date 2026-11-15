'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { pickTargets } from '@/lib/profile';
import { loadAttempts, loadProfile, progressFor } from '@/lib/store';
import type { Attempt, HearingProfile } from '@/lib/types';
import { CheckList } from './CheckList';
import { CheckCircleIcon, EyeIcon, SpeakIcon } from './Icons';
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

export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="flex flex-col gap-4">
      <h2 id="how-heading" className="text-[20px] font-bold">
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

/** One tap into practice with "s" then "sh" words. No report and no check, and no network. Used by the home hero. */
export function useTryItNow() {
  const router = useRouter();
  return function go() {
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
  };
}

function FirstVisit() {
  return (
    <>
      {/* "Try it now" lives in the kingfisher hero above. */}
      <section aria-labelledby="start-heading" className="flex flex-col gap-3">
        <h2 id="start-heading" className="text-[24px] font-extrabold tracking-tight">
          {TRY_IT.personalTitle}
        </h2>
        <p className="text-[15px] text-muted">It sets which sounds and words your practice starts with.</p>
        {/* TODO(#4): add the "Enter audiogram" choice to CheckList once typed audiogram entry lands. */}
        <CheckList />
        <Button href="/practice?sound=s" variant="ghost" block={false} className="self-start">
          Skip and try a word
        </Button>
      </section>
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
        <h2 id="lesson-heading" className="text-[20px] font-bold">
          Your next practice
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
