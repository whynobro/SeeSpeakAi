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
    <section className="flex flex-col gap-2 border-t border-current/30 pt-4 text-sm">
      <h2 className="font-bold">What this cannot do</h2>
      <ul className="list-disc pl-5">
        {LIMITATIONS.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p>{COPY.notTherapy}</p>
      <p>{COPY.privacy}</p>
    </section>
  );

  if (finished) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 p-4">
        <h1 className="text-3xl font-bold">All done</h1>
        <p className="text-xl">
          You got {hits} out of {tries} tries.
        </p>
        <Link
          href="/progress"
          className="min-h-16 rounded-2xl bg-blue-700 px-6 py-4 text-center text-2xl font-bold text-white"
        >
          See your progress
        </Link>
        <button
          type="button"
          onClick={onRestart}
          className="min-h-14 rounded-2xl border-2 border-current px-6 text-xl font-bold"
        >
          Practice again
        </button>
        {footer}
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 p-4">
      <header>
        <h1 className="text-2xl font-bold">Practice the &apos;{target}&apos; sound</h1>
        {words.length > 0 && (
          <p className="text-sm">
            Word {Math.min(index + 1, words.length)} of {words.length}
          </p>
        )}
        {profile === null && settings !== null && (
          <p className="text-sm">
            No hearing check saved yet.{' '}
            <Link href="/profile" className="underline">
              Do the hearing check
            </Link>
          </p>
        )}
      </header>

      <details className="rounded-xl border-2 border-current p-3">
        <summary className="min-h-10 cursor-pointer font-bold">How to make this sound</summary>
        <p className="mt-2 font-bold">{cue.nickname}</p>
        <ol className="list-decimal pl-5">
          {cue.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="mt-2">{cue.shaping}</p>
        <p className="mt-2">{cue.touch}</p>
      </details>

      {word ? <WordCard word={word} showSign={settings?.showSigns ?? false} /> : <p>Loading words...</p>}

      <SoundMeter reading={meter.reading} />

      {meter.status === 'error' && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl bg-red-700 p-4 text-white">
          <p className="font-bold">{meter.error ?? 'The microphone could not be started.'}</p>
          <button
            type="button"
            onClick={onStart}
            className="min-h-12 rounded-xl bg-white px-4 font-bold text-black"
          >
            Try the microphone again
          </button>
        </div>
      )}

      {score && word && (
        <div className="flex flex-col gap-3">
          <VerdictBadge verdict={score.verdict} target={word.target} />
          {score.warnings.length > 0 && (
            <ul className="list-disc pl-5 text-sm">
              {score.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!score && (
        <button
          type="button"
          onClick={listening ? onDone : onStart}
          disabled={!word || busy}
          className="min-h-20 rounded-2xl bg-blue-700 px-6 text-3xl font-bold text-white disabled:opacity-60"
        >
          {busy ? 'Starting...' : listening ? 'Done' : 'Start'}
        </button>
      )}

      {score && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onStart}
            className="min-h-16 rounded-2xl border-2 border-current px-6 text-2xl font-bold"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={onNext}
            className="min-h-16 rounded-2xl bg-blue-700 px-6 text-2xl font-bold text-white"
          >
            {index + 1 >= words.length ? 'Finish' : 'Next word'}
          </button>
        </div>
      )}

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
