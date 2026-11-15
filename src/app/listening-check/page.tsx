'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { ArrowLeftIcon, CheckCircleIcon, EarIcon } from '@/components/Icons';
import { Button, Card, Divider, GroupedList, GroupedRow, SectionLabel, SegmentedControl } from '@/components/ui';
import { AGE_LABELS, CHECK_COPY, type CheckAge, LISTEN_PAIRS } from '@/content/checks';
import { canSpeakWords, playCheckSound, speakWord, unlockAudio } from '@/lib/audio/playback';
import {
  type ListenAnswer,
  type ListenSummary,
  type ListenTrial,
  buildListeningTrials,
  shouldStopListening,
  summarizeListening,
} from '@/lib/checks';
import { type ListeningRun, loadListeningRuns, saveListeningRun } from '@/lib/store';

type Phase = 'intro' | 'trials' | 'results';
type Devices = ListeningRun['devices'];

const DEVICE_LABELS: Record<Devices, string> = {
  on: 'Hearing aids or implant on',
  off: 'Hearing aids or implant off',
  none: 'I do not use them',
};

// Short labels for the segmented picker; the full ones above are used in sentences.
const DEVICE_CHOICES: { value: Devices; label: string }[] = [
  { value: 'on', label: 'On' },
  { value: 'off', label: 'Off' },
  { value: 'none', label: 'I do not use them' },
];

const AGE_CHOICES = (['child', 'teen', 'adult'] as const).map((g) => ({
  value: g,
  label: AGE_LABELS[g].title,
}));

