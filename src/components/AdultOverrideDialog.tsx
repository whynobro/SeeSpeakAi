'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui';
import { checkAdultCode, hasAdultCode } from '@/lib/override';

/**
 * The "An adult heard it right" box. A modal dialog on the page (no browser prompt), with a numeric code field.
 * `onRight` runs after the right code. With no code set yet, it points to the More tab instead.
 */
export function AdultOverrideDialog({
  open,
  onClose,
  onRight,
}: {
  open: boolean;
  onClose: () => void;
  onRight: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [hasCode, setHasCode] = useState(true);
  const id = useId();

  // Open and close the native dialog (it traps focus and closes on Escape).
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      queueMicrotask(() => {
        setCode('');
        setError('');
        setHasCode(hasAdultCode());
      });
      dialog.showModal();
    } else if (!open && dialog.open) dialog.close();
  }, [open]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!checkAdultCode(code)) {
      setError('That code is not right.');
      setCode('');
      return;
    }
    onRight();
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={`${id}-title`}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border-2 border-accent bg-surface p-5 text-foreground backdrop:bg-foreground/50"
    >
      <form onSubmit={submit} className="flex flex-col gap-3">
        <h2 id={`${id}-title`} className="text-[22px] leading-tight font-extrabold">
          An adult heard it right
        </h2>
        {hasCode ? (
          <>
            <label htmlFor={`${id}-code`} className="text-[17px] leading-snug">
              Adult code
            </label>
            <input
              id={`${id}-code`}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="min-h-14 w-full rounded-xl border-2 border-line bg-surface px-4 text-center text-2xl font-bold tracking-[0.3em] focus-visible:border-accent focus-visible:outline-none"
            />
            {error && (
              <p role="alert" className="text-[17px] font-bold text-miss-ink">
                {error}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Button type="submit">Mark right</Button>
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-[17px] leading-snug">
              No adult code yet. A parent or therapist can set one in More.
            </p>
            <Link
              href="/more#adult-code"
              className="flex min-h-14 items-center justify-center rounded-xl bg-accent px-5 text-lg font-bold text-accent-ink"
            >
              Go to More
            </Link>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </>
        )}
      </form>
    </dialog>
  );
}
