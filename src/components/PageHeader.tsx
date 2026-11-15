import type { ReactNode, Ref } from 'react';
import { ArrowLeftIcon } from './Icons';
import { Button } from './ui';

/*
 * The page frame and the page title, shared by every inner screen so they line up with each other and with home:
 * the same width, the same top space, the same back link and the same title size.
 */

/** A section heading inside a page (one size everywhere, home included). */
export const SECTION_TITLE = 'text-[20px] leading-snug font-extrabold tracking-tight';

/** The page frame: one column, phone width, the same side and top space on every inner screen. */
export function Screen({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <main className={`mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-6 pb-10 ${className}`.trim()}>
      {children}
    </main>
  );
}

/** A back link to the screen above, with an arrow. At least 48 px tall. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Button href={href} variant="ghost" block={false} className="-ml-2 self-start">
      <ArrowLeftIcon className="h-5 w-5" />
      {label}
    </Button>
  );
}

/**
 * The top of a page: an optional back link, an optional small line above the title, the title and an optional
 * intro line. `ref` goes to the title, so a page can move focus to it (it takes focus from code only).
 * `aside` is for one small thing in the top right corner.
 */
export function PageHeader({
  back,
  eyebrow,
  title,
  lede,
  children,
  aside,
  ref,
}: {
  back?: { href: string; label: string };
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  /** Anything else that belongs under the title. */
  children?: ReactNode;
  /** Something pinned to the top right corner, level with the back link (the practice bird). It brings its own position. */
  aside?: ReactNode;
  ref?: Ref<HTMLHeadingElement>;
}) {
  return (
    <header className={`flex flex-col gap-2 ${aside ? 'relative' : ''}`.trim()}>
      {aside}
      {back && <BackLink href={back.href} label={back.label} />}
      {eyebrow && <p className="text-[15px] font-bold text-muted">{eyebrow}</p>}
      <h1
        ref={ref}
        tabIndex={ref ? -1 : undefined}
        className="text-[28px] leading-tight font-extrabold tracking-tight text-balance outline-none"
      >
        {title}
      </h1>
      {lede && <p className="text-[17px] leading-snug font-medium text-muted">{lede}</p>}
      {children}
    </header>
  );
}
