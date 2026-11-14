import Link from 'next/link';
import { wordsFor } from '@/content/words';
import type { TargetPick } from '@/lib/types';
import { ArrowRightIcon, StarIcon } from './Icons';
import { IconTile } from './ui';

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
  // The primary card has a thick blue border and edge, so it stands out without relying on color alone.
  const look = primary ? 'border-4 border-accent shadow-edge-accent' : 'border-2 border-line shadow-clay';

  return (
    <Link
      href={`/practice?sound=${pick.sound}`}
      className={`flex items-center gap-4 rounded-3xl bg-surface p-4 transition-[transform,box-shadow] duration-75 active:translate-y-1 active:shadow-none ${look}`}
    >
      <IconTile tone={primary ? 'accent' : 'soft'} size="lg" className="text-3xl font-extrabold">
        {pick.sound}
      </IconTile>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {recommended && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full whitespace-nowrap bg-violet-soft px-3 py-1 text-sm font-bold text-violet-edge">
            <StarIcon className="h-4 w-4" />
            Recommended for you
          </span>
        )}
        <span className="text-2xl font-extrabold">&ldquo;{pick.sound}&rdquo; sound</span>
        <span className="text-base">{words.join(', ')}</span>
        <span className="text-sm text-muted">{triesText(attempts)}</span>
      </div>
      <ArrowRightIcon className="h-7 w-7 shrink-0 text-accent-edge" />
    </Link>
  );
}
