'use client';

import { useState } from 'react';
import type { MeterStatus } from '@/hooks/useSoundMeter';
import type { SoundReading, TargetSound } from '@/lib/types';

/** Matches BOUNDARY in src/lib/scoring: at or above this the hiss reads as "s", below as "sh". */
const BOUNDARY = 0.5;
/** How many recent hiss positions to keep as a fading trail (readings arrive about 20 per second). */
const TRAIL_LENGTH = 24;
/** How many recent loudness values to draw as bars. */
const LEVEL_BARS = 28;

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/** Loudness for display only: a log scale, so quiet speech still moves the bars. -60 dB is empty, 0 dB is full. */
function displayLevel(level: number): number {
  if (level <= 0) return 0;
  return clamp01((20 * Math.log10(level) + 60) / 60);
}

function soundsLike(position: number): string {
  if (position >= 0.6) return 'sounds like s';
  if (position < 0.4) return 'sounds like sh';
  return 'between sh and s';
}

function describe(position: number): string {
  return `Hiss heard: ${soundsLike(position)}`;
}

export interface SoundMeterProps {
  reading: SoundReading | null;
  /** The sound being practiced. Marks its half of the track as the target zone. Omit for no zone (lab page). */
  target?: TargetSound;
  /** The hook's status. When omitted, the meter counts as listening whenever there is a reading. */
  status?: MeterStatus;
  /** Set after a try is scored. `position` is score.meterPosition: 0 = sh, 1 = s, null when no hiss was found. */
  result?: { position: number | null } | null;
}

