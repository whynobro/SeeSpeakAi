'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeftIcon, CheckCircleIcon, MicIcon } from '@/components/Icons';
import { PlanView } from '@/components/PlanView';
import { SoundMeter } from '@/components/SoundMeter';
import { Button, Card, IconTile } from '@/components/ui';
import { wordsFor } from '@/content/words';
import { useSoundMeter } from '@/hooks/useSoundMeter';
import { scoreAttempt } from '@/lib/scoring';
import { loadProfile, loadSettings, saveAttempt } from '@/lib/store';
import type { AssessmentReport, PracticePlan, PracticeWord, TargetSound, Verdict } from '@/lib/types';

const PER_SOUND = 3;
/** The starting check covers "s" and "sh" only: six short words. "z" and "ch" are practiced from a plan. */
const SOUNDS: TargetSound[] = ['s', 'sh'];

/** 3 "s" words and 3 "sh" words, taking turns, so the check is not one long run of the same sound. */
function checkWords(): PracticeWord[] {
  const s = wordsFor('s', PER_SOUND);
  const sh = wordsFor('sh', PER_SOUND);
  return s.flatMap((word, i) => (sh[i] ? [word, sh[i]] : [word]));
}

type AgeGroup = AssessmentReport['ageGroup'];
type Phase = 'intro' | 'words' | 'results' | 'sending' | 'plan' | 'error';
type Result = { target: TargetSound; verdict: Verdict };

function summary(results: Result[], sound: TargetSound) {
  const mine = results.filter((r) => r.target === sound);
  const hits = mine.filter((r) => r.verdict === 'hit').length;
  return { hits, total: mine.length };
}

