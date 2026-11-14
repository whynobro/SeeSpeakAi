'use client';

import { useEffect, useState } from 'react';
import { scoreAttempt } from '@/lib/scoring';
import { getLabel, isSharing, setLabel, setSharing, shareLabAttempt, type Said } from '@/lib/testlog';
import type { FrameFeatures, PracticeWord } from '@/lib/types';

const CHOICES: { said: Said; text: (sound: string, other: string) => string }[] = [
  { said: 'with-sound', text: (sound) => `I said the "${sound}"` },
  { said: 'without-sound', text: (sound) => `I left the "${sound}" out` },
  { said: 'other-sound', text: (_sound, other) => `I said "${other}" instead` },
  { said: 'unsure', text: () => 'Not sure' },
];

/**
 * The switch for the shared test log, and the "what did you really say?" buttons.
 * Off by default. While on, every try on this device (here and on the practice screen) sends its numbers
 * to the team's private store. Never audio.
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
  const [on, setOn] = useState(false);
  const [label, setLabelState] = useState('');
  const [spoken, setSpoken] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'saved' | 'failed'>('idle');

  // Storage is read after the first paint, never during render.
  useEffect(() => {
    const timer = setTimeout(() => {
      setOn(isSharing());
      setLabelState(getLabel());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // A new recording needs a new answer.
  useEffect(() => {
    const timer = setTimeout(() => setStatus('idle'), 0);
    return () => clearTimeout(timer);
  }, [frames]);

  function onSwitch(next: boolean) {
    setOn(next);
    setSharing(next);
  }

  async function onSaid(said: Said) {
    if (!frames) return;
    setStatus('sending');
    const id = spoken.trim().toLowerCase().slice(0, 30) || `lab-${word.target}-${word.position}`;
    const stored = await shareLabAttempt(
      { ...word, id, text: id },
      scoreAttempt(frames, word),
      frames,
      sampleRate,
      said,
    );
    setStatus(stored ? 'saved' : 'failed');
  }

  const other = word.target === 's' ? 'sh' : 's';

  return (
    <section className="flex flex-col gap-3 rounded-xl border-2 border-current p-3">
      <label className="flex min-h-12 items-center gap-3 font-bold">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => onSwitch(e.target.checked)}
          className="h-6 w-6"
        />
        Share my test results with the SeeSpeak team
      </label>
      <p className="text-sm">
        For testers. While this is on, every try on this device, here and on the practice screen, sends its
        numbers (loudness, pitch and the result) to the team so we can make the scoring better. Your voice is
        never sent. Switch it off any time.
      </p>
      {on && (
        <>
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
          {frames && (
            <>
              <label className="flex flex-col gap-1 text-sm font-bold">
                Word you were saying (optional)
                <input
                  value={spoken}
                  maxLength={30}
                  onChange={(e) => setSpoken(e.target.value)}
                  placeholder="cats"
                  className="min-h-12 rounded-lg border-2 border-current bg-transparent px-2 font-normal"
                />
              </label>
              <p className="font-bold">
                What did you really say? Check the &quot;Score as&quot; settings first, then tap one to save
                this try.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {CHOICES.map((choice) => (
                  <button
                    key={choice.said}
                    type="button"
                    disabled={status === 'sending' || status === 'saved'}
                    onClick={() => onSaid(choice.said)}
                    className="min-h-12 rounded-xl border-2 border-current px-3 font-bold disabled:opacity-60"
                  >
                    {choice.text(word.target, other)}
                  </button>
                ))}
              </div>
              <p role="status" className="min-h-6 text-sm font-bold">
                {status === 'sending' && 'Saving...'}
                {status === 'saved' && 'Saved. Thank you. Press Start for the next try.'}
                {status === 'failed' && 'Could not save this one. Check the connection and tap again.'}
              </p>
            </>
          )}
        </>
      )}
    </section>
  );
}