export function SoundMeter({ reading, target, status, result = null }: SoundMeterProps) {
  const listening = status ? status === 'listening' : reading !== null;
  const position = reading?.hissing && reading.position !== null ? clamp01(reading.position) : null;

  // The trail and loudness history are kept from the `reading` prop. State is adjusted during render
  // when the prop changes (React's documented pattern), so there is no effect and no extra render pass.
  const [prevReading, setPrevReading] = useState<SoundReading | null>(reading);
  const [prevListening, setPrevListening] = useState(listening);
  const [trail, setTrail] = useState<number[]>([]);
  const [levels, setLevels] = useState<number[]>([]);

  if (listening !== prevListening) {
    setPrevListening(listening);
    if (listening) {
      setTrail([]);
      setLevels([]);
    }
  }
  if (reading !== prevReading) {
    setPrevReading(reading);
    if (reading) {
      const lvl = displayLevel(reading.level);
      setLevels((old) => [...old.slice(-(LEVEL_BARS - 1)), lvl]);
      if (reading.hissing && reading.position !== null) {
        const p = clamp01(reading.position);
        setTrail((old) => [...old.slice(-(TRAIL_LENGTH - 1)), p]);
      }
    }
  }

  const zoneLeft = target === 's' ? BOUNDARY : 0;
  const zoneWidth = target === 's' ? 1 - BOUNDARY : BOUNDARY;
  const landed = result && result.position !== null ? clamp01(result.position) : null;

  let stateLine: string;
  if (status === 'starting') stateLine = 'Starting the microphone...';
  else if (status === 'error') stateLine = 'The microphone is off.';
  else if (listening) stateLine = position === null ? 'Listening... say the word' : describe(position);
  else if (result)
    stateLine = landed === null ? 'No hiss found this try' : `Your hiss landed here: ${soundsLike(landed)}`;
  else stateLine = 'Tap Start, then say the word.';

  const recentLevel = levels.length > 0 && listening ? levels[levels.length - 1] : 0;

  return (
    <section
      aria-label="Live sound meter"
      className="w-full rounded-3xl border-2 border-line bg-surface p-4 shadow-clay"
    >
      <div className="flex items-end justify-between" aria-hidden="true">
        <span
          className={`text-3xl leading-none font-extrabold ${target === 'sh' ? 'text-accent-edge underline decoration-4 underline-offset-4' : 'text-muted'}`}
        >
          sh
        </span>
        <span className="text-sm font-semibold text-muted">which hiss?</span>
        <span
          className={`text-3xl leading-none font-extrabold ${target === 's' ? 'text-accent-edge underline decoration-4 underline-offset-4' : 'text-muted'}`}
        >
          s
        </span>
      </div>

      {/* The track: sh on the left, s on the right, with the target half marked by stripes and a label. */}
      <div className="relative mt-2 h-16" aria-hidden="true">
        <div className="absolute inset-x-0 top-1/2 h-11 -translate-y-1/2 overflow-hidden rounded-2xl border-2 border-foreground/60 bg-background">
          {target && (
            <>
              <div
                className="absolute inset-y-0 border-accent text-accent/30"
                style={{
                  left: `${zoneLeft * 100}%`,
                  width: `${zoneWidth * 100}%`,
                  borderLeftWidth: target === 's' ? 3 : 0,
                  borderRightWidth: target === 'sh' ? 3 : 0,
                  borderStyle: 'dashed',
                  backgroundImage:
                    'repeating-linear-gradient(135deg, currentColor 0 3px, transparent 3px 11px)',
                }}
              />
              <span
                className="absolute top-1/2 -translate-y-1/2 rounded-lg bg-surface px-2 py-0.5 text-sm font-bold text-accent-edge"
                style={target === 's' ? { right: 8 } : { left: 8 }}
              >
                Aim here: {target}
              </span>
            </>
          )}

          {/* Fading trail: where the marker has been during this try. Older dots are smaller and fainter. */}
          {trail.map((p, i) => {
            const age = (i + 1) / trail.length;
            return (
              <span
                key={i}
                className="absolute top-1/2 rounded-full bg-accent"
                style={{
                  left: `${p * 100}%`,
                  width: 6 + age * 10,
                  height: 6 + age * 10,
                  opacity: 0.15 + age * 0.45,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            );
          })}
        </div>

        {/* Live marker while hissing. */}
        {listening && position !== null && (
          <span
            className="absolute top-1/2 h-14 w-14 rounded-full border-4 border-surface bg-accent shadow-[0_4px_0_var(--accent-edge)] motion-safe:transition-[left] motion-safe:duration-75"
            style={{ left: `${position * 100}%`, transform: 'translate(-50%, -50%)' }}
          />
        )}

        {/* After a result: where the attempt landed, as a pin (shape differs from the live marker). */}
        {!listening && landed !== null && (
          <span
            className="absolute top-1/2 flex h-14 w-14 items-center justify-center"
            style={{ left: `${landed * 100}%`, transform: 'translate(-50%, -50%)' }}
          >
            <span className="h-10 w-10 rotate-45 rounded-lg border-4 border-surface bg-foreground shadow-[0_3px_0_var(--line)]" />
          </span>
        )}
      </div>

      {/* Loudness: moves with any sound, so the learner can see the mic is live before any hiss. */}
      <div className="mt-2 flex items-center gap-3" aria-hidden="true">
        <span className="w-20 shrink-0 text-sm font-semibold text-muted">Loudness</span>
        <div className="flex h-7 flex-1 items-center gap-[2px]">
          {Array.from({ length: LEVEL_BARS }, (_, i) => {
            const value = levels[levels.length - LEVEL_BARS + i] ?? 0;
            return (
              <span
                key={i}
                className="flex-1 rounded-full bg-accent-edge"
                style={{ height: `${Math.max(8, value * 100)}%`, opacity: listening ? 1 : 0.35 }}
              />
            );
          })}
        </div>
      </div>

      <p className="mt-2 flex min-h-7 items-center gap-2 text-lg font-bold" aria-hidden="true">
        {listening && (
          <span
            className="inline-block h-3 w-3 shrink-0 rounded-full bg-accent motion-safe:animate-pulse"
            style={{ transform: `scale(${1 + recentLevel * 0.6})` }}
          />
        )}
        {stateLine}
      </p>
      <p className="sr-only" aria-live="polite">
        {listening ? (position === null ? 'Listening. No hiss heard.' : `${describe(position)}.`) : stateLine}
      </p>
    </section>
  );
}
