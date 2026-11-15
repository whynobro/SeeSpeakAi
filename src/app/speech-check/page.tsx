'use client';

import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { GoalsBox } from '@/components/GoalsBox';
import { ArrowLeftIcon, CheckCircleIcon, EarIcon, MicIcon } from '@/components/Icons';
import { showRulesPlanNow } from '@/components/planStore';
import { SoundMeter } from '@/components/SoundMeter';
import { Button, Card, IconTile } from '@/components/ui';
import {
  AGE_LABELS,
  CHECK_COPY,
  CHECK_POSITIONS,
  CHECK_SOUNDS,
  type CheckAge,
  TRY_ALONE,
  checkWordsFor,
} from '@/content/checks';
import { useSoundMeter } from '@/hooks/useSoundMeter';
import {
  type SpeakingResult,
  type SpotKey,
  type SpotLevel,
  type SpotSummary,
  baselineOf,
  orderCheckWords,
  spotKey,
  spotsToTryAlone,
  startingSpot,
  summarizeSpeaking,
} from '@/lib/checks';
import { removeNames } from '@/lib/privacy';
import { scoreAttempt } from '@/lib/scoring';
import { loadProfile, loadSettings, saveAttempt, saveGoals } from '@/lib/store';
import type { AssessmentReport, LearnerGoals, PracticeWord, WordPosition } from '@/lib/types';

/** Offer a break after this many words (halfway through 18). */
const BREAK_AFTER = 9;
/** Tries for each "try it on its own" syllable. */
const ALONE_TRIES = 2;

type Phase = 'intro' | 'words' | 'break' | 'alone' | 'results' | 'sending' | 'error';

const SPOT_WORDS: Record<WordPosition, string> = {
  start: 'at the start of words',
  middle: 'in the middle of words',
  end: 'at the end of words',
};

const LEVEL_STYLE: Record<SpotLevel, { icon: string; className: string }> = {
  got: { icon: '✓', className: 'bg-hit text-hit-ink' },
  almost: { icon: '~', className: 'bg-close text-close-ink' },
  'not-yet': { icon: '·', className: 'border-2 border-miss-ink bg-surface text-miss-ink' },
};

/** Start, then "Listening. Tap when done", using the live meter. Calls onDone with the score. */
function RecordButton({
  listening,
  starting,
  onStart,
  onDone,
}: {
  listening: boolean;
  starting: boolean;
  onStart: () => void;
  onDone: () => void;
}) {
  if (listening) {
    return (
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-accent-edge motion-safe:animate-listen-ring"
        />
        <Button size="xl" onClick={onDone}>
          Listening. Tap when done
        </Button>
      </div>
    );
  }
  return (
    <Button size="xl" onClick={onStart} disabled={starting}>
      <MicIcon className="h-7 w-7" />
      {starting ? 'Starting…' : 'Start'}
    </Button>
  );
}