export default function SpeechCheckPage() {
  const meter = useSoundMeter();
  const [words, setWords] = useState<PracticeWord[]>([]);
  const [phase, setPhase] = useState<Phase>('intro');
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [gotIt, setGotIt] = useState(false);
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [plan, setPlan] = useState<PracticePlan | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    queueMicrotask(() => setWords(checkWords()));
  }, []);

  // Each new screen starts at the top with focus on its heading.
  useEffect(() => {
    headingRef.current?.closest('main')?.scrollIntoView({ block: 'start' });
    headingRef.current?.focus({ preventScroll: true });
  }, [phase]);

  const word = words[index] ?? null;
  const listening = meter.status === 'listening';

  function onDone() {
    if (!word) return;
    const score = scoreAttempt(meter.stop(), word);
    setResults((prev) => [...prev, { target: word.target, verdict: score.verdict }]);
    saveAttempt({
      id: crypto.randomUUID(),
      wordId: word.id,
      target: word.target,
      stage: 'find',
      createdAt: new Date().toISOString(),
      score,
      channels: loadSettings().channels,
    });
    // No hit or miss during the check: every word gets the same "Got it", so it does not feel like a test.
    setGotIt(true);
  }

  function onNext() {
    setGotIt(false);
    if (index + 1 >= words.length) setPhase('results');
    else setIndex(index + 1);
  }

  async function makePlan() {
    if (ageGroup === null) {
      setProblem('Pick an age group.');
      return;
    }
    setProblem(null);
    setPhase('sending');
    const baseline: Partial<Record<TargetSound, number>> = {};
    for (const sound of SOUNDS) {
      const { hits, total } = summary(results, sound);
      if (total > 0) baseline[sound] = hits / total;
    }
    const report: AssessmentReport = {
      source: 'in-app-test',
      therapistSounds: [],
      therapistNotes: '',
      profile: loadProfile(),
      baseline,
      ageGroup,
      interests: [],
      createdAt: new Date().toISOString(),
    };
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report }),
      });
      if (!res.ok) throw new Error(`Plan request failed: ${res.status}`);
      setPlan((await res.json()) as PracticePlan);
      setPhase('plan');
    } catch {
      setPhase('error');
    }
  }

  const heading = (text: string) => (
    <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-extrabold tracking-tight outline-none">
      {text}
    </h1>
  );

  if (phase === 'plan' && plan) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-6 pb-10">
        {heading('Your practice plan')}
        <PlanView plan={plan} />
      </main>
    );
  }

  if (phase === 'results' || phase === 'sending' || phase === 'error') {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-6 pb-10">
        {heading('Here is where you are starting')}
        <ul className="flex flex-col gap-4">
          {SOUNDS.map((sound) => {
            const { hits, total } = summary(results, sound);
            return (
              <Card
                as="li"
                key={sound}
                className="flex items-center gap-4 motion-safe:animate-rise"
                style={{ animationDelay: `${150 + SOUNDS.indexOf(sound) * 120}ms` }}
              >
                <IconTile size="lg" className="text-2xl font-extrabold">
                  {sound}
                </IconTile>
                <p className="text-lg leading-snug">
                  The &ldquo;{sound}&rdquo; sound was there in{' '}
                  <span className="font-bold">
                    {hits} of {total}
                  </span>{' '}
                  words.
                </p>
              </Card>
            );
          })}
        </ul>
        <p className="text-base text-muted">
          A first look, not a test score. It only shows where your practice plan starts.
        </p>

        <fieldset className="flex flex-col gap-3">
          <legend className="pb-3 text-xl font-bold">Age group</legend>
          <div className="flex flex-wrap gap-3">
            {(['child', 'teen', 'adult'] as const).map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={ageGroup === g}
                onClick={() => setAgeGroup(g)}
                className={`inline-flex min-h-14 items-center gap-2 rounded-2xl px-5 text-xl font-bold capitalize transition-[transform,box-shadow] duration-75 active:translate-y-1 active:shadow-none ${
                  ageGroup === g
                    ? 'border-4 border-accent bg-accent-soft text-accent-edge shadow-edge-accent'
                    : 'border-2 border-line bg-surface shadow-edge-line'
                }`}
              >
                {ageGroup === g && <CheckCircleIcon className="h-5 w-5" />}
                {g}
              </button>
            ))}
          </div>
        </fieldset>

        <Card tone="accent" className="flex flex-col gap-1">
          <p className="text-base font-bold text-accent-edge">Before you send</p>
          <p className="text-base leading-relaxed">
            Tapping the button sends these numbers, your hearing check answers and your age group to the
            SeeSpeak server once, to make your plan. No name and no voice. Nothing is saved there.
          </p>
        </Card>
        {problem && (
          <p role="alert" className="rounded-2xl bg-miss-soft p-4 text-lg font-bold text-miss-ink">
            {problem}
          </p>
        )}
        {phase === 'error' && (
          <p role="alert" className="rounded-2xl bg-miss-soft p-4 text-lg font-bold text-miss-ink">
            The plan could not be made. Check your connection and try again.
          </p>
        )}
        <Button size="lg" onClick={makePlan} disabled={phase === 'sending'}>
          {phase === 'sending' ? 'Making your plan…' : 'Make my plan'}
        </Button>
      </main>
    );
  }

  if (phase === 'words' && word) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-6 pb-10">
        <p className="text-base font-bold text-muted">
          Word {index + 1} of {words.length}
        </p>
        {heading('Say this word')}
        <Card
          key={word.id}
          className="flex min-h-40 items-center justify-center motion-safe:animate-spring-in"
        >
          <p className="text-6xl font-extrabold tracking-tight">{word.text}</p>
        </Card>
        <SoundMeter reading={meter.reading} status={meter.status} />
        {meter.status === 'error' && (
          <p role="alert" className="rounded-2xl bg-miss-soft p-4 text-lg font-bold text-miss-ink">
            {meter.error ?? 'The microphone could not be started.'}
          </p>
        )}
        {gotIt ? (
          <div className="flex flex-col gap-4">
            <div className="motion-safe:animate-spring-in">
              <p
                role="status"
                className="flex items-center gap-3 rounded-2xl bg-hit-soft p-4 text-xl font-bold text-hit-strong motion-safe:animate-result-pulse"
              >
                <CheckCircleIcon className="h-7 w-7" />
                Got it
              </p>
            </div>
            <Button size="lg" onClick={onNext}>
              {index + 1 >= words.length ? 'See where I am starting' : 'Next word'}
            </Button>
          </div>
        ) : listening ? (
          <div className="relative">
            {/* A ring pulses out from the button while the mic listens, so it is clear it is recording. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-2xl border-4 border-accent-edge motion-safe:animate-listen-ring"
            />
            <Button size="xl" onClick={onDone}>
              Listening. Tap when done
            </Button>
          </div>
        ) : (
          <Button size="xl" onClick={() => meter.start()} disabled={meter.status === 'starting'}>
            <MicIcon className="h-7 w-7" />
            {meter.status === 'starting' ? 'Starting…' : 'Start'}
          </Button>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-6 pb-10">
      <Button href="/" variant="ghost" block={false} className="self-start">
        <ArrowLeftIcon className="h-5 w-5" />
        Back
      </Button>
      {heading('Speech check')}
      <p className="text-lg leading-relaxed">
        Say {PER_SOUND * SOUNDS.length} short words, one at a time. Tap Start, say the word, then tap Done.
      </p>
      <ul className="flex flex-col gap-3 text-lg">
        <li className="flex items-center gap-3">
          <CheckCircleIcon className="h-6 w-6 shrink-0 text-accent-edge" />
          About 1 minute
        </li>
        <li className="flex items-center gap-3">
          <CheckCircleIcon className="h-6 w-6 shrink-0 text-accent-edge" />
          No right or wrong while you go
        </li>
        <li className="flex items-center gap-3">
          <CheckCircleIcon className="h-6 w-6 shrink-0 text-accent-edge" />
          Your voice is checked on this device and never saved
        </li>
      </ul>
      <Button size="lg" onClick={() => setPhase('words')} disabled={words.length === 0}>
        Start the speech check
      </Button>
    </main>
  );
}
