'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType } from 'react';
import { ChartIcon, DotsIcon, HomeIcon, ListCheckIcon } from './Icons';

type Tab = {
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  /** Paths that belong to this tab, so it stays lit on its inner screens. */
  match: (path: string) => boolean;
};

const CHECK_PATHS = ['/checks', '/profile', '/speech-check', '/listening-check', '/report'];

const TABS: Tab[] = [
  {
    // "Home", so every screen has an obvious way back home. Practice, plans and levels still light this tab.
    href: '/',
    label: 'Home',
    Icon: HomeIcon,
    match: (p) => p === '/' || p.startsWith('/practice') || p.startsWith('/plan') || p.startsWith('/levels'),
  },
  {
    href: '/checks',
    label: 'Checks',
    Icon: ListCheckIcon,
    match: (p) => CHECK_PATHS.some((c) => p.startsWith(c)),
  },
  { href: '/progress', label: 'Progress', Icon: ChartIcon, match: (p) => p.startsWith('/progress') },
  { href: '/more', label: 'More', Icon: DotsIcon, match: (p) => p.startsWith('/more') },
];

/**
 * The app's bottom tab bar (theme v2: always visible, 4 one-word tabs). The current tab shows a filled pill,
 * bold label and blue color, so it is never color alone. Not shown on the /lab tuning pages.
 */
export function TabBar() {
  const path = usePathname() ?? '/';
  if (path.startsWith('/lab')) return null;
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-md">
        {TABS.map(({ href, label, Icon, match }) => {
          const on = match(path);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={on ? 'page' : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs transition-colors ${
                  on ? 'font-bold text-accent-edge' : 'text-muted hover:text-foreground'
                }`}
              >
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${
                    on ? 'bg-accent-soft' : ''
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
