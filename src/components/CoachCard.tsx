import type { CoachFeedback } from '@/lib/types';
import { LightbulbIcon, SparkleIcon } from './Icons';

/*
 * The coach's sentence after a try, shown under the verdict. The verdict comes from the phone at once;
 * this arrives a moment later and never replaces it. If the call fails, nothing extra shows.
 * TODO(Holly): move the wording below into src/content/ when it is final.
 */
export function CoachCard({ feedback, loading }: { feedback: CoachFeedback | null; loading: boolean }) {
  return (
    // Polite live region: screen readers read the sentence when it arrives, without interrupting.
    <div aria-live="polite" className="empty:hidden">
      {loading && (
        <p className="flex items-center gap-2 px-1 text-base text-muted">
          <span aria-hidden="true" className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-muted motion-safe:animate-pulse"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </span>
          Coach is thinking
        </p>
      )}
      {!loading && feedback && (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 motion-safe:animate-rise">
          <p className="text-lg leading-relaxed">{feedback.message}</p>
          {feedback.cue && (
            <p className="flex items-start gap-2 rounded-lg bg-accent-soft p-3 text-base leading-relaxed">
              <LightbulbIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent-edge" />
              <span>{feedback.cue}</span>
            </p>
          )}
          {/* Honest about who did what: the phone scores, and the words come from Claude only when it wrote them. */}
          <p className="flex items-center gap-1.5 text-sm text-muted">
            {feedback.source === 'ai' && <SparkleIcon className="h-4 w-4" />}
            {feedback.source === 'ai'
              ? 'Scored by the phone. Words by Claude.'
              : 'Scored by the phone. Words from built-in tips.'}
          </p>
        </div>
      )}
    </div>
  );
}
