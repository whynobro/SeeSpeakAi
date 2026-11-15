import { ArrowRightIcon, MicIcon, RestartIcon } from '@/components/Icons';
import { buttonClass } from '@/components/ui';

const LINK =
  'inline-flex min-h-11 w-full items-center justify-center px-2 text-base font-bold text-accent-edge underline underline-offset-4 decoration-2';

/**
 * The one action after a try is scored. It sits where the Start button was.
 * - The try did not count: one big "Try again" (starts listening at once), a small skip link under it,
 *   and, if an adult can still mark it right, a small link for that.
 * - The try counted: "Next word" (or "Finish") with a small attached "Again" half, as one button.
 */
export function ResultAction({
  counted,
  last,
  onAgain,
  onNext,
  onAdult,
}: {
  counted: boolean;
  last: boolean;
  onAgain: () => void;
  onNext: () => void;
  /** Given only when the try did not count and an adult has not marked it right yet. */
  onAdult?: () => void;
}) {
  if (counted) {
    return (
      <div className="flex min-h-16 w-full overflow-hidden rounded-xl border border-accent">
        <button
          type="button"
          onClick={onNext}
          className="flex min-h-16 flex-1 items-center justify-center gap-3 bg-accent px-5 text-xl font-bold text-accent-ink transition-[transform,background-color] duration-75 select-none hover:bg-accent-edge active:bg-accent-edge"
        >
          {last ? 'Finish' : 'Next word'}
          {!last && <ArrowRightIcon className="h-6 w-6" />}
        </button>
        <button
          type="button"
          onClick={onAgain}
          aria-label="Try this word again"
          className="flex min-h-16 min-w-[96px] items-center justify-center gap-2 border-l border-accent bg-surface px-4 text-base font-bold text-accent-edge transition-[transform,background-color] duration-75 select-none hover:bg-accent-soft active:bg-accent-soft"
        >
          <RestartIcon className="h-5 w-5" />
          Again
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-1">
      <button type="button" onClick={onAgain} className={buttonClass({ size: 'xl' })}>
        <MicIcon className="h-7 w-7" />
        Try again
      </button>
      <button type="button" onClick={onNext} className={LINK}>
        {last ? 'Finish' : 'Skip to the next word'}
      </button>
      {onAdult && (
        <button type="button" onClick={onAdult} className={LINK}>
          An adult heard it right
        </button>
      )}
    </div>
  );
}
