import type { TargetSound, Verdict } from '@/lib/types';

function Icon({ verdict, target }: { verdict: Verdict; target: TargetSound }) {
  const common = {
    width: 64,
    height: 64,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    className: 'shrink-0',
  };
  if (verdict === 'hit') {
    return (
      <svg {...common}>
        <path d="M4 12.5l5.5 5.5L20 6.5" />
      </svg>
    );
  }
  if (verdict === 'close') {
    // Points toward the target's side of the meter: "s" is on the right, "sh" on the left.
    return (
      <svg {...common}>
        {target === 's' ? <path d="M4 12h15M13 6l6 6-6 6" /> : <path d="M20 12H5M11 6l-6 6 6 6" />}
      </svg>
    );
  }
  // Miss: a neutral "go again" loop, not a cross.
  return (
    <svg {...common}>
      <path d="M20 12a8 8 0 1 1-2.35-5.65" />
      <path d="M20 4v5h-5" />
    </svg>
  );
}

export function VerdictBadge({ verdict, target }: { verdict: Verdict; target: TargetSound }) {
  const other = target === 's' ? 'sh' : 's';
  const title =
    verdict === 'hit'
      ? `Got it: the '${target}' was there`
      : verdict === 'close'
        ? `Close: that sounded like '${other}'`
        : `No '${target}' heard yet`;
  const detail =
    verdict === 'hit'
      ? null
      : verdict === 'close'
        ? `Aim for '${target}', ${target === 's' ? 'right' : 'left'} on the meter.`
        : 'Take a breath and try again.';
  const look =
    verdict === 'hit'
      ? 'bg-hit text-hit-ink border-4 border-hit'
      : verdict === 'close'
        ? 'bg-close text-close-ink border-4 border-close'
        : 'bg-surface text-foreground border-4 border-dashed border-miss';

  return (
    <div
      role="status"
      className={`flex w-full items-center gap-4 rounded-2xl px-4 py-4 motion-safe:animate-result-pulse ${look}`}
    >
      <span className={verdict === 'miss' ? 'text-miss' : undefined}>
        <Icon verdict={verdict} target={target} />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-2xl leading-tight font-bold">{title}</p>
        {detail && <p className="text-base font-medium">{detail}</p>}
      </div>
    </div>
  );
}
