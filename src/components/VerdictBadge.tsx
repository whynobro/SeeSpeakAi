import type { TargetSound, Verdict } from '@/lib/types';

function Icon({ verdict }: { verdict: Verdict }) {
  const common = {
    width: 32,
    height: 32,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (verdict === 'hit') {
    return (
      <svg {...common}>
        <path d="M4 12l6 6L20 6" />
      </svg>
    );
  }
  if (verdict === 'close') {
    return (
      <svg {...common}>
        <path d="M4 12h15M13 6l6 6-6 6" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function VerdictBadge({ verdict, target }: { verdict: Verdict; target: TargetSound }) {
  const other = target === 's' ? 'sh' : 's';
  const text =
    verdict === 'hit'
      ? `Got it: the '${target}' was there`
      : verdict === 'close'
        ? `Close: that sounded like '${other}'`
        : `No '${target}' heard yet`;
  const colors =
    verdict === 'hit'
      ? 'bg-green-700 text-white'
      : verdict === 'close'
        ? 'bg-amber-400 text-black'
        : 'bg-red-700 text-white';

  return (
    <div
      role="status"
      className={`flex items-center gap-3 rounded-2xl px-4 py-4 text-xl font-bold ${colors}`}
    >
      <Icon verdict={verdict} />
      <span>{text}</span>
    </div>
  );
}
