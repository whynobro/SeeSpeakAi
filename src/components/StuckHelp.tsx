import type { Ref } from 'react';
import { LightbulbIcon, SparkleIcon } from '@/components/Icons';
import type { StuckHelp as StuckHelpAnswer } from '@/lib/ai/stuck';

/** What goes out when the bird is tapped. Shown while the request runs and under the answer. */
const SENDS_LINE = 'Sends the numbers from your last tries, never your voice or picture.';

/*
 * "A closer look", asked for by tapping the bird (there is no separate button). Nothing is sent until the
 * learner taps it, and the line next to the answer says what goes out.
 * The answer is a pattern, up to three steps and a kind closing line. It never changes a verdict.
 * `ref` goes to the block, so the screen can scroll it into view.
 */
export function StuckHelp({
  loading,
  help,
  failed,
  ref,
}: {
  loading: boolean;
  help: StuckHelpAnswer | null;
  failed: boolean;
  ref?: Ref<HTMLDivElement>;
}) {
  if (!loading && !help && !failed) return null;
  return (
    <div ref={ref} aria-live="polite" className="flex scroll-mt-4 flex-col gap-2">
      {loading && (
        <div className="flex flex-col gap-1">
          <p className="px-1 text-lg font-bold">Taking a closer look...</p>
          <p className="px-1 text-sm text-muted">{SENDS_LINE}</p>
        </div>
      )}
      {failed && !loading && (
        <p role="status" className="px-1 text-base font-bold">
          That did not work just now. Tap the bird to try again.
        </p>
      )}
      {help && (
        <section
          aria-labelledby="closer-look-title"
          className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 motion-safe:animate-rise"
        >
          <h2 id="closer-look-title" className="flex items-center gap-2 text-lg font-extrabold">
            <LightbulbIcon className="h-5 w-5 shrink-0 text-accent-edge" />A closer look
          </h2>
          <p className="text-lg leading-relaxed">{help.pattern}</p>
          <ol className="flex list-decimal flex-col gap-2 pl-6 text-base leading-relaxed marker:font-bold">
            {help.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="text-base leading-relaxed">{help.closing}</p>
          <p className="flex items-center gap-1.5 text-sm text-muted">
            {help.source === 'ai' && <SparkleIcon className="h-4 w-4" />}
            {help.source === 'ai' ? 'Made by Claude' : 'Built-in tip'}
          </p>
          <p className="text-sm text-muted">{SENDS_LINE}</p>
        </section>
      )}
    </div>
  );
}