export default function ListeningCheckPage() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [age, setAge] = useState<CheckAge>('child');
  const [devices, setDevices] = useState<Devices>('on');
  const [trials, setTrials] = useState<ListenTrial[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<ListenAnswer[]>([]);
  const [playing, setPlaying] = useState(false);
  const [stoppedEarly, setStoppedEarly] = useState(false);
  const [summary, setSummary] = useState<ListenSummary | null>(null);
  const [previous, setPrevious] = useState<ListeningRun | null>(null);
  const [voice, setVoice] = useState(true);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    queueMicrotask(() => setVoice(canSpeakWords()));
  }, []);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [phase, index]);

  const trial = trials[index] ?? null;

  async function play(t: ListenTrial | null) {
    if (!t) return;
    setPlaying(true);
    try {
      if (t.kind === 'detect') await playCheckSound(t.sound);
      else await speakWord(t.play === 's' ? t.pair.s : t.pair.sh);
    } finally {
      setPlaying(false);
    }
  }

  /** Each trial plays once when it appears. Started from the tap, so browsers allow the sound. */
  function playSoon(t: ListenTrial | undefined) {
    if (t) setTimeout(() => void play(t), 500);
  }

  function begin() {
    unlockAudio();
    const all = buildListeningTrials(LISTEN_PAIRS[age]);
    // Without a built-in voice, only the made sounds can be played: skip the word pairs.
    const list = voice ? all : all.filter((t) => t.kind === 'detect');
    setTrials(list);
    setIndex(0);
    setAnswers([]);
    setStoppedEarly(false);
    setPhase('trials');
    playSoon(list[0]);
  }

  function finish(all: ListenAnswer[], early: boolean) {
    const sum = summarizeListening(all);
    const runs = loadListeningRuns().filter((r) => r.devices === devices);
    setPrevious(runs[runs.length - 1] ?? null);
    if (sum.contrastTotal > 0) {
      saveListeningRun({
        createdAt: new Date().toISOString(),
        ageGroup: age,
        level: sum.level,
        contrastCorrect: sum.contrastCorrect,
        contrastTotal: sum.contrastTotal,
        devices,
      });
    }
    setSummary(sum);
    setStoppedEarly(early);
    setPhase('results');
  }

  function answer(a: ListenAnswer) {
    const all = [...answers, a];
    setAnswers(all);
    if (shouldStopListening(all)) finish(all, true);
    else if (index + 1 >= trials.length) finish(all, false);
    else {
      setIndex(index + 1);
      playSoon(trials[index + 1]);
    }
  }

  const heading = (text: string) => (
    <h1
      ref={headingRef}
      tabIndex={-1}
      className="text-[28px] leading-tight font-extrabold tracking-tight outline-none"
    >
      {text}
    </h1>
  );
  const shell = (children: ReactNode) => (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-6 pb-10">{children}</main>
  );
  const choice =
    'flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border-4 bg-surface text-2xl font-extrabold transition-[transform,background-color] duration-75 active:scale-[0.98] disabled:opacity-60';

  if (phase === 'results' && summary) {
    const share = summary.contrastTotal > 0 ? `${summary.contrastCorrect} of ${summary.contrastTotal}` : null;
    return shell(
      <>
        {heading(CHECK_COPY.listenResultTitle)}
        {stoppedEarly && <p className="text-lg">{CHECK_COPY.stoppedEarly}</p>}
        <section aria-labelledby="alone-label" className="flex flex-col gap-2">
          <SectionLabel id="alone-label" className="px-1">
            Hearing the sounds on their own
          </SectionLabel>
          <GroupedList>
            {(['s', 'sh', 'ah'] as const).map((s) =>
              summary.heard[s] === undefined ? null : (
                <GroupedRow
                  key={s}
                  lead={
                    <span
                      aria-hidden="true"
                      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-extrabold ${
                        summary.heard[s] ? 'bg-hit text-hit-ink' : 'border-2 border-line text-muted'
                      }`}
                    >
                      {summary.heard[s] ? '✓' : '·'}
                    </span>
                  }
                  title={<>&ldquo;{s}&rdquo;</>}
                  trail={
                    <span className="text-[15px] font-semibold text-muted">
                      {summary.heard[s] ? 'Heard' : 'Not heard this time'}
                    </span>
                  }
                />
              ),
            )}
          </GroupedList>
        </section>
        {share && (
          <section aria-labelledby="pairs-label" className="flex flex-col gap-2">
            <SectionLabel id="pairs-label" className="px-1">
              Telling &ldquo;s&rdquo; and &ldquo;sh&rdquo; apart
            </SectionLabel>
            <Card tone="accent" className="flex flex-col gap-1">
              <p className="text-2xl font-extrabold">{CHECK_COPY.listenLevels[summary.level]}</p>
              <p className="text-lg">
                {share} word pairs
                {previous &&
                  `. Last time (${DEVICE_LABELS[devices].toLowerCase()}): ${previous.contrastCorrect} of ${previous.contrastTotal}`}
              </p>
              {summary.level === 'harder' && (
                <p className="text-base">
                  Your practice will lean on the meter and the mouth pictures: eyes first.
                </p>
              )}
            </Card>
          </section>
        )}
        <p className="text-base text-muted">{CHECK_COPY.listenNote}</p>
        <Button href="/speech-check" size="lg">
          Speaking check
        </Button>
        <Button href="/" variant="secondary">
          Home
        </Button>
      </>,
    );
  }

  if (phase === 'trials' && trial) {
    return shell(
      <>
        <div className="flex items-center justify-between gap-3">
          <p className="text-base font-bold text-muted">
            Listening · {index + 1} of {trials.length}
          </p>
          <Button variant="ghost" block={false} onClick={() => finish(answers, true)}>
            {CHECK_COPY.tired}
          </Button>
        </div>
        {trial.kind === 'detect' ? (
          <>
            <div className="flex flex-col items-center gap-3 py-6">
              <span
                aria-hidden="true"
                className={`inline-flex h-32 w-32 items-center justify-center rounded-full border-2 border-accent bg-accent-soft text-accent-edge ${playing ? 'motion-safe:animate-listen-ring' : ''}`}
              >
                <EarIcon className="h-16 w-16" />
              </span>
              <p role="status" className="text-lg font-bold text-accent-edge">
                {playing ? 'Listen now…' : ' '}
              </p>
            </div>
            {heading(CHECK_COPY.heardTitle)}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={playing}
                onClick={() => answer({ kind: 'detect', sound: trial.sound, heard: true })}
                className={`${choice} border-accent text-accent-edge`}
              >
                <CheckCircleIcon className="h-8 w-8" />
                {CHECK_COPY.heardYes}
              </button>
              <button
                type="button"
                disabled={playing}
                onClick={() => answer({ kind: 'detect', sound: trial.sound, heard: false })}
                className={`${choice} border-line text-foreground`}
              >
                <span aria-hidden="true" className="text-3xl leading-none">
                  –
                </span>
                {CHECK_COPY.heardNo}
              </button>
            </div>
            <p className="text-center text-base text-muted">{CHECK_COPY.silentNote}</p>
          </>
        ) : (
          <>
            {heading(CHECK_COPY.pairTitle)}
            <Button variant="secondary" onClick={() => play(trial)} disabled={playing}>
              <EarIcon className="h-6 w-6" />
              {playing ? 'Playing…' : CHECK_COPY.playAgain}
            </Button>
            <div className="grid grid-cols-2 gap-3">
              {(['s', 'sh'] as const).map((side) => (
                <button
                  key={side}
                  type="button"
                  disabled={playing}
                  onClick={() => answer({ kind: 'pair', pair: trial.pair, play: trial.play, picked: side })}
                  className={`${choice} min-h-40 border-line text-foreground`}
                >
                  {side === 's' ? trial.pair.s : trial.pair.sh}
                </button>
              ))}
            </div>
            <p className="text-center text-base text-muted">{CHECK_COPY.computerVoice}</p>
          </>
        )}
      </>,
    );
  }

  return shell(
    <>
      <Button href="/checks" variant="ghost" block={false} className="self-start">
        <ArrowLeftIcon className="h-5 w-5" />
        Checks
      </Button>
      {heading(CHECK_COPY.listeningTitle)}
      <p className="text-lg leading-relaxed">{CHECK_COPY.listeningIntro}</p>
      <ol className="flex flex-col gap-3 text-lg">
        {CHECK_COPY.listeningSetup.map((line, i) => (
          <li key={line} className="flex gap-3">
            <span className="font-bold">{i + 1}.</span>
            {line}
          </li>
        ))}
      </ol>
      <Button
        variant="secondary"
        onClick={() => {
          unlockAudio();
          void playCheckSound('ah', 900);
        }}
      >
        <EarIcon className="h-6 w-6" />
        {CHECK_COPY.playSample}
      </Button>
      {!voice && <p className="text-base text-muted">{CHECK_COPY.noVoice}</p>}
      <Divider />
      <div className="flex flex-col gap-2">
        <h2 className="text-[20px] font-bold">Who is listening?</h2>
        <SegmentedControl label="Who is listening?" options={AGE_CHOICES} value={age} onChange={setAge} />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-[20px] font-bold">Hearing aids or implant right now</h2>
        <SegmentedControl
          label="Hearing aids or implant right now"
          options={DEVICE_CHOICES}
          value={devices}
          onChange={setDevices}
        />
      </div>
      <Button size="lg" onClick={begin}>
        Start the listening check
      </Button>
    </>,
  );
}