function SpotRows({ summary, start }: { summary: SpotSummary[]; start: SpotSummary | null }) {
  return (
    <ul className="flex flex-col gap-4">
      {CHECK_SOUNDS.map((sound) => (
        <Card as="li" key={sound} className="flex flex-col gap-3 motion-safe:animate-rise">
          <p className="text-xl font-extrabold">The &ldquo;{sound}&rdquo; sound</p>
          <ul className="flex flex-col gap-2">
            {CHECK_POSITIONS.map((position) => {
              const spot = summary.find((s) => s.sound === sound && s.position === position)!;
              const style = LEVEL_STYLE[spot.level];
              const isStart = start?.sound === sound && start.position === position;
              return (
                <li key={position} className="flex min-h-11 items-center gap-3">
                  <span className="w-20 text-base text-muted capitalize">{position}</span>
                  <span
                    aria-hidden="true"
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-lg font-extrabold ${style.className}`}
                  >
                    {style.icon}
                  </span>
                  <span className="text-lg font-bold">
                    {spot.said === 0 ? 'Skipped' : CHECK_COPY.levelLabels[spot.level]}
                    {isStart && (
                      <span className="font-normal text-muted">, {CHECK_COPY.startHere.toLowerCase()}</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      ))}
    </ul>
  );
}

export default function SpeechCheckPage() {
  const meter = useSoundMeter();
  const router = useRouter();
  const [age, setAge] = useState<CheckAge | null>(null);
  const [words, setWords] = useState<PracticeWord[]>([]);
  const [phase, setPhase] = useState<Phase>('intro');
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<SpeakingResult[]>([]);
  const [gotIt, setGotIt] = useState(false);
  const [aloneQueue, setAloneQueue] = useState<SpotSummary[]>([]);
  const [aloneIndex, setAloneIndex] = useState(0);
  const [aloneTry, setAloneTry] = useState(0);
  const [aloneHit, setAloneHit] = useState<Partial<Record<SpotKey, boolean>>>({});
  const [goals, setGoals] = useState<LearnerGoals>({ chips: [], text: '' });
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Each new screen starts at the top with focus on its heading.
  useEffect(() => {
    headingRef.current?.closest('main')?.scrollIntoView({ block: 'start' });
    headingRef.current?.focus({ preventScroll: true });
  }, [phase, aloneIndex]);

  const word = words[index] ?? null;
  const listening = meter.status === 'listening';
  const starting = meter.status === 'starting';
  const summary = summarizeSpeaking(results);
  const start = startingSpot(summary, aloneHit);

  function begin(chosen: CheckAge) {
    setAge(chosen);
    setWords(orderCheckWords(checkWordsFor(chosen)));
    setIndex(0);
    setResults([]);
    setPhase('words');
  }

  function record(verdict: SpeakingResult['verdict']) {
    if (!word) return;
    setResults((prev) => [...prev, { sound: word.target as 's' | 'sh', position: word.position, verdict }]);
  }

  function onDone() {
    if (!word) return;
    const score = scoreAttempt(meter.stop(), word);
    record(score.verdict);
    saveAttempt(
      {
        id: crypto.randomUUID(),
        wordId: word.id,
        target: word.target,
        stage: 'find',
        createdAt: new Date().toISOString(),
        score,
        channels: loadSettings().channels,
      },
      word.position,
    );
    // No hit or miss during the check: every word gets the same "Got it", so it does not feel like a test.
    setGotIt(true);
  }

  function finishWords(all: SpeakingResult[]) {
    const queue = spotsToTryAlone(summarizeSpeaking(all));
    setAloneQueue(queue);
    setAloneIndex(0);
    setAloneTry(0);
    setPhase(queue.length > 0 ? 'alone' : 'results');
  }

  function onNext(skipped = false) {
    if (skipped) {
      if (listening) meter.stop();
      record(null);
    }
    setGotIt(false);
    const nextIndex = index + 1;
    if (nextIndex >= words.length) {
      // results state updates after this render, so rebuild the final list here.
      finishWords(
        skipped
          ? [...results, { sound: word!.target as 's' | 'sh', position: word!.position, verdict: null }]
          : results,
      );
      return;
    }
    setIndex(nextIndex);
    if (nextIndex === BREAK_AFTER) setPhase('break');
  }

  const alone = aloneQueue[aloneIndex] ?? null;
  const aloneWord: PracticeWord | null = alone
    ? {
        id: TRY_ALONE[alone.sound][alone.position],
        text: TRY_ALONE[alone.sound][alone.position],
        target: alone.sound,
        position: alone.position,
        baseWord: null,
        contrastWord: null,
        sign: null,
      }
    : null;

  function onAloneDone() {
    if (!alone || !aloneWord) return;
    const score = scoreAttempt(meter.stop(), aloneWord);
    const key = spotKey(alone.sound, alone.position);
    if (score.verdict === 'hit') setAloneHit((prev) => ({ ...prev, [key]: true }));
    if (aloneTry + 1 < ALONE_TRIES) {
      setAloneTry(aloneTry + 1);
      return;
    }
    setAloneTry(0);
    if (aloneIndex + 1 < aloneQueue.length) setAloneIndex(aloneIndex + 1);
    else setPhase('results');
  }

  async function makePlan() {
    if (age === null) return;
    setPhase('sending');
    const cleaned: LearnerGoals = { chips: goals.chips, text: removeNames(goals.text).trim() };
    saveGoals(cleaned);
    const report: AssessmentReport = {
      source: 'in-app-test',
      therapistSounds: [],
      therapistNotes: '',
      profile: loadProfile(),
      baseline: baselineOf(results),
      ageGroup: age,
      interests: [],
      learnerGoals: cleaned.text || cleaned.chips.length > 0 ? cleaned : undefined,
      createdAt: new Date().toISOString(),
    };
    // Show the built-in plan at once. The plan page swaps in Claude's plan when it arrives.
    showRulesPlanNow(report);
    router.push('/plan');
  }

  const heading = (text: string) => (
    <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-extrabold tracking-tight outline-none">
      {text}
    </h1>
  );
  const shell = (children: ReactNode) => (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-6 pb-10">{children}</main>
  );
  const micError = meter.status === 'error' && (
    <p role="alert" className="rounded-2xl bg-miss-soft p-4 text-lg font-bold text-miss-ink">
      {meter.error ?? 'The microphone could not be started.'}
    </p>
  );

  if ((phase === 'results' || phase === 'sending' || phase === 'error') && age) {
    return shell(
      <>
        {heading(CHECK_COPY.resultsTitle)}
        <SpotRows summary={summary} start={start} />
        {start && (
          <Card tone="accent" className="flex flex-col gap-1">
            <p className="text-lg font-bold">
              {CHECK_COPY.startHere}: &ldquo;{start.sound}&rdquo; {SPOT_WORDS[start.position]}
            </p>
            {aloneHit[spotKey(start.sound, start.position)] && (
              <p className="text-base">{CHECK_COPY.aloneYes}</p>
            )}
          </Card>
        )}
        <p className="text-base text-muted">{CHECK_COPY.resultsNote}</p>
        <GoalsBox age={age} goals={goals} onChange={setGoals} />
        <Card tone="accent" className="flex flex-col gap-1">
          <p className="text-base font-bold text-accent-edge">{CHECK_COPY.sendTitle}</p>
          <p className="text-base leading-relaxed">{CHECK_COPY.sendBody}</p>
        </Card>
        {phase === 'error' && (
          <p role="alert" className="rounded-2xl bg-miss-soft p-4 text-lg font-bold text-miss-ink">
            The plan could not be made. Check your connection and try again.
          </p>
        )}
        <Button size="lg" onClick={makePlan} disabled={phase === 'sending'}>
          {phase === 'sending' ? 'Making your plan…' : CHECK_COPY.makePlan}
        </Button>
        <Button href="/listening-check" variant="secondary">
          <EarIcon className="h-6 w-6" />
          {CHECK_COPY.listeningNext}
        </Button>
      </>,
    );
  }

  if (phase === 'alone' && alone && aloneWord) {
    return shell(
      <>
        <p className="text-base font-bold text-muted">
          Try {aloneTry + 1} of {ALONE_TRIES}
        </p>
        {heading(CHECK_COPY.tryAloneTitle)}
        <p className="text-lg leading-relaxed">{CHECK_COPY.tryAloneBody(alone.sound, aloneWord.text)}</p>
        <Card className="flex min-h-32 items-center justify-center">
          <p className="text-6xl font-extrabold tracking-tight">{aloneWord.text}</p>
        </Card>
        <SoundMeter reading={meter.reading} status={meter.status} />
        {micError}
        <RecordButton
          listening={listening}
          starting={starting}
          onStart={() => meter.start()}
          onDone={onAloneDone}
        />
      </>,
    );
  }

  if (phase === 'break') {
    return shell(
      <>
        {heading(CHECK_COPY.breakTitle)}
        <p className="text-lg leading-relaxed">{CHECK_COPY.breakBody}</p>
        <Button size="lg" onClick={() => setPhase('words')}>
          Go
        </Button>
      </>,
    );
  }

  if (phase === 'words' && word) {
    return shell(
      <>
        <div className="flex items-center justify-between gap-3">
          <p className="text-base font-bold text-muted">
            Word {index + 1} of {words.length}
          </p>
          {!gotIt && (
            <Button variant="ghost" block={false} onClick={() => onNext(true)}>
              {CHECK_COPY.skip}
            </Button>
          )}
        </div>
        <div
          role="progressbar"
          aria-label="Check progress"
          aria-valuemin={0}
          aria-valuemax={words.length}
          aria-valuenow={index}
          className="h-2 w-full overflow-hidden rounded-full bg-line"
        >
          <div className="h-2 rounded-full bg-accent" style={{ width: `${(index / words.length) * 100}%` }} />
        </div>
        {heading(CHECK_COPY.sayWord)}
        <Card
          key={word.id}
          className="flex min-h-40 items-center justify-center motion-safe:animate-spring-in"
        >
          <p className="text-6xl font-extrabold tracking-tight">{word.text}</p>
        </Card>
        <SoundMeter reading={meter.reading} status={meter.status} />
        {micError}
        {gotIt ? (
          <div className="flex flex-col gap-4">
            <p
              role="status"
              className="flex items-center gap-3 rounded-2xl bg-hit-soft p-4 text-xl font-bold text-hit-strong motion-safe:animate-result-pulse"
            >
              <CheckCircleIcon className="h-7 w-7" />
              {CHECK_COPY.gotIt}
            </p>
            <Button size="lg" onClick={() => onNext()}>
              {index + 1 >= words.length ? 'Finish' : 'Next word'}
            </Button>
          </div>
        ) : (
          <RecordButton
            listening={listening}
            starting={starting}
            onStart={() => meter.start()}
            onDone={onDone}
          />
        )}
      </>,
    );
  }

  return shell(
    <>
      <Button href="/" variant="ghost" block={false} className="self-start">
        <ArrowLeftIcon className="h-5 w-5" />
        Back
      </Button>
      {heading(CHECK_COPY.speakingTitle)}
      <p className="text-lg leading-relaxed">{CHECK_COPY.speakingIntro}</p>
      <ul className="flex flex-col gap-3 text-lg">
        {[
          CHECK_COPY.speakingTime,
          'A break halfway, and you can skip any word',
          'Your voice is checked on this device and never saved',
        ].map((line) => (
          <li key={line} className="flex items-center gap-3">
            <CheckCircleIcon className="h-6 w-6 shrink-0 text-accent-edge" />
            {line}
          </li>
        ))}
      </ul>
      <fieldset className="flex flex-col gap-3">
        <legend className="pb-3 text-xl font-bold">{CHECK_COPY.whoTitle}</legend>
        {(['child', 'teen', 'adult'] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => begin(g)}
            className="flex min-h-16 items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left transition-[transform,background-color] duration-75 active:scale-[0.98]"
          >
            <IconTile tone="soft" size="sm">
              <MicIcon className="h-5 w-5" />
            </IconTile>
            <span className="flex flex-col">
              <span className="text-xl font-bold">{AGE_LABELS[g].title}</span>
              <span className="text-base text-muted">{AGE_LABELS[g].detail}</span>
            </span>
          </button>
        ))}
      </fieldset>
    </>,
  );
}
