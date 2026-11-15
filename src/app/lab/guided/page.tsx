'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SoundMeter } from '@/components/SoundMeter';
import { VerdictBadge } from '@/components/VerdictBadge';
import { useSoundMeter } from '@/hooks/useSoundMeter';
import { autoStopReason, heardNothing, type LevelPoint } from '@/lib/audio/autoStop';
import { scoreAttempt } from '@/lib/scoring';
import { TARGET_SOUNDS } from '@/lib/scoring/constants';
import { getLabel, isLabSharing, newAttemptId, setLabel, shareLabAttempt } from '@/lib/testlog';
import type { AttemptScore, TargetSound } from '@/lib/types';
import {
  GUIDED_SCRIPT,
  instructionFor,
  matchedExpectation,
  scriptFor,
  wordOf,
  type GuidedStep,
} from './script';

/** How long the result stays on screen before the next step starts listening (ms). */
const ADVANCE_MS = 2000;
/** Time to read the next word before the microphone starts listening (ms). */
const READY_MS = 1800;
/** Wait before listening again when nothing was heard (ms). */
const RETRY_MS = 800;

type Phase = 'intro' | 'running' | 'paused' | 'done';

interface StepResult {
  score: AttemptScore;
  matched: boolean;
}

const bigButton = 'min-h-16 rounded-2xl px-6 text-2xl font-bold';
const smallButton = 'min-h-12 rounded-xl border-2 border-current px-5 text-lg font-bold';

