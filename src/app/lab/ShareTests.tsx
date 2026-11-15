'use client';

import { useEffect, useRef, useState } from 'react';
import { scoreAttempt } from '@/lib/scoring';
import {
  getLabel,
  isLabSharing,
  isSharing,
  newAttemptId,
  setLabel,
  setLabSharing,
  setSharing,
  shareLabAttempt,
  type Said,
} from '@/lib/testlog';
import type { FrameFeatures, PracticeWord, TargetSound } from '@/lib/types';

/** What a tester most likely said instead of the target: the other hiss. "z" slips to "s", "ch" to "sh". */
const SAID_INSTEAD: Record<TargetSound, string> = { s: 'sh', sh: 's', z: 's', ch: 'sh' };

const CHOICES: { said: Said; text: (sound: string, other: string) => string }[] = [
  { said: 'with-sound', text: (sound) => `I said the "${sound}"` },
  { said: 'without-sound', text: (sound) => `I left the "${sound}" out` },
  { said: 'other-sound', text: (_sound, other) => `I said "${other}" instead` },
  { said: 'unsure', text: () => 'Not sure' },
];

type Status = 'idle' | 'sending' | 'saved' | 'answered' | 'failed' | 'off';

/**
 * The shared test log on the lab page. Every try made here is saved for the team as soon as Stop is
 * pressed (numbers only, never audio), unless the person switches that off. Tapping what was really said
 * adds the "right answer" to the same try. A second switch does the same for the practice screen.
 */
export function ShareTests({
  word,
  frames,
  sampleRate,
}: {
  word: PracticeWord;
  frames: FrameFeatures[] | null;
  sampleRate: number | null;
}) {
  const [labOn, setLabOn] = useState(true);
  const [practiceOn, setPracticeOn] = useState(false);
  const [label, setLabelState] = useState('');
  const [spoken, setSpoken] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const attemptId = useRef('');
  // The newest word settings, read when a try is sent, without re-sending when they change.
  const wordRef = useRef(word);
  const spokenRef = useRef(spoken);
  useEffect(() => {
    wordRef.current = word;
    spokenRef.current = spoken;
  }, [word, spoken]);

  // Storage is read after the first paint, never during render.
  useEffect(() => {
    const timer = setTimeout(() => {
      setLabOn(isLabSharing());
      setPracticeOn(isSharing());
      setLabelState(getLabel());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function send(said: Said | null): Promise<boolean> {
    if (!frames) return Promise.resolve(false);
    const current = wordRef.current;
    const typed = spokenRef.current.trim().toLowerCase().slice(0, 30);
    const fromPicker = current.id === 'lab-word' ? '' : current.id;
    const id = typed || fromPicker || `lab-${current.target}-${current.position}`;
    return shareLabAttempt(
      { ...current, id, text: id },
      scoreAttempt(frames, current),
      frames,
      sampleRate,
      said,
      attemptId.current,
    );
  }

  // A new recording is saved straight away, before anyone taps anything.
  useEffect(() => {
    if (!frames || frames.length === 0) return;
    let active = true;
    attemptId.current = newAttemptId();
    const timer = setTimeout(async () => {
      if (!isLabSharing()) {
        if (active) setStatus('off');
        return;
      }
      if (active) setStatus('sending');
      const stored = await send(null);
      if (active) setStatus(stored ? 'saved' : 'failed');
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // Only a new recording triggers a save. The word settings are read through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames]);

  async function onSaid(said: Said) {
    setStatus('sending');
    const stored = await send(said);
    setStatus(stored ? 'answered' : 'failed');
  }

  const other = SAID_INSTEAD[word.target];

  return (
    <section className="flex flex-col gap-3 rounded-xl border-2 border-current p-3">
      <p className="font-bold">Test tries on this page are saved for the SeeSpeak team.</p>
      <p className="text-sm">
        Each time you press Stop, the numbers from that try (loudness, pitch and the result) are saved so we
        can make the scoring better. They are copied to our public project page on GitHub. Your voice is never
        recorded or sent, and there is no name unless you type a nickname below. The lip page (/lab/lips) uses
        the same switch: it saves lip shape numbers and which sound you held, never camera pictures.
      </p>
      <label className="flex min-h-12 items-center gap-3 font-bold">
        <input
          type="checkbox"
          checked={labOn}
          onChange={(e) => {
            setLabOn(e.target.checked);
            setLabSharing(e.target.checked);
          }}
          className="h-6 w-6"
        />
        Save my tries on this page
      </label>
      <label className="flex min-h-12 items-center gap-3 font-bold">
        <input
          type="checkbox"
          checked={practiceOn}
          onChange={(e) => {
            setPracticeOn(e.target.checked);
            setSharing(e.target.checked);
          }}
          className="h-6 w-6"
        />
        Also save my tries on the practice screen (testers only)
      </label>
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
      <label className="flex flex-col gap-1 text-sm font-bold">
        Word you are saying, if it is not in the list above (optional)
        <input
          value={spoken}
          maxLength={30}
          onChange={(e) => setSpoken(e.target.value)}
          placeholder="cats"
          className="min-h-12 rounded-lg border-2 border-current bg-transparent px-2 font-normal"
        />
      </label>
      {frames && labOn && (
        <>
          <p className="font-bold">
            What did you really say? One tap tells us if the result was right. Check &quot;Score as&quot;
            first.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CHOICES.map((choice) => (
              <button
                key={choice.said}
                type="button"
                disabled={status === 'sending'}
                onClick={() => onSaid(choice.said)}
                className="min-h-12 rounded-xl border-2 border-current px-3 font-bold disabled:opacity-60"
              >
                {choice.text(word.target, other)}
              </button>
            ))}
          </div>
        </>
      )}
      <p role="status" className="min-h-6 text-sm font-bold">
        {status === 'sending' && 'Saving...'}
        {status === 'saved' && 'Try saved. Tap what you really said to make it more useful.'}
        {status === 'answered' && 'Saved with your answer. Thank you. Press Start for the next try.'}
        {status === 'failed' && 'Could not save this one. Check the connection.'}
        {status === 'off' && 'Not saved: saving is switched off on this device.'}
      </p>
    </section>
  );
}
