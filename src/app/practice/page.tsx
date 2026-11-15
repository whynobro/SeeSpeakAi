'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { HomeIcon, LightbulbIcon, MicIcon, StarIcon } from '@/components/Icons';
import { LipCamera } from '@/components/LipCamera';
import { SoundVideo } from '@/components/SoundVideo';
import { SoundMeter } from '@/components/SoundMeter';
import { Button, Card, IconTile, buttonClass } from '@/components/ui';
import { CoachCard } from '@/components/CoachCard';
import { Confetti } from '@/components/Confetti';
import { playHitDing } from '@/components/hitDing';
import { VerdictBadge } from '@/components/VerdictBadge';
import { WordCard } from '@/components/WordCard';
import { setBirdLevel } from '@/components/bird/birdSignal';
import { COPY } from '@/content/copy';
import { CUES } from '@/content/cues';
import { wordsFor } from '@/content/words';
import {
  isLevelId,
  itemsHit,
  levelById,
  levelItems,
  mergeResult,
  nextLevel,
  passed,
  PASS_ITEMS,
} from '@/lib/levels';
import { loadPlan } from '@/components/planStore';
import { useCoachFeedback } from '@/hooks/useCoachFeedback';
import { useLipCamera } from '@/hooks/useLipCamera';
import { useSoundMeter } from '@/hooks/useSoundMeter';
import { buzz } from '@/lib/feedback';
import type { LipSummary } from '@/lib/lips/types';
import { LIMITATIONS, scoreAttempt } from '@/lib/scoring';
import { isTargetSound } from '@/lib/scoring/constants';
import { loadLevelResults, loadProfile, loadSettings, saveAttempt, saveLevelResults } from '@/lib/store';
import type { AttemptScore, HearingProfile, LearnerSettings, PracticeWord, TargetSound } from '@/lib/types';

const WORD_COUNT = 8;

function StopIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3" fill="currentColor" />
    </svg>
  );
}

/** "Word 3 of 8" as a row of segments: done ones filled, the current one wide, the rest hollow. */
function WordSteps({ index, total }: { index: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <ol className="flex flex-1 items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <li
            key={i}
            className={`h-3 rounded-full ${
              i < index
                ? 'flex-1 bg-accent-edge'
                : i === index
                  ? 'flex-[2] bg-accent'
                  : 'flex-1 border-2 border-muted/60 bg-surface'
            }`}
          />
        ))}
      </ol>
      <p className="shrink-0 text-sm font-bold text-muted">
        Word {index + 1} of {total}
      </p>
    </div>
  );
}

