import Link from 'next/link';
import type { ComponentPropsWithoutRef, ElementType, HTMLAttributes, ReactNode } from 'react';

/*
 * Shared building blocks. Every screen uses these so buttons and cards look and press the same.
 * Flat, per theme v2 (docs/design/theme-v2.md): 1 px borders, no bottom-edge shadows. A tap responds at once
 * with a slight shrink and a darker fill, so the press is still felt without the old "clay" edge.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'violet' | 'danger' | 'ghost';
export type ButtonSize = 'md' | 'lg' | 'xl';

const BASE =
  'inline-flex items-center justify-center gap-3 rounded-2xl text-center font-bold select-none transition-[transform,background-color] duration-75 disabled:cursor-not-allowed disabled:opacity-60';

// Pressed: a slight shrink. Each variant also darkens its fill on hover and press.
const PRESS = 'active:scale-[0.98]';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: `bg-accent text-accent-ink hover:bg-accent-edge active:bg-accent-edge ${PRESS}`,
  secondary: `border border-accent bg-surface text-accent-edge hover:bg-accent-soft active:bg-accent-soft ${PRESS}`,
  violet: `bg-violet text-violet-ink hover:brightness-95 active:brightness-90 ${PRESS}`,
  danger: `border border-miss-ink bg-surface text-miss-ink hover:bg-miss-soft active:bg-miss-soft ${PRESS}`,
  ghost: 'text-accent-edge underline underline-offset-4 decoration-2',
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
