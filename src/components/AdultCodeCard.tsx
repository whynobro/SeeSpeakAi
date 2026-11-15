'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import { Button, Card } from '@/components/ui';
import { checkAdultCode, clearAdultCode, hasAdultCode, isValidAdultCode, setAdultCode } from '@/lib/override';

type Mode = 'idle' | 'set' | 'change' | 'remove';

const FIELD =
  'min-h-14 w-full rounded-xl border-2 border-line bg-surface px-4 text-center text-2xl font-bold tracking-[0.3em] text-foreground focus-visible:border-accent focus-visible:outline-none';

const digitsOnly = (value: string) => value.replace(/\D/g, '').slice(0, 6);

/**
 * The More tab card where a parent or speech therapist sets, changes or removes the adult code.
 * The code is 4 to 6 digits, kept on this device only. Changing or removing it asks for the current code first.
 */
export function AdultCodeCard() {
  const [saved, setSaved] = useState<boolean | null>(null);
  const [mode, setMode] = useState<Mode>('idle');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const ids = useId();

  // Storage is read after the page loads, never during render.
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setSaved(hasAdultCode());
    });
    return () => {
      active = false;
    };
  }, []);

  function open(m: Mode, message = '') {
    setMode(m);
    setCurrent('');
    setNext('');
    setError('');
    setNote(message);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if ((mode === 'change' || mode === 'remove') && !checkAdultCode(current)) {
      setError('That code is not right.');
      return;
    }
    if (mode === 'remove') {
      clearAdultCode();
      setSaved(false);
      open('idle', 'The adult code is removed.');
      return;
    }
    if (!isValidAdultCode(next)) {
      setError('Use 4 to 6 digits.');
      return;
    }
    setAdultCode(next);
    setSaved(true);
    open('idle', 'The adult code is saved on this device.');
  }

  const title = mode === 'remove' ? 'Remove the code' : mode === 'change' ? 'Change the code' : 'Set a code';
  const askCurrent = mode === 'change' || mode === 'remove';
  const askNew = mode === 'set' || mode === 'change';

  return (
    <Card as="section" aria-labelledby="adult-code-title" id="adult-code" className="flex flex-col gap-3">
      <h2 id="adult-code-title" className="text-[20px] leading-snug font-bold">
        For parents and speech therapists
      </h2>
      <p className="text-[17px] leading-snug">
        With a code, an adult can mark a try right when the app got it wrong.
      </p>
      <p className="text-[15px] leading-snug text-muted">
        The code stays on this device. The score on screen and your progress numbers do not change.
      </p>

      {mode === 'idle' && saved !== null && (
        <>
          <p className="text-[17px] font-bold" role="status">
            {note || (saved ? 'An adult code is set.' : 'No adult code yet.')}
          </p>
          {saved ? (
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => open('change')}>
                Change code
              </Button>
              <Button variant="danger" onClick={() => open('remove')}>
                Remove code
              </Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => open('set')}>
              Set a code
            </Button>
          )}
        </>
      )}

      {mode !== 'idle' && (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <p className="text-[17px] font-bold">{title}</p>
          {askCurrent && (
            <div className="flex flex-col gap-1">
              <label htmlFor={`${ids}-current`} className="text-[15px] font-bold">
                Current code
              </label>
              <input
                id={`${ids}-current`}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                maxLength={6}
                value={current}
                onChange={(e) => setCurrent(digitsOnly(e.target.value))}
                className={FIELD}
              />
            </div>
          )}
          {askNew && (
            <div className="flex flex-col gap-1">
              <label htmlFor={`${ids}-new`} className="text-[15px] font-bold">
                {mode === 'change' ? 'New code' : 'Code'}, 4 to 6 digits
              </label>
              <input
                id={`${ids}-new`}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                maxLength={6}
                value={next}
                onChange={(e) => setNext(digitsOnly(e.target.value))}
                className={FIELD}
              />
            </div>
          )}
          {error && (
            <p role="alert" className="text-[17px] font-bold text-miss-ink">
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Button type="submit" variant={mode === 'remove' ? 'danger' : 'primary'}>
              {mode === 'remove' ? 'Remove' : 'Save'}
            </Button>
            <Button variant="secondary" onClick={() => open('idle')}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
