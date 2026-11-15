import Link from 'next/link';
import type { ComponentPropsWithoutRef, ElementType, HTMLAttributes, ReactNode } from 'react';

/*
 * Shared "clay" building blocks. Every screen uses these so buttons and cards look and press the same.
 * Buttons sit on a darker bottom edge and press down onto it when tapped.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'violet' | 'danger' | 'ghost';
export type ButtonSize = 'md' | 'lg' | 'xl';

const BASE =
  'inline-flex items-center justify-center gap-3 rounded-2xl text-center font-bold select-none transition-[transform,box-shadow] duration-75 disabled:cursor-not-allowed disabled:opacity-60';

// Pressed: the button moves down by the height of its edge and the edge disappears.
const PRESS = 'active:translate-y-1 active:shadow-none';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: `bg-accent text-accent-ink shadow-edge-accent ${PRESS}`,
  secondary: `border-2 border-accent bg-surface text-accent-edge shadow-edge-accent ${PRESS}`,
  violet: `bg-violet text-violet-ink shadow-edge-violet ${PRESS}`,
  danger: `border-2 border-miss-ink bg-surface text-miss-ink shadow-edge-miss ${PRESS}`,
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

/** A chunky button. Pass `href` to make it a Next link that looks the same. */
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

const EDGE_PLAIN = 'border-2 border-line shadow-clay';
const EDGE_HIGHLIGHT = 'border-4 border-accent shadow-edge-accent';

type CardTag = 'div' | 'section' | 'li' | 'article' | 'header' | 'footer';

/** A white rounded card that sits on a light bottom edge. `highlight` gives it a thick blue border and edge. */
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
      className={`rounded-3xl p-5 ${highlight ? EDGE_HIGHLIGHT : EDGE_PLAIN} ${CARD_TONES[tone]} ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}

export type TileTone = 'accent' | 'violet' | 'hit' | 'soft' | 'violet-soft';
export type TileSize = 'sm' | 'md' | 'lg';

const TILE_TONES: Record<TileTone, string> = {
  accent: 'bg-accent text-accent-ink shadow-edge-accent',
  violet: 'bg-violet text-violet-ink shadow-edge-violet',
  hit: 'bg-hit text-hit-ink shadow-edge-hit',
  soft: 'bg-accent-soft text-accent-edge shadow-edge-line',
  'violet-soft': 'bg-violet-soft text-violet-edge shadow-edge-line',
};

const TILE_SIZES: Record<TileSize, string> = {
  sm: 'h-10 w-10 rounded-xl',
  md: 'h-14 w-14 rounded-2xl',
  lg: 'h-16 w-16 rounded-2xl',
};

/** A rounded square with a colored fill and edge, holding an icon or a big letter. Decorative by default. */
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

/** The SeeSpeak mark: a baby blue clay tile over a tilted tan one, with sound waves. */
export function LogoTile({ size = 96 }: { size?: number }) {
  return (
    <span aria-hidden="true" className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <span className="absolute inset-0 translate-x-[8%] translate-y-[6%] rotate-[10deg] rounded-[28%] bg-violet shadow-edge-violet" />
      <span className="absolute inset-0 flex items-center justify-center rounded-[28%] bg-accent shadow-[0_6px_0_var(--accent-edge)]">
        <svg
          viewBox="0 0 24 24"
          width={size * 0.5}
          height={size * 0.5}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.6}
          strokeLinecap="round"
          className="text-accent-ink"
        >
          <path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2" />
        </svg>
      </span>
    </span>
  );
}
