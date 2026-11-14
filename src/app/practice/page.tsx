'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { SoundMeter } from '@/components/SoundMeter';
import { VerdictBadge } from '@/components/VerdictBadge';
import { WordCard } from '@/components/WordCard';
import { COPY } from '@/content/copy';
import { CUES } from '@/content/cues';
import { wordsFor } from '@/content/words';
import { useSoundMeter } from '@/hooks/useSoundMeter';
import { buzz } from '@/lib/feedback';
import { LIMITATIONS, scoreAttempt } from '@/lib/scoring';
import { loadProfile, loadSettings, saveAttempt } from '@/lib/store';
import type { AttemptScore, HearingProfile, LearnerSettings, PracticeWord, TargetSound } from '@/lib/types';

const WORD_COUNT = 8;

const primaryButton =
  'flex min-h-[72px] w-full items-center justify-center gap-3 rounded-2xl bg-accent px-6 text-2xl font-bold text-accent-ink disabled:opacity-60';
const secondaryButton =
  'flex min-h-[72px] w-full items-center justify-center gap-3 rounded-2xl border-2 border-foreground bg-surface px-4 text-xl font-bold text-foreground';

function MicIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3" fill="currentColor" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 11l9-7 9 7M5 10v10h14V10" />
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
            className={`h-2.5 rounded-full ${
              i < index
                ? 'flex-1 bg-foreground'
                : i === index
                  ? 'flex-[2] bg-accent'
                  : 'flex-1 border-2 border-foreground/40'
            }`}
          />
        ))}
      </ol>
      <p className="shrink-0 text-sm font-semibold text-muted">
        Word {index + 1} of {total}
      </p>
    </div>
  );
}

function PracticeLoop() {
  const searchParams = useSearchParams();
  const target: TargetSound = searchParams.get('sound') === 'sh' ? 'sh' : 's';

  const meter = useSoundMeter();
  const [settings, setSettings] = useState<LearnerSettings | null>(null);
  const [profile, setProfile] = useState<HearingProfile | null>(null);
  const [words, setWords] = useState<PracticeWord[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState<AttemptScore | null>(null);
  const [hits, setHits] = useState(0);
  const [tries, setTries] = useState(0);
  const [finished, setFinished] = useState(false);

  // Storage and the word list are read in an effect, never during render.
  // The state is set in a microtask (not synchronously in the effect body) and ignored if the page left.
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setSettings(loadSettings());
      setProfile(loadProfile());
      setWords(wordsFor(target, WORD_COUNT));
      setIndex(0);
      setScore(null);
      setHits(0);
      setTries(0);
      setFinished(false);
    });
    return () => {
      active = false;
    };
  }, [target]);

  const cue = CUES[target];
  const word = words[index] ?? null;
  const listening = meter.status === 'listening';
  const busy = meter.status === 'starting';

  async function onStart() {
    setScore(null);
    await meter.start();
  }

  function onDone() {
    if (!word || !settings) return;
    const frames = meter.stop();
    const result = scoreAttempt(frames, word);
    setScore(result);
    setTries((n) => n + 1);
    if (result.verdict === 'hit') setHits((n) => n + 1);
    if (settings.channels.includes('vibration')) buzz(result.verdict);
    saveAttempt({
      id: crypto.randomUUID(),
      wordId: word.id,
      target: word.target,
      stage: 'use',
      createdAt: new Date().toISOString(),
      score: result,
      channels: settings.channels,
    });
  }

  function onNext() {
    setScore(null);
    if (index + 1 >= words.length) setFinished(true);
    else setIndex(index + 1);
  }

  function onRestart() {
    setWords(wordsFor(target, WORD_COUNT));
    setIndex(0);
    setScore(null);
    setHits(0);
    setTries(0);
    setFinished(false);
  }

  const footer = (
    <footer className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-xs text-muted">
      <h2 className="font-bold">What this cannot do</h2>
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
      className="flex min-h-12 min-w-12 items-center justify-center gap-1 rounded-xl text-sm font-semibold"
    >
      <HomeIcon />
      <span>Home</span>
    </Link>
  );

  if (finished) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-6 p-4">
        <header className="flex items-center gap-3">{homeLink}</header>
        <h1 className="text-4xl font-bold">All done</h1>
        {tries > 0 && (
          <ul className="flex flex-wrap gap-2" aria-hidden="true">
            {Array.from({ length: tries }, (_, i) => (
              <li
                key={i}
                className={`h-7 w-7 rounded-full border-[3px] border-foreground ${i < hits ? 'bg-foreground' : 'bg-surface'}`}
              />
            ))}
          </ul>
        )}
        <p className="text-2xl">
          You got {hits} out of {tries} tries.
        </p>
        <Link href="/progress" className={primaryButton}>
          See your progress
        </Link>
        <button type="button" onClick={onRestart} className={secondaryButton}>
          Practice again
        </button>
        {footer}
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-3 px-4 pt-2 pb-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {homeLink}
          <h1 className="text-lg font-bold">Practice the &apos;{target}&apos; sound</h1>
        </div>
        {words.length > 0 && <WordSteps index={Math.min(index, words.length - 1)} total={words.length} />}
        {profile === null && settings !== null && (
          <p className="text-sm text-muted">
            No hearing check saved yet.{' '}
            <Link href="/profile" className="inline-block py-2 font-semibold text-foreground underline">
              Do the hearing check
            </Link>
          </p>
        )}
      </header>

      {word ? (
        <WordCard word={word} showSign={settings?.showSigns ?? false} />
      ) : (
        <p className="py-8 text-center text-muted">Loading words...</p>
      )}

      <SoundMeter
        reading={meter.reading}
        target={target}
        status={meter.status}
        result={score ? { position: score.meterPosition } : null}
      />

      {meter.status === 'error' && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border-4 border-dashed border-miss bg-surface p-4"
        >
          <p className="font-bold">{meter.error ?? 'The microphone could not be started.'}</p>
          <button type="button" onClick={onStart} className={secondaryButton}>
            Try the microphone again
          </button>
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
              ? 'flex min-h-[72px] w-full items-center justify-center gap-3 rounded-2xl border-4 border-accent bg-surface px-6 text-2xl font-bold text-foreground'
              : primaryButton
          }
        >
          {listening ? (
            <>
              <span className="relative flex h-4 w-4" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 motion-safe:animate-ping" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-accent" />
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-sm font-semibold text-muted">Listening</span>
                <span>Done</span>
              </span>
              <StopIcon />
            </>
          ) : (
            <>
              <MicIcon />
              {busy ? 'Starting...' : 'Start'}
            </>
          )}
        </button>
      )}

      {score && word && (
        <div className="flex flex-col gap-3">
          <VerdictBadge verdict={score.verdict} target={word.target} />
          {score.warnings.length > 0 && (
            <ul className="flex flex-col gap-1 text-sm text-muted">
              {score.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={onStart} className={secondaryButton}>
              Try again
            </button>
            <button type="button" onClick={onNext} className={primaryButton}>
              {index + 1 >= words.length ? 'Finish' : 'Next word'}
            </button>
          </div>
        </div>
      )}

      <details open={index === 0} className="rounded-2xl border-2 border-line bg-surface px-4 py-1">
        <summary className="flex min-h-12 cursor-pointer items-center font-bold">
          How to make this sound
        </summary>
        <div className="pb-3">
          <p className="font-bold">{cue.nickname}</p>
          <ol className="mt-1 list-decimal pl-5">
            {cue.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="mt-2">{cue.shaping}</p>
          <p className="mt-2">{cue.touch}</p>
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
