import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronRightIcon, EarIcon, MicIcon, UploadIcon } from './Icons';

/** One row in a grouped list. The whole row is the tap target. */
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
    <li className="border-t border-line first:border-t-0">
      <Link
        href={href}
        className="group flex min-h-20 items-center gap-4 px-4 py-4 transition-colors duration-150 hover:bg-accent-soft/60 active:bg-accent-soft"
      >
        <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center">
          {icon}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[17px] leading-snug font-bold">{title}</span>
          <span className="text-[15px] text-muted">{detail}</span>
        </span>
        <ChevronRightIcon className="h-5 w-5 shrink-0 text-muted transition-transform duration-150 group-hover:translate-x-0.5" />
      </Link>
    </li>
  );
}

/**
 * The four ways to start, as one grouped list (theme v2: grouped rows, not floating cards).
 * Used on the home screen for a first visit and on the Checks tab.
 */
export function CheckList() {
  return (
    <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
      <ListRow
        href="/profile"
        title="Hearing check"
        detail="Which sounds reach you · about 1 minute"
        icon={<EarIcon className="h-6 w-6 text-accent-edge" />}
      />
      <ListRow
        href="/speech-check"
        title="Speech check"
        detail="Say 18 words · about 2 to 3 minutes"
        icon={<MicIcon className="h-6 w-6 text-accent-edge" />}
      />
      <ListRow
        href="/listening-check"
        title="Listening check"
        detail="Tell sounds and words apart · about 2 minutes"
        icon={<EarIcon className="h-6 w-6 text-accent-edge" />}
      />
      <ListRow
        href="/report"
        title="Upload a previous report"
        detail="From a speech therapist or audiologist"
        icon={<UploadIcon className="h-6 w-6 text-accent-edge" />}
      />
    </ul>
  );
}
