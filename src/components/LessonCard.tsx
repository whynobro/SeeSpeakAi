import Link from 'next/link';
import { wordsFor } from '@/content/words';
import type { TargetPick } from '@/lib/types';
import { ArrowRightIcon, StarIcon } from './Icons';

function triesText(attempts: number): string {
  if (attempts === 0) return 'No tries yet';
  return attempts === 1 ? '1 try' : `${attempts} tries`;
}

/** One big tappable lesson for one sound. The first card on the home screen is the primary action. */
export function LessonCard({
  pick,
  attempts,
  primary,
}: {
  pick: TargetPick;
  attempts: number;
  primary: boolean;
}) {
  const words = wordsFor(pick.sound, 3).map((w) => w.text);
  const recommended = pick.risk === 'high' || pick.risk === 'some';
  const look = primary
    ? 'bg-accent text-accent-ink'
    : 'bg-surface text-foreground border-2 border-foreground';

  return (
    <Link
      href={`/practice?sound=${pick.sound}`}
      className={`flex min-h-28 items-center gap-4 rounded-2xl p-4 shadow-sm ${look}`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {recommended && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full border-2 border-current px-2 py-0.5 text-sm font-bold">
            <StarIcon className="h-4 w-4" />
            Recommended for you
          </span>
        )}
        <span className="text-4xl font-bold">&ldquo;{pick.sound}&rdquo;</span>
        <span className="text-lg">{words.join(', ')}</span>
        <span className={primary ? 'text-sm' : 'text-sm text-muted'}>{triesText(attempts)}</span>
      </div>
      <ArrowRightIcon className="h-8 w-8 shrink-0" />
    </Link>
  );
}
