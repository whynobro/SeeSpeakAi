'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ASSIGN } from '@/content/therapist';
import { planFromRules } from '@/lib/ai/rulesPlan';
import { levelById } from '@/lib/levels';
import { isTargetSound } from '@/lib/scoring/constants';
import { MicIcon } from './Icons';
import { assignmentFromParams, assignmentStartHref, saveAssignment } from './assignmentStore';
import { savePlan } from './planStore';
import { Button } from './ui';

/**
 * What the learner or a parent sees after opening a speech therapist's practice link.
 * Every value comes from the link, so each one is checked first: only sounds, a level and days we know
 * are ever shown. Nothing is saved until Start is tapped, and nothing is sent anywhere.
 */
export function AssignView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignment = assignmentFromParams((key) => searchParams.get(key));

  if (!assignment) {
    return (
      <>
        <header className="flex flex-col gap-2">
          <h1 className="text-[28px] leading-tight font-extrabold tracking-tight">{ASSIGN.badTitle}</h1>
          <p className="text-[17px] text-muted">{ASSIGN.badBody}</p>
        </header>
        <Button href="/" variant="secondary">
          {ASSIGN.badHome}
        </Button>
      </>
    );
  }

  const level = levelById(assignment.level);

  function start() {
    if (!assignment) return;
    // The built-in plan: it needs no server, so the link works with no key and no connection to our AI.
    const plan = planFromRules({
      source: 'therapist',
      therapistSounds: assignment.sounds,
      therapistNotes: '',
      profile: null,
      baseline: {},
      ageGroup: 'teen',
      interests: [],
      createdAt: new Date().toISOString(),
    });
    savePlan(plan);
    saveAssignment(assignment);
    router.push(assignmentStartHref(assignment));
  }

  return (
    <>
      <h1 className="text-[28px] leading-tight font-extrabold tracking-tight text-balance">{ASSIGN.title}</h1>

      <dl className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="flex flex-col gap-2 px-4 py-4">
          <dt className="text-[15px] text-muted">{ASSIGN.soundsLabel}</dt>
          <dd>
            <ul className="flex flex-col gap-1">
              {assignment.sounds.map((s) => (
                <li key={s} className="flex items-baseline gap-3">
                  <span className="text-[28px] leading-tight font-extrabold">&ldquo;{s}&rdquo;</span>
                  {!isTargetSound(s) && <span className="text-[15px] text-muted">{ASSIGN.noScore}</span>}
                </li>
              ))}
            </ul>
          </dd>
        </div>
        <div className="flex flex-col gap-1 border-t border-line px-4 py-4">
          <dt className="text-[15px] text-muted">{ASSIGN.levelLabel}</dt>
          <dd className="text-[17px] font-bold">{ASSIGN.level(level.number, level.title)}</dd>
        </div>
        {assignment.days !== null && (
          <div className="flex flex-col gap-1 border-t border-line px-4 py-4">
            <dt className="text-[15px] text-muted">{ASSIGN.daysLabel}</dt>
            <dd className="text-[17px] font-bold">{ASSIGN.days(assignment.days)}</dd>
          </div>
        )}
      </dl>

      <Button size="xl" onClick={start}>
        <MicIcon className="h-7 w-7" />
        {ASSIGN.start}
      </Button>

      <p className="text-[15px] leading-relaxed text-muted">
        {ASSIGN.stays} {ASSIGN.notTherapy}
      </p>
    </>
  );
}
