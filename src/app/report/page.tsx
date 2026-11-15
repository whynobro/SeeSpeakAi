'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeftIcon, CheckCircleIcon } from '@/components/Icons';
import { savePlan } from '@/components/planStore';
import { type LocalFile, ReportFiles, useFreeOnLeave } from '@/components/ReportFiles';
import { Button, Card } from '@/components/ui';
import type { AssessmentReport, PracticePlan } from '@/lib/types';

type AgeGroup = AssessmentReport['ageGroup'];

const SCORED_CHOICES = ['s', 'sh', 'z', 'ch'] as const;

const AGE_GROUPS: { value: AgeGroup; label: string }[] = [
  { value: 'child', label: 'Child' },
  { value: 'teen', label: 'Teen' },
  { value: 'adult', label: 'Adult' },
];

/** "r, th / l" -> ["r", "th", "l"] */
function splitList(text: string, max: number): string[] {
  return text
    .split(/[,/\n]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, max);
}

type Status = 'editing' | 'sending' | 'error';

/** A big tappable toggle. Selected state uses a check icon and a thick border, not only color. */
function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className={`inline-flex min-h-14 items-center gap-2 rounded-2xl px-5 text-xl font-bold transition-[transform,box-shadow] duration-75 active:translate-y-1 active:shadow-none ${
        on
          ? 'border-4 border-accent bg-accent-soft text-accent-edge shadow-edge-accent'
          : 'border-2 border-line bg-surface shadow-edge-line'
      }`}
    >
      {on && <CheckCircleIcon className="h-5 w-5" />}
      {label}
    </button>
  );
}

const FIELD =
  'w-full rounded-2xl border-2 border-line bg-surface px-4 py-3 text-lg placeholder:text-muted/70 focus:border-accent';

export default function ReportPage() {
  const [sounds, setSounds] = useState<string[]>([]);
  const [otherSounds, setOtherSounds] = useState('');
  const [notes, setNotes] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [interests, setInterests] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('editing');
  const [files, setFiles] = useState<LocalFile[]>([]);
  useFreeOnLeave(files);
  const router = useRouter();

  const toggleSound = (sound: string, on: boolean) =>
    setSounds((prev) => (on ? [...prev, sound] : prev.filter((s) => s !== sound)));

  async function makePlan(event: React.FormEvent) {
    event.preventDefault();
    if (status === 'sending') return;
    const allSounds = [...sounds, ...splitList(otherSounds, 8)];
    if (allSounds.length === 0) {
      setProblem('Pick at least one sound, or type one the report lists.');
      return;
    }
    if (ageGroup === null) {
      setProblem('Pick an age group.');
      return;
    }
    setProblem(null);
    setStatus('sending');

    const report: AssessmentReport = {
      source: 'therapist',
      therapistSounds: allSounds,
      therapistNotes: notes.trim(),
      profile: null,
      baseline: {},
      ageGroup,
      interests: splitList(interests, 5),
      createdAt: new Date().toISOString(),
    };
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report }),
      });
      if (!res.ok) throw new Error(`Plan request failed: ${res.status}`);
      // Keep the plan on this device and open it on its own page, so a reload keeps it.
      savePlan((await res.json()) as PracticePlan);
      router.push('/plan');
    } catch {
      setStatus('error');
    }
  }

  const sending = status === 'sending';
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-6 pb-10">
      <Button href="/" variant="ghost" block={false} className="self-start">
        <ArrowLeftIcon className="h-5 w-5" />
        Back
      </Button>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Your previous report</h1>
        <p className="text-lg text-muted">
          From a speech therapist or audiologist. Add the file, then copy what it asks you to practice.
          SeeSpeak turns it into a step by step plan.
        </p>
      </header>

      <ReportFiles files={files} onChange={setFiles} />

      <form onSubmit={makePlan} className="flex flex-col gap-7" noValidate>
        <fieldset className="flex flex-col gap-3">
          <legend className="pb-3 text-xl font-bold">Which sounds does it list?</legend>
          <div className="flex flex-wrap gap-3">
            {SCORED_CHOICES.map((s) => (
              <Toggle
                key={s}
                label={`"${s}"`}
                on={sounds.includes(s)}
                onChange={(on) => toggleSound(s, on)}
              />
            ))}
          </div>
          <label className="flex flex-col gap-2 pt-1">
            <span className="text-base font-bold">Other sounds (optional)</span>
            <input
              className={FIELD}
              value={otherSounds}
              onChange={(e) => setOtherSounds(e.target.value)}
              placeholder="r, th"
              maxLength={80}
            />
            <span className="text-base text-muted">
              The app can check &ldquo;s&rdquo; and &ldquo;sh&rdquo;. Other sounds get a how-to, with no
              score.
            </span>
          </label>
        </fieldset>

        <label className="flex flex-col gap-2">
          <span className="text-xl font-bold">Goals or notes (optional)</span>
          <textarea
            className={`${FIELD} min-h-28`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Work on s at the end of words"
            maxLength={2000}
          />
          <span className="text-base text-muted">Leave out names, yours and your therapist&rsquo;s.</span>
        </label>

        <fieldset className="flex flex-col gap-3">
          <legend className="pb-3 text-xl font-bold">Age group</legend>
          <div className="flex flex-wrap gap-3">
            {AGE_GROUPS.map((g) => (
              <Toggle
                key={g.value}
                label={g.label}
                on={ageGroup === g.value}
                onChange={(on) => setAgeGroup(on ? g.value : null)}
              />
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-2">
          <span className="text-xl font-bold">Things you like (optional)</span>
          <input
            className={FIELD}
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="soccer, cooking"
            maxLength={120}
          />
          <span className="text-base text-muted">Used to pick practice words you care about.</span>
        </label>

        <Card tone="accent" className="flex flex-col gap-1">
          <p className="text-base font-bold text-accent-edge">Before you send</p>
          <p className="text-base leading-relaxed">
            Tapping the button sends the sounds, notes, age group and interests to the SeeSpeak server once,
            to make your plan. No name and no voice. Nothing is saved there.
          </p>
        </Card>

        {problem && (
          <p role="alert" className="rounded-2xl bg-miss-soft p-4 text-lg font-bold text-miss-ink">
            {problem}
          </p>
        )}
        {status === 'error' && (
          <p role="alert" className="rounded-2xl bg-miss-soft p-4 text-lg font-bold text-miss-ink">
            The plan could not be made. Check your connection and try again.
          </p>
        )}

        <Button type="submit" size="lg" disabled={sending}>
          {sending ? 'Making your plan…' : 'Make my plan'}
        </Button>
      </form>
    </main>
  );
}
