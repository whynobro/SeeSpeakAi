'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeftIcon, EarIcon, StarIcon } from '@/components/Icons';
import { Button, Card, IconTile } from '@/components/ui';
import { COPY } from '@/content/copy';
import { HEARING_CHECK } from '@/content/hearingCheck';
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

type Answers = Partial<Record<LingSound, boolean>>;

function isComplete(answers: Answers): answers is Record<LingSound, boolean> {
  return LING.every((s) => typeof answers[s] === 'boolean');
}

/** Done dots are filled, the current dot is a wide pill, upcoming dots are hollow. Shape and fill, not color. */
function ProgressDots({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <ol className="flex items-center gap-2" aria-hidden="true">
        {LING.map((sound, i) => {
          const shape =
            i < current
              ? 'h-4 w-4 rounded-full bg-accent-edge'
              : i === current
                ? 'h-4 w-10 rounded-full bg-accent'
                : 'h-4 w-4 rounded-full border-2 border-muted bg-surface';
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
  const [answers, setAnswers] = useState<Answers>({});
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
    const next: Answers = { ...answers, [LING[index]]: heard };
    setAnswers(next);
    if (index < LING.length - 1) {
      go(index + 1);
      return;
    }
    // The last answer saves the whole check, so a changed answer is kept after a refresh too (issue #24).
    if (isComplete(next)) {
      saveProfile({ source: 'ling6', ling: next, createdAt: new Date().toISOString() });
    }
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

  // The result is worked out from the current answers on every render, never kept separately, so it can
  // never show an old result (issue #24).
  const picks: TargetPick[] | null = isComplete(answers)
    ? pickTargets({ source: 'ling6', ling: answers, createdAt: '' } satisfies HearingProfile)
    : null;

  const extras = (
    <>
      <Card as="section" className="flex flex-col gap-2">
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
      </Card>

      {PROFILE_LIMITATIONS.length > 0 && (
        <section className="flex flex-col gap-2 text-sm text-muted">
          <h2 className="text-base font-bold text-foreground">What this check cannot tell us</h2>
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
    <Button href="/checks" variant="ghost" block={false} className="self-start">
      <ArrowLeftIcon className="h-5 w-5" />
      Checks
    </Button>
  );

  if (typeof step === 'number') {
    const sound = LING[step];
    const previous = answers[sound];
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pt-4 pb-8">
        <Button
          variant="ghost"
          block={false}
          onClick={() => go(step === 0 ? 'intro' : step - 1)}
          className="self-start"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back
        </Button>

        <ProgressDots current={step} />

        <Card className="flex flex-col items-center gap-2 py-10">
          <h1 ref={headingRef} tabIndex={-1} className="text-8xl font-extrabold tracking-tight outline-none">
            <span className="sr-only">
              Sound {step + 1} of {LING.length}:{' '}
            </span>
            &ldquo;{sound}&rdquo;
          </h1>
          <p className="text-lg font-bold text-muted">Helper: say this sound now</p>
        </Card>

        <div className="mt-auto flex flex-col gap-4">
          {[true, false].map((heard) => {
            const chosen = previous === heard;
            return (
              <button
                key={String(heard)}
                type="button"
                aria-pressed={chosen}
                onClick={() => answer(step, heard)}
                className={`flex min-h-20 w-full items-center gap-4 rounded-2xl bg-surface px-4 py-3 text-left text-xl font-bold text-foreground transition-[transform,background-color] duration-75 active:scale-[0.98] ${
                  chosen ? 'border-2 border-accent' : 'border border-line'
                }`}
              >
                <IconTile tone={heard ? 'accent' : 'violet-soft'}>
                  <EarIcon crossed={!heard} className="h-8 w-8" />
                </IconTile>
                <span className="flex-1">{heard ? 'Heard it' : 'Did not hear it'}</span>
                {chosen && (
                  <span className="rounded-full bg-accent-soft px-3 py-1 text-sm text-accent-edge">
                    Your answer
                  </span>
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
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-4 pb-10">
        {homeLink}
        <header className="flex flex-col gap-2">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-[28px] leading-tight font-extrabold tracking-tight outline-none"
          >
            Your sounds
          </h1>
          <p className="text-base text-muted">
            Your result uses the &ldquo;s&rdquo; and &ldquo;sh&rdquo; answers. The other four check that the
            sound reaches you at all.
          </p>
        </header>

        <ul className="flex flex-col gap-6" aria-label="Sounds to practice">
          {picks.map((p, i) => {
            const first = i === 0 && recommend;
            return (
              <Card as="li" key={p.sound} highlight={Boolean(first)} className="flex flex-col gap-4">
                {first && (
                  <span className="inline-flex w-fit items-center gap-1 rounded-full whitespace-nowrap bg-violet-soft px-3 py-1 text-sm font-bold text-violet-edge">
                    <StarIcon className="h-4 w-4" />
                    Recommended for you
                  </span>
                )}
                <h2 className="flex items-center gap-4">
                  <IconTile tone={first ? 'accent' : 'soft'} size="lg" className="text-3xl font-extrabold">
                    {p.sound}
                  </IconTile>
                  <span className="flex flex-col">
                    <span className="text-3xl font-extrabold">&ldquo;{p.sound}&rdquo;</span>
                    <span className="text-lg font-bold">{RISK_LABEL[p.risk]}</span>
                  </span>
                </h2>
                <p className="text-base">{p.reason}</p>
                <Button href={`/practice?sound=${p.sound}`} variant={i === 0 ? 'primary' : 'secondary'}>
                  Practice this sound
                </Button>
              </Card>
            );
          })}
        </ul>

        <Button variant="secondary" onClick={restart}>
          Do the check again
        </Button>

        {extras}
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-4 pb-10">
      {homeLink}
      <header className="flex flex-col gap-4">
        <IconTile size="lg">
          <EarIcon className="h-9 w-9" />
        </IconTile>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-[28px] leading-tight font-extrabold tracking-tight outline-none"
        >
          {HEARING_CHECK.title}
        </h1>
        <p className="text-lg">{HEARING_CHECK.intro}</p>
      </header>

      <Card as="section" aria-labelledby="setup-heading" className="flex flex-col gap-3">
        <h2 id="setup-heading" className="text-xl font-bold">
          Before you start
        </h2>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-lg">
          <li>{HEARING_CHECK.setupNoHeadphones[0]}</li>
          <li>{HEARING_CHECK.setupHelper}</li>
        </ul>
        {/* TODO(ui lane): play the six sounds from the phone; then show HEARING_CHECK.setupHeadphones here. */}
      </Card>

      <Button size="lg" onClick={() => go(0)}>
        Start
      </Button>

      <Card as="section" tone="violet" aria-labelledby="devices-heading" className="flex flex-col gap-2">
        <h2 id="devices-heading" className="text-lg font-bold">
          {HEARING_CHECK.devicesQuestion}
        </h2>
        <p className="text-base">{HEARING_CHECK.bothExplain}</p>
        {/* TODO(ui lane): the hearing-aid on/off choice (withDevices / withoutDevices) is not built yet. */}
      </Card>

      <p className="text-sm text-muted">{COPY.notTherapy}</p>
      {/* TODO(tech lane): typed audiogram entry and audiogram photo reading go here. */}

      {extras}
    </main>
  );
}