export default function GuidedLabPage() {
  const meter = useSoundMeter();
  const { start, stop, latest, status, sampleRate } = meter;
  const [phase, setPhase] = useState<Phase>('intro');
  const [index, setIndex] = useState(0);
  // The result of the step on screen, or null while listening.
  const [current, setCurrent] = useState<StepResult | null>(null);
  // Results by step number, so Redo replaces the old one. Skipped steps have none.
  const [results, setResults] = useState<Record<number, StepResult>>({});
  const [notice, setNotice] = useState('');
  const [failedSaves, setFailedSaves] = useState(0);
  const [label, setLabelState] = useState('');
  const [savingOff, setSavingOff] = useState(false);
  // Which script: the full guided test, or a drill picked with ?set= (for example ?set=sip).
  const [script, setScript] = useState<GuidedStep[]>(GUIDED_SCRIPT);
  const scriptRef = useRef<GuidedStep[]>(GUIDED_SCRIPT);

  // Live values for timers and callbacks, so they never read stale state.
  const live = useRef({ phase, index, sampleRate });
  const listening = useRef(false);
  const stopping = useRef(false);
  const points = useRef<LevelPoint[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    live.current = { phase, index, sampleRate };
  }, [phase, index, sampleRate]);

  // Storage is read after the first paint, never during render.
  useEffect(() => {
    const t = setTimeout(() => {
      setLabelState(getLabel());
      setSavingOff(!isLabSharing());
      const picked = scriptFor(new URLSearchParams(window.location.search).get('set'));
      scriptRef.current = picked;
      setScript(picked);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const clearTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  /** Start listening for the current step. */
  const listen = useCallback(async () => {
    clearTimer();
    points.current = [];
    listening.current = true;
    stopping.current = false;
    setCurrent(null);
    setNotice('');
    await start();
  }, [clearTimer, start]);

  /** Stop the mic and throw the recording away (Redo, Skip, Pause). */
  const discard = useCallback(() => {
    clearTimer();
    if (listening.current) stop();
    listening.current = false;
  }, [clearTimer, stop]);

  const advance = useCallback(() => {
    const next = live.current.index + 1;
    if (next >= scriptRef.current.length) {
      setPhase('done');
      return;
    }
    setIndex(next);
    live.current = { ...live.current, index: next };
    setCurrent(null);
    setNotice('Get ready...');
    timer.current = setTimeout(() => {
      if (live.current.phase === 'running') void listen();
    }, READY_MS);
  }, [listen]);

  /** The try is over: stop, score, save, show the verdict, then go on. */
  const finish = useCallback(
    (manual: boolean) => {
      if (!listening.current) return;
      listening.current = false;
      const silent = heardNothing(points.current);
      const frames = stop();
      if (silent && !manual) {
        // Nothing was said in time: do not save a try with no voice in it. Listen again.
        setNotice('Heard nothing. Listening again...');
        timer.current = setTimeout(() => void listen(), RETRY_MS);
        return;
      }
      const at = live.current.index;
      const step = scriptRef.current[at];
      const word = wordOf(step);
      const score = scoreAttempt(frames, word);
      const result = { score, matched: matchedExpectation(step, score) };
      setCurrent(result);
      setResults((prev) => ({ ...prev, [at]: result }));
      void shareLabAttempt(
        word,
        score,
        frames,
        live.current.sampleRate,
        step.say,
        newAttemptId(),
        'guided',
      ).then((stored) => {
        if (!stored) setFailedSaves((n) => n + 1);
      });
      if (live.current.phase === 'running') timer.current = setTimeout(advance, ADVANCE_MS);
    },
    [stop, listen, advance],
  );

  // Watch the loudness. When the person has spoken and gone quiet (or time is up), stop by itself.
  useEffect(() => {
    if (!listening.current || status !== 'listening' || !latest) return;
    points.current.push({ tMs: latest.tMs, level: latest.level });
    if (!stopping.current && autoStopReason(points.current) !== null) {
      stopping.current = true; // One stop per try, even if more frames arrive first.
      timer.current = setTimeout(() => finish(false), 0);
    }
  }, [latest, status, finish]);

  // Leaving the page shuts the mic and any waiting timer.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function onStart() {
    setResults({});
    setFailedSaves(0);
    setIndex(0);
    live.current = { ...live.current, phase: 'running', index: 0 };
    setPhase('running');
    void listen();
  }

  function onRedo() {
    discard();
    void listen();
  }

  function onSkip() {
    discard();
    advance();
  }

  function onPause() {
    discard();
    setNotice('');
    live.current = { ...live.current, phase: 'paused' };
    setPhase('paused');
  }

  function onResume() {
    live.current = { ...live.current, phase: 'running' };
    setPhase('running');
    if (current) advance();
    else void listen();
  }

  function onRunAgain() {
    discard();
    setPhase('intro');
  }

  const step = script[index];
  const word = wordOf(step);
  const waiting = meter.status === 'starting';
  const heardLive = phase === 'running' && !current && status === 'listening';

  // Totals for the end screen.
  const done = Object.entries(results);
  const right = done.filter(([, r]) => r.matched).length;
  const perSound = TARGET_SOUNDS.map((sound: TargetSound) => {
    const mine = done.filter(([i]) => wordOf(script[Number(i)]).target === sound);
    return { sound, right: mine.filter(([, r]) => r.matched).length, total: mine.length };
  });

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-5 p-4">
      <p className="text-sm">
        Guided test. Numbers only are saved for the team. Your voice is never recorded or sent.{' '}
        <Link href="/lab" className="underline">
          Back to the lab
        </Link>
      </p>
      {savingOff && (
        <p className="text-sm font-bold">
          Saving is switched off on this device (see the lab page). Tries are scored but not saved.
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm font-bold">
        Nickname or initials (optional, not your full name)
        <input
          value={label}
          maxLength={20}
          onChange={(e) => {
            setLabelState(e.target.value);
            setLabel(e.target.value);
          }}
          className="min-h-12 rounded-lg border-2 border-current bg-transparent px-2 font-normal"
        />
      </label>

      {phase === 'intro' && (
        <section className="flex flex-col gap-4">
          <p className="text-xl font-bold">
            {script.length} short steps. Press Start, then say each word when it appears. The page listens,
            stops by itself when you finish, and moves on. Use a quiet spot.
          </p>
          <button type="button" onClick={onStart} className={`${bigButton} bg-blue-700 text-white`}>
            Start
          </button>
        </section>
      )}

      {(phase === 'running' || phase === 'paused') && (
        <section className="flex flex-col gap-4">
          <p className="text-3xl leading-tight font-extrabold" aria-live="polite">
            <span className="block text-lg font-bold text-current/70">
              {index + 1} of {script.length}. Say:
            </span>
            <span className="block text-6xl">{instructionFor(step)}</span>
          </p>

          {meter.error && (
            <p role="alert" className="rounded-xl bg-red-700 p-4 font-bold text-white">
              {meter.error}
            </p>
          )}

          {phase === 'running' && !current && (
            <>
              <p role="status" className="text-xl font-bold">
                {notice ||
                  (waiting ? 'Starting the microphone...' : heardLive ? 'Listening. Say it now.' : '')}
              </p>
              <SoundMeter reading={meter.reading} />
              <button
                type="button"
                onClick={() => finish(true)}
                disabled={!heardLive}
                className={`${bigButton} bg-blue-700 text-white disabled:opacity-60`}
              >
                Done
              </button>
            </>
          )}

          {current && (
            <>
              <VerdictBadge
                verdict={current.score.verdict}
                target={word.target}
                heard={current.score.heard}
                lisp={current.score.lisp ?? false}
              />
              <p className="text-xl font-bold">
                {current.matched
                  ? 'Matches what you were asked to do.'
                  : 'Different from what you were asked to do.'}
              </p>
            </>
          )}

          {phase === 'paused' && <p className="text-xl font-bold">Paused. Nothing is listening.</p>}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onRedo}
              disabled={phase === 'paused'}
              className={`${smallButton} disabled:opacity-60`}
            >
              Redo
            </button>
            <button
              type="button"
              onClick={onSkip}
              disabled={phase === 'paused'}
              className={`${smallButton} disabled:opacity-60`}
            >
              Skip
            </button>
          </div>
          {phase === 'running' ? (
            <button type="button" onClick={onPause} className={smallButton}>
              Pause
            </button>
          ) : (
            <button type="button" onClick={onResume} className={`${bigButton} bg-blue-700 text-white`}>
              Resume
            </button>
          )}
        </section>
      )}

      {phase === 'done' && (
        <section className="flex flex-col gap-4">
          <p className="text-3xl font-extrabold">
            Right: {right} of {done.length}
          </p>
          <p className="text-sm">
            Right means the result matched what you were asked to do. Skipped steps are not counted.
          </p>
          <ul className="flex flex-col gap-1 text-xl font-bold">
            {perSound.map((p) => (
              <li key={p.sound}>
                {p.sound}: {p.right} of {p.total}
              </li>
            ))}
          </ul>
          {failedSaves > 0 && (
            <p role="alert" className="font-bold">
              {failedSaves} {failedSaves === 1 ? 'try' : 'tries'} could not be saved. Check the connection.
            </p>
          )}
          <button type="button" onClick={onRunAgain} className={`${bigButton} bg-blue-700 text-white`}>
            Run again
          </button>
        </section>
      )}
    </main>
  );
}
