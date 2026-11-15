import Link from 'next/link';
import type { ComponentPropsWithoutRef, ElementType, HTMLAttributes, KeyboardEvent, ReactNode } from 'react';

/*
 * Shared building blocks. Every screen uses these so buttons and cards look and press the same.
 * Flat, per theme v2 (docs/design/theme-v2.md): 1 px borders, no bottom-edge shadows. A tap responds at once
 * with a slight shrink and a darker fill, so the press is still felt without the old "clay" edge.
 * Buttons are pills and groups use hairline dividers (theme v2 step 4, after the ORYZO style reference).
 */

export type ButtonVariant = 'primary' | 'secondary' | 'violet' | 'danger' | 'ghost';
export type ButtonSize = 'md' | 'lg' | 'xl';

const BASE =
  'inline-flex items-center justify-center gap-3 rounded-full text-center font-bold select-none transition-[transform,background-color] duration-75 disabled:cursor-not-allowed disabled:opacity-60';

// Pressed: a slight shrink. Each variant also darkens its fill on hover and press.
const PRESS = 'active:scale-[0.98]';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: `bg-accent text-accent-ink hover:bg-accent-edge active:bg-accent-edge ${PRESS}`,
  secondary: `border border-accent bg-surface text-accent-edge hover:bg-accent-soft active:bg-accent-soft ${PRESS}`,
  violet: `bg-violet text-violet-ink hover:brightness-95 active:brightness-90 ${PRESS}`,
  danger: `border border-miss-ink bg-surface text-miss-ink hover:bg-miss-soft active:bg-miss-soft ${PRESS}`,
  ghost: 'rounded-xl text-accent-edge underline underline-offset-4 decoration-2',
};

const SIZES: Record<ButtonSize, string> = {
  md: 'min-h-14 px-5 text-lg',
  lg: 'min-h-16 px-6 text-xl',
  xl: 'min-h-[72px] px-6 text-2xl',
};

export function buttonClass({
  variant = 'primary',
  size = 'md',
  block = true,
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
} = {}): string {
  const ghostSize = variant === 'ghost' ? 'min-h-12 px-2 text-lg' : SIZES[size];
  return `${BASE} ${VARIANTS[variant]} ${ghostSize} ${block ? 'w-full' : ''} ${className}`.trim();
}

type StyleProps = { variant?: ButtonVariant; size?: ButtonSize; block?: boolean; className?: string };

type AsButton = StyleProps & ComponentPropsWithoutRef<'button'> & { href?: undefined };
type AsLink = StyleProps & Omit<ComponentPropsWithoutRef<typeof Link>, 'className'> & { href: string };

/** A large flat button. Pass `href` to make it a Next link that looks the same. */
export function Button(props: AsButton | AsLink) {
  if (props.href !== undefined) {
    const { variant, size, block, className, ...rest } = props;
    return <Link {...rest} className={buttonClass({ variant, size, block, className })} />;
  }
  const { variant, size, block, className, type = 'button', ...rest } = props;
  return <button {...rest} type={type} className={buttonClass({ variant, size, block, className })} />;
}

export type CardTone = 'surface' | 'accent' | 'violet';

const CARD_TONES: Record<CardTone, string> = {
  surface: 'bg-surface',
  accent: 'bg-accent-soft',
  violet: 'bg-violet-soft',
};

const EDGE_PLAIN = 'border border-line';
const EDGE_HIGHLIGHT = 'border-2 border-accent';

type CardTag = 'div' | 'section' | 'li' | 'article' | 'header' | 'footer';

/** A white rounded card with a thin border. `highlight` gives it a thicker teal border. */
export function Card({
  as = 'div',
  tone = 'surface',
  highlight = false,
  className = '',
  children,
  ...rest
}: {
  as?: CardTag;
  tone?: CardTone;
  highlight?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'>) {
  const Tag: ElementType = as;
  return (
    <Tag
      {...rest}
      className={`rounded-2xl p-5 ${highlight ? EDGE_HIGHLIGHT : EDGE_PLAIN} ${CARD_TONES[tone]} ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}

export type TileTone = 'accent' | 'violet' | 'hit' | 'soft' | 'violet-soft';
export type TileSize = 'sm' | 'md' | 'lg';

const TILE_TONES: Record<TileTone, string> = {
  accent: 'bg-accent text-accent-ink',
  violet: 'bg-violet text-violet-ink',
  hit: 'bg-hit text-hit-ink',
  soft: 'bg-accent-soft text-accent-edge',
  'violet-soft': 'bg-violet-soft text-violet-edge',
};

const TILE_SIZES: Record<TileSize, string> = {
  sm: 'h-10 w-10 rounded-xl',
  md: 'h-14 w-14 rounded-2xl',
  lg: 'h-16 w-16 rounded-2xl',
};

/** A rounded square with a colored fill, holding an icon or a big letter. Decorative by default. */
export function IconTile({
  tone = 'accent',
  size = 'md',
  className = '',
  children,
}: {
  tone?: TileTone;
  size?: TileSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center ${TILE_SIZES[size]} ${TILE_TONES[tone]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}

/**
 * A small label above a group, in capitals with wide spacing. Labels only: headings and body text stay
 * in sentence case so they are easy to read.
 */
export function SectionLabel({
  as = 'p',
  id,
  className = '',
  children,
}: {
  as?: 'p' | 'h2' | 'h3' | 'legend';
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  const Tag: ElementType = as;
  return (
    <Tag
      id={id}
      className={`text-[13px] font-bold tracking-[0.08em] text-muted uppercase ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}

/** Rows in one rounded box, split by hairlines. Children should be `<li>` rows (see `GroupedRow`). */
export function GroupedList({
  label,
  className = '',
  children,
}: {
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <ul
      aria-label={label}
      className={`overflow-hidden rounded-2xl border border-line bg-surface ${className}`.trim()}
    >
      {children}
    </ul>
  );
}

/** One row of a `GroupedList`: something on the left, text in the middle, an optional value on the right. */
export function GroupedRow({
  lead,
  title,
  detail,
  trail,
}: {
  lead?: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  trail?: ReactNode;
}) {
  return (
    <li className="flex min-h-14 items-center gap-3 border-t border-line px-4 py-3 first:border-t-0">
      {lead}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[17px] font-bold">{title}</span>
        {detail && <span className="text-[15px] text-muted">{detail}</span>}
      </span>
      {trail}
    </li>
  );
}

/** A hairline dashed line between sections. Use sparingly, only where it separates real groups. */
export function Divider({ className = '' }: { className?: string }) {
  return <hr className={`border-0 border-t border-dashed border-line ${className}`.trim()} />;
}

/**
 * A pill of choices where exactly one is picked (age, hearing devices). Works as a radio group: arrow keys
 * move the choice. The picked one gets a white fill, a teal border, bold text and a check icon, so the
 * choice never depends on color alone. Each segment is at least 48 px tall and long labels wrap.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const step =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0;
    if (!step) return;
    e.preventDefault();
    const i = options.findIndex((o) => o.value === value);
    const next = options[(i + step + options.length) % options.length];
    onChange(next.value);
    const group = e.currentTarget;
    requestAnimationFrame(() => group.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus());
  }
  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="flex gap-1 rounded-full border border-line bg-background p-1"
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={`flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-1 text-center text-[16px] leading-tight transition-colors duration-100 ${
              on
                ? 'border-2 border-accent bg-surface font-bold text-accent-edge'
                : 'border-2 border-transparent font-semibold text-foreground hover:bg-surface/70'
            }`}
          >
            {on && <CheckMark />}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function CheckMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
