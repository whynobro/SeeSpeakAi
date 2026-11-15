import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronRightIcon, EarIcon, HeadphonesIcon, MicIcon, UploadIcon } from './Icons';

/**
 * One check, as a panel in the grid: a one-color icon above the title and a short line. The whole panel is the
 * tap target. Small corners and no colored icon tiles (redesign, Nov 14).
 */
export function ListRow({
  href,
  title,
  detail,
  icon,
}: {
  href: string;
  title: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group relative flex h-full min-h-36 flex-col items-start gap-2.5 rounded-md border border-line bg-surface p-[18px] transition-colors duration-150 hover:border-foreground/30 active:bg-accent-soft"
      >
        <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center text-foreground">
          {icon}
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[17px] leading-snug font-extrabold">{title}</span>
          <span className="text-[15px] leading-snug text-muted">{detail}</span>
        </span>
        <ChevronRightIcon className="absolute top-[18px] right-4 h-5 w-5 text-foreground/55 transition-transform duration-150 group-hover:translate-x-0.5" />
      </Link>
    </li>
  );
}

/**
 * The four ways to start, as a grid of panels: two by two on a phone, four in a row when there is room.
 * Used on the home screen for a first visit and on the Checks tab.
 */
export function CheckList() {
  return (
    <ul className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">
      <ListRow
        href="/profile"
        title="Hearing check"
        detail="Which sounds reach you · about 1 minute"
        icon={<EarIcon className="h-6 w-6" />}
      />
      <ListRow
        href="/speech-check"
        title="Speech check"
        detail="Say 18 words · about 2 to 3 minutes"
        icon={<MicIcon className="h-6 w-6" />}
      />
      <ListRow
        href="/listening-check"
        title="Listening check"
        detail="Tell sounds and words apart · about 2 minutes"
        icon={<HeadphonesIcon className="h-6 w-6" />}
      />
      <ListRow
        href="/report"
        title="Upload a previous report"
        detail="From a speech therapist or audiologist"
        icon={<UploadIcon className="h-6 w-6" />}
      />
    </ul>
  );
}