function PracticeLoop() {
  const searchParams = useSearchParams();
  const wanted = searchParams.get('sound');
  const target: TargetSound = isTargetSound(wanted) ? wanted : 's';
  // Opened from a plan's start button: ?plan=<id>&step=<n>. Then the words come from that plan step.
  const planId = searchParams.get('plan');
  const stepIndex = Number(searchParams.get('step') ?? '-1');
  // Opened from the levels map: ?level=alone|start|end|phrase. Then the words come from that level.
  const levelParam = searchParams.get('level');
  const level = isLevelId(levelParam) ? levelById(levelParam) : null;

  const meter = useSoundMeter();
  const coach = useCoachFeedback();
  const clearCoach = coach.clear;
  const { begin: beginLips, collect: collectLips, ...lipCam } = useLipCamera();
  const [lastLips, setLastLips] = useState<LipSummary | null>(null);
  const [settings, setSettings] = useState<LearnerSettings | null>(null);
  const [profile, setProfile] = useState<HearingProfile | null>(null);
  const [words, setWords] = useState<PracticeWord[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState<AttemptScore | null>(null);
  const [hits, setHits] = useState(0);
  const [tries, setTries] = useState(0);
  const [finished, setFinished] = useState(false);
  const [fromPlan, setFromPlan] = useState(false);
  /** Level mode: did each item get at least one hit (retries count). */
  const [hitByItem, setHitByItem] = useState<boolean[]>([]);

  /** The plan step's words, in the plan's order, when this page was opened from that plan. Else the word bank. */
  function pickWords(): { list: PracticeWord[]; planned: boolean } {
    if (level) return { list: levelItems(target, level.id), planned: false };
    const plan = planId ? loadPlan() : null;
    const step = plan && plan.id === planId ? plan.steps[stepIndex] : undefined;
    const planned = step?.words.filter((w) => w.target === target) ?? [];
    return planned.length > 0
      ? { list: planned, planned: true }
      : { list: wordsFor(target, WORD_COUNT), planned: false };
  }

  // Storage and the word list are read in an effect, never during render.
  // The state is set in a microtask (not synchronously in the effect body) and ignored if the page left.
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setSettings(loadSettings());
      setProfile(loadProfile());
      const picked = pickWords();
      setWords(picked.list);
      setFromPlan(picked.planned);
      setIndex(0);
      setScore(null);
      setHits(0);
      setTries(0);
      setHitByItem([]);
      setFinished(false);
    });
    return () => {
      active = false;
    };
    // pickWords reads only the URL values listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, planId, stepIndex, levelParam]);

  const cue = CUES[target];
  const word = words[index] ?? null;

  // A new word starts with no coach sentence.
  useEffect(() => {
    clearCoach();
  }, [index, words, clearCoach]);

  // The coach's next step is only a suggestion: it picks which button is the main one. Nothing moves on by itself.
  const suggestRetry = coach.feedback?.nextAction === 'repeat' || coach.feedback?.nextAction === 'easier';
  const listening = meter.status === 'listening';
  const busy = meter.status === 'starting';

  // The bird mascot opens its beak with the mic level. Loudness only, never a verdict.
  useEffect(() => {
    setBirdLevel(listening ? (meter.reading?.level ?? 0) : 0);
  }, [listening, meter.reading]);

  async function onStart() {
    setScore(null);
    setLastLips(null);
    coach.clear();
    beginLips(); // the lip numbers cover this try only
    await meter.start();
  }

  function onDone() {
    if (!word || !settings) return;
    const frames = meter.stop();
    const lips = collectLips(); // numbers only, null when the camera is off
    setLastLips(lips);
    const result = scoreAttempt(frames, word, { alone: level?.id === 'alone' });
    setScore(result);
    setTries((n) => n + 1);
    if (result.verdict === 'hit') {
      playHitDing(); // the mic has stopped (meter.stop() above). Extra only: the badge carries the verdict.
      setHits((n) => n + 1);
      setHitByItem((prev) => {
        const next = [...prev];
        next[index] = true;
        return next;
      });
    }
    if (settings.channels.includes('vibration')) buzz(result.verdict);
    saveAttempt(
      {
        id: crypto.randomUUID(),
        wordId: word.id,
        target: word.target,
        stage: level?.stage ?? 'use',
        createdAt: new Date().toISOString(),
        score: result,
        channels: settings.channels,
      },
      word.position,
    );
    // The verdict is already on screen. The coach's sentence (numbers only go out, never audio) arrives after.
    void coach.ask(word, result, lips);
  }

  function onNext() {
    setScore(null);
    if (index + 1 >= words.length) {
      if (level) saveLevelResults(mergeResult(loadLevelResults(), target, level.id, itemsHit(hitByItem)));
      setFinished(true);
    } else setIndex(index + 1);
  }

  function onRestart() {
    setWords(pickWords().list);
    setIndex(0);
    setScore(null);
    setHits(0);
    setTries(0);
    setHitByItem([]);
    setFinished(false);
  }

  const footer = (
    <footer className="mt-4 flex flex-col gap-2 border-t-2 border-line pt-6 text-sm leading-relaxed text-muted">
      <h2 className="text-base font-bold text-foreground">What this cannot do</h2>
      <ul className="list-disc pl-4">
        {LIMITATIONS.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p>{COPY.notTherapy}</p>
      <p>{COPY.privacy}</p>
    </footer>
  );

  const homeLink = (
    <Link
      href="/"
      className="flex min-h-12 min-w-12 shrink-0 items-center justify-center gap-1 rounded-xl px-1 text-base font-bold text-accent-edge"
    >
      <HomeIcon className="h-6 w-6" />
      <span>Home</span>
    </Link>
  );

  if (finished && level) {
    const got = itemsHit(hitByItem);
    const ok = passed(got);
    const next = nextLevel(level.id);
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pt-2 pb-8">
        <header className="flex items-center gap-3">{homeLink}</header>
        <section className="relative flex flex-col gap-4 border-y border-line py-6">
          {ok && <Confetti />}
          <div className={`flex flex-col gap-1 ${ok ? 'pr-16' : ''}`}>
            <p className="text-[15px] font-bold text-muted">
              Level {level.number}: {level.title}
            </p>
            <h1 className="flex items-center gap-2 text-[28px] leading-tight font-extrabold tracking-tight">
              {ok ? (
                <>
                  <StarIcon className="h-7 w-7 shrink-0 text-accent" />
                  Level passed
                </>
              ) : (
                'Nice work, keep going'
              )}
            </h1>
          </div>
          <ul className="flex flex-wrap gap-1.5" aria-hidden="true">
            {words.map((w, i) => (
              <li
                key={i}
                className={`flex h-6 w-6 items-center justify-center rounded-full border ${hitByItem[i] ? 'border-hit-strong bg-hit text-hit-ink' : 'border-muted bg-surface'}`}
              >
                {hitByItem[i] && (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3.5}
                  >
                    <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </li>
            ))}
          </ul>
          <p className="text-[20px] leading-snug font-bold">
            {got} of {words.length} right.
          </p>
          <p className="text-[17px] leading-relaxed text-muted">
            {ok
              ? next
                ? `Level ${next.number} is open: ${next.title.toLowerCase()}.`
                : `That was the last level for "${target}".`
              : `Get ${PASS_ITEMS} of ${words.length} right to open the next level. Tries again count.`}
          </p>
        </section>
        {ok && next ? (
          <Button href={`/practice?sound=${target}&level=${next.id}`} size="xl">
            Next level
          </Button>
        ) : (
          <Button size="xl" onClick={onRestart}>
            {ok ? 'Play again' : 'Try the level again'}
          </Button>
        )}
        <Button href={`/levels?sound=${target}`} variant="secondary" size="lg">
          All levels
        </Button>
        {footer}
      </main>
    );
  }

  if (finished) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pt-2 pb-8">
        <header className="flex items-center gap-3">{homeLink}</header>
        <Card className="flex flex-col gap-4">
          <h1 className="text-[28px] leading-tight font-extrabold tracking-tight">All done</h1>
          {tries > 0 && (
            <ul className="flex flex-wrap gap-2" aria-hidden="true">
              {Array.from({ length: tries }, (_, i) => (
                <li
                  key={i}
                  className={`h-8 w-8 rounded-full border-[3px] ${i < hits ? 'border-hit-strong bg-hit' : 'border-muted bg-surface'}`}
                />
              ))}
            </ul>
          )}
          <p className="text-2xl font-bold">
            You got {hits} out of {tries} tries.
          </p>
        </Card>
        <Button href="/progress" size="xl">
          See your progress
        </Button>
        <Button variant="secondary" size="lg" onClick={onRestart}>
          Practice again
        </Button>
        {footer}
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 pt-2 pb-8">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          {homeLink}
          <h1 className="text-xl font-extrabold tracking-tight">Practice the &apos;{target}&apos; sound</h1>
        </div>
        {level && (
          <p className="text-base font-bold">
            Level {level.number} of 4: {level.title}.{' '}
            <Link
              href={`/levels?sound=${target}`}
              className="inline-block py-2 text-sm text-accent-edge underline underline-offset-4"
            >
              All levels
            </Link>
          </p>
        )}
        {!level && (
          <p className="text-sm text-muted">
            <Link
              href={`/levels?sound=${target}`}
              className="inline-block py-2 font-bold text-accent-edge underline underline-offset-4"
            >
              Practice by level
            </Link>
          </p>
        )}
        {words.length > 0 && <WordSteps index={Math.min(index, words.length - 1)} total={words.length} />}
        {fromPlan && (
          <p className="text-sm text-muted">
            Words from your plan.{' '}
            <Link
              href="/plan"
              className="inline-block py-2 font-bold text-accent-edge underline underline-offset-4"
            >
              Back to your plan
            </Link>
          </p>
        )}
        {profile === null && settings !== null && (
          <p className="text-sm text-muted">
            No hearing check saved yet.{' '}
            <Link
              href="/profile"
              className="inline-block py-2 font-bold text-accent-edge underline underline-offset-4"
            >
              Do the hearing check
            </Link>
          </p>
        )}
      </header>

      {word ? (
        <WordCard word={word} showSign={settings?.showSigns ?? false} />
      ) : (
        <Card className="py-8 text-center text-muted">Loading words...</Card>
      )}

      <SoundMeter
        reading={meter.reading}
        target={target}
        status={meter.status}
        result={score ? { position: score.meterPosition } : null}
      />

      <LipCamera
        enabled={lipCam.enabled}
        onEnabledChange={lipCam.setEnabled}
        status={lipCam.status}
        error={lipCam.error}
        latest={lipCam.latest}
        videoRef={lipCam.videoRef}
        target={target}
        lastTry={score ? lastLips : null}
      />

      {meter.status === 'error' && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border-4 border-dashed border-miss bg-surface p-4"
        >
          <p className="text-lg font-bold">{meter.error ?? 'The microphone could not be started.'}</p>
          <Button variant="secondary" onClick={onStart}>
            Try the microphone again
          </Button>
        </div>
      )}

      {!score && meter.status !== 'error' && (
        <button
          type="button"
          onClick={listening ? onDone : onStart}
          disabled={!word || busy}
          aria-label={listening ? 'Done: stop listening and check the word' : undefined}
          className={
            listening
              ? 'flex min-h-[72px] w-full items-center justify-center gap-3 rounded-2xl border-2 border-accent bg-surface px-6 text-2xl font-bold text-foreground transition-[transform,background-color] duration-75 active:scale-[0.98]'
              : buttonClass({ size: 'xl' })
          }
        >
          {listening ? (
            <>
              <span className="relative flex h-4 w-4" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 motion-safe:animate-ping" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-accent" />
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-sm font-bold text-muted">Listening</span>
                <span>Done</span>
              </span>
              <StopIcon />
            </>
          ) : (
            <>
              <MicIcon className="h-7 w-7" />
              {busy ? 'Starting...' : 'Start'}
            </>
          )}
        </button>
      )}

      {score && word && (
        <div className="flex flex-col gap-3">
          <VerdictBadge verdict={score.verdict} target={word.target} heard={score.heard} />
          {score.warnings.length > 0 && (
            <ul className="flex flex-col gap-1 text-base text-muted">
              {score.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
          <CoachCard feedback={coach.feedback} loading={coach.loading} />
          <div className="grid grid-cols-2 gap-3">
            <Button variant={suggestRetry ? 'primary' : 'secondary'} size="lg" onClick={onStart}>
              Try again
            </Button>
            <Button variant={suggestRetry ? 'secondary' : 'primary'} size="lg" onClick={onNext}>
              {index + 1 >= words.length ? 'Finish' : 'Next word'}
            </Button>
          </div>
        </div>
      )}

      {/* Below the meter and the main button, so opening it never pushes them off the screen. */}
      <details open={index === 0} className="group rounded-2xl border border-line bg-surface px-4 py-2">
        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
          <IconTile tone="violet-soft" size="sm">
            <LightbulbIcon className="h-5 w-5" />
          </IconTile>
          <span className="flex flex-1 flex-col">
            <span className="text-lg font-bold">How to make this sound</span>
            <span className="text-sm text-muted">{cue.nickname}</span>
          </span>
          <span
            aria-hidden="true"
            className="text-2xl font-bold text-accent-edge transition-transform group-open:rotate-90"
          >
            &rsaquo;
          </span>
        </summary>
        <div className="flex flex-col gap-3 pt-2 pb-3">
          <SoundVideo sound={target} />
          <h3 className="pt-1 text-base font-bold">Step by step</h3>
          <ol className="flex list-decimal flex-col gap-1 pl-6 text-base marker:font-bold">
            {cue.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="rounded-2xl bg-accent-soft p-3 text-base">{cue.shaping}</p>
          <p className="text-base">{cue.touch}</p>
        </div>
      </details>

      {footer}
    </main>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<p className="p-4">Loading...</p>}>
      <PracticeLoop />
    </Suspense>
  );
}
