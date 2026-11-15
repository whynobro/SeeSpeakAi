/** Tall bars for share of tries where the sound was there. Before is hatched, after and "so far" are solid. */

export type BarKind = 'before' | 'after';

export interface Bar {
  label: string;
  /** 0 to 1. */
  value: number;
  kind: BarKind;
}

// Diagonal stripes in the current text color, so "before" differs by pattern, not only by color.
const HATCH = {
  backgroundImage: 'repeating-linear-gradient(135deg, currentColor 0 3px, transparent 3px 9px)',
} as const;

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function OneBar({ bar }: { bar: Bar }) {
  const height = Math.max(0, Math.min(1, bar.value)) * 100;
  return (
    <figure className="flex w-24 flex-col items-center gap-2">
      <div
        className="relative flex h-44 w-full items-end overflow-hidden rounded-xl border border-line bg-accent-soft"
        role="img"
        aria-label={`${bar.label}: ${percent(bar.value)}`}
      >
        {bar.kind === 'before' ? (
          <div
            className="w-full rounded-t-xl border-2 border-muted bg-surface text-muted"
            style={{ ...HATCH, height: `${height}%` }}
          />
        ) : (
          <div className="w-full rounded-t-xl bg-accent" style={{ height: `${height}%` }} />
        )}
      </div>
      <figcaption className="flex flex-col items-center text-center">
        <span className="text-2xl font-extrabold">{percent(bar.value)}</span>
        <span className="text-sm leading-tight font-semibold">{bar.label}</span>
      </figcaption>
    </figure>
  );
}

export function BeforeAfterBars({ bars }: { bars: Bar[] }) {
  return (
    <div className="flex items-end justify-center gap-6">
      {bars.map((bar) => (
        <OneBar key={bar.label} bar={bar} />
      ))}
    </div>
  );
}
