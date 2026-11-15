import { Button } from '@/components/ui';
import { LightbulbIcon, SparkleIcon } from '@/components/Icons';
import type { StuckHelp as StuckHelpAnswer } from '@/lib/ai/stuck';

/*
 * "Stuck? Ask Claude for a closer look". The button shows after three tries in a row that did not count.
 * Nothing is sent until the learner taps it, and the line under the button says what goes out.
 * The answer is a pattern, up to three steps and a kind closing line. It never changes a verdict.
 */
export function StuckHelp({
  canAsk,
  loading,
  help,
  failed,
  onAsk,
}: {
  canAsk: boolean;
  loading: boolean;
  help: StuckHelpAnswer | null;
  failed: boolean;
  onAsk: () => void;
}) {
  if (!canAsk && !loading && !help) return null;
  return (
    <div aria-live="polite" className="flex flex-col gap-2">
      {(canAsk || loading) && (
        <div className="flex flex-col gap-1">
          <Button variant="secondary" size="md" onClick={onAsk} disabled={loading}>
            {loading ? 'Taking a closer look...' : 'Stuck? Ask Claude for a closer look'}
          </Button>
          <p className="px-1 text-sm text-muted">
            Sends the numbers from your last tries, never your voice or picture.
          </p>
          {failed && !loading && (
            <p role="status" className="px-1 text-sm font-bold">
              That did not work just now. You can tap the button again.
            </p>
          )}
        </div>
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
        </section>
      )}
    </div>
  );
}
