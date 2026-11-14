'use client';

import type { SoundReading } from '@/lib/types';

export function SoundMeter({ reading }: { reading: SoundReading | null }) {
  const position = reading?.hissing ? reading.position : null;
  const level = Math.max(0, Math.min(1, reading?.level ?? 0));
  const description =
    position === null
      ? 'No hiss heard.'
      : position > 0.6
        ? 'Hiss heard, sounds like s.'
        : position < 0.4
          ? 'Hiss heard, sounds like sh.'
          : 'Hiss heard, between sh and s.';

  return (
    <div className="w-full">
      <div className="flex justify-between text-2xl font-bold" aria-hidden="true">
        <span>sh</span>
        <span>s</span>
      </div>
      <div className="relative mt-2 h-8 rounded-full border-2 border-current bg-black/10 dark:bg-white/10">
        {position !== null && (
          <div
            className="absolute top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-blue-700"
            style={{ left: `${Math.max(0, Math.min(1, position)) * 100}%` }}
          />
        )}
      </div>
      <div
        className="mt-3 h-3 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10"
        aria-hidden="true"
      >
        <div className="h-full bg-current" style={{ width: `${level * 100}%` }} />
      </div>
      <p className="sr-only" aria-live="polite">
        {description}
      </p>
    </div>
  );
}
