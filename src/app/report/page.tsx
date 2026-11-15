'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeftIcon, CheckCircleIcon } from '@/components/Icons';
import { type AudiogramDraft, AudiogramFields, readAudiogram } from '@/components/AudiogramFields';
import { showRulesPlanNow } from '@/components/planStore';
import { type LocalFile, ReportFiles, useFreeOnLeave } from '@/components/ReportFiles';
import { SendSummary } from '@/components/SendSummary';
import { Button } from '@/components/ui';
import { EXAMPLE_REPORT } from '@/content/tryIt';
import type { AssessmentReport } from '@/lib/types';

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

/** A big tappable toggle. Selected state uses a check icon and a thick border, not only color. */
function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className={`inline-flex min-h-14 items-center gap-2 rounded-2xl px-5 text-xl font-bold transition-[transform,background-color] duration-75 active:scale-[0.98] ${
        on ? 'border-2 border-accent bg-accent-soft text-accent-edge' : 'border border-line bg-surface'
      }`}
    >
      {on && <CheckCircleIcon className="h-5 w-5" />}
      {label}
    </button>
  );
}

const FIELD =
  'w-full rounded-2xl border border-line bg-surface px-4 py-3 text-lg placeholder:text-muted/70 focus:border-accent';

export default function ReportPage() {
  const [sounds, setSounds] = useState<string[]>([]);
  const [otherSounds, setOtherSounds] = useState('');
  const [notes, setNotes] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [interests, setInterests] = useState('');
  const [audiogram, setAudiogram] = useState<AudiogramDraft>({});
  const [problem, setProblem] = useState<string | null>(null);
  const [isExample, setIsExample] = useState(false);
  const [files, setFiles] = useState<LocalFile[]>([]);
  useFreeOnLeave(files);
  const router = useRouter();

  const toggleSound = (sound: string, on: boolean) =>
    setSounds((prev) => (on ? [...prev, sound] : prev.filter((s) => s !== sound)));

  function fillExample() {
    setSounds([...EXAMPLE_REPORT.sounds]);
    setOtherSounds(EXAMPLE_REPORT.otherSounds);
    setNotes(EXAMPLE_REPORT.notes);
    setAgeGroup(EXAMPLE_REPORT.ageGroup);
    setInterests(EXAMPLE_REPORT.interests);
    setAudiogram({});
    setProblem(null);
    setIsExample(true);
  }

  function clearExample() {
    setSounds([]);
    setOtherSounds('');
    setNotes('');
    setAgeGroup(null);
    setInterests('');
    setIsExample(false);
  }

  async function makePlan(event: React.FormEvent) {
    event.preventDefault();
    const allSounds = [...sounds, ...splitList(otherSounds, 8)];
    if (allSounds.length === 0) {
      setProblem('Pick at least one sound, or type one the report lists.');
      return;
    }
    if (ageGroup === null) {
      setProblem('Pick an age group.');
      return;
    }
    const { thresholds, error } = readAudiogram(audiogram);
    if (error) {
      setProblem(error);
      return;
    }
    setProblem(null);
    const report: AssessmentReport = {
      source: 'therapist',
      therapistSounds: allSounds,
      therapistNotes: notes.trim(),
      // The audiogram numbers, when typed, become the hearing profile the plan reads.
      profile: thresholds
        ? { source: 'audiogram', thresholdsDb: thresholds, createdAt: new Date().toISOString() }
        : null,
      baseline: {},
      ageGroup,
      interests: splitList(interests, 5),
      createdAt: new Date().toISOString(),
    };
    // Show the built-in plan at once. The plan page swaps in Claude's plan when it arrives.
    showRulesPlanNow(report);
    router.push('/plan');
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-6 pb-10">
      <Button href="/checks" variant="ghost" block={false} className="self-start">
        <ArrowLeftIcon className="h-5 w-5" />
        Checks
      </Button>
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] leading-tight font-extrabold tracking-tight">Your previous report</h1>
        <p className="text-lg text-muted">
          From a speech therapist or audiologist. Add the file, then copy what it asks you to practice.
          SeeSpeak turns it into a step by step plan.
        </p>
      </header>

      <ReportFiles files={files} onChange={setFiles} />

      {isExample ? (
        // A made up report must never pass for a real one: a thick tan rule, a label and bold dark text.
        <div
          role="status"
          className="flex flex-col gap-1 rounded-r-xl border-l-4 border-violet-edge bg-violet-soft py-3 pr-3 pl-4"
        >
          <p className="text-[13px] font-bold tracking-[0.08em] text-violet-edge uppercase">
            {EXAMPLE_REPORT.badge}
          </p>
          <p className="text-[17px] leading-snug font-bold">{EXAMPLE_REPORT.banner}</p>
          <Button variant="ghost" block={false} className="-ml-2 self-start" onClick={clearExample}>
            {EXAMPLE_REPORT.clear}
          </Button>
        </div>
      ) : (
        <Button variant="ghost" block={false} className="self-start" onClick={fillExample}>
          {EXAMPLE_REPORT.button}
        </Button>
      )}

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
              The app can check &ldquo;s&rdquo;, &ldquo;sh&rdquo;, &ldquo;z&rdquo; and &ldquo;ch&rdquo;. Other
              sounds get a how-to, with no score.
            </span>
          </label>
        </fieldset>

        <AudiogramFields draft={audiogram} onChange={setAudiogram} />

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

        <SendSummary
          sounds={[...sounds, ...splitList(otherSounds, 8)]}
          notes={notes}
          thresholds={readAudiogram(audiogram).thresholds}
          ageGroup={AGE_GROUPS.find((g) => g.value === ageGroup)?.label ?? null}
          interests={splitList(interests, 5)}
        />

        {problem && (
          <p role="alert" className="rounded-2xl bg-miss-soft p-4 text-lg font-bold text-miss-ink">
            {problem}
          </p>
        )}

        <Button type="submit" size="lg">
          Make my plan
        </Button>
      </form>
    </main>
  );
}
