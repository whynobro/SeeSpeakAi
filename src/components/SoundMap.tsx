'use client';

import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { SOUND_MAP } from '@/content/soundMap';
import {
  ITEMS_PER_LEVEL,
  LEVELS,
  TIERS,
  currentTier,
  isUnlocked,
  levelKey,
  tierPassed,
  type Level,
  type LevelResults,
  type Tier,
} from '@/lib/levels';
import { TARGET_SOUNDS } from '@/lib/scoring/constants';
import type { TargetSound } from '@/lib/types';

/*
 * The sound map (Progress screen). One color per sound, one blob per level, joined to the sound's center like a
 * mind map. A blob is a dashed outline until the level's bronze is passed, then it fills in, and it grows with
 * silver and gold. Tap a blob: it gets bigger and the box under the map says what it is, with a link to play it.
 *
 * Everything shown is read from the saved level results on this device. Nothing is made up: a new learner sees
 * four colored centers and dashed outlines.
 *
 * Not color alone: each blob carries its level number, filled or dashed shows passed or not, and the box under
 * the map says it in words. The picture is decoration for screen readers; the buttons on top carry the labels.
 */

const W = 360;
const H = 330;
const CENTER = { x: 180, y: 166 };
const HUB_R = 30;
const REACH = 58;
/** Blob radius: not passed, bronze, silver, gold. */
const RADIUS: Record<Tier | 'none', number> = { none: 14, bronze: 16, silver: 20, gold: 24 };

interface Palette {
  /** Two stops of the blob's soft gradient. */
  from: string;
  to: string;
  /** Dark shade for outlines and words, at least 4.5:1 on the card. */
  ink: string;
}

const PALETTE: Record<TargetSound, Palette> = {
  s: { from: '#7cc4ff', to: '#3b7de0', ink: '#1d4ed8' },
  sh: { from: '#ffc39a', to: '#f4728a', ink: '#b4233f' },
  z: { from: '#a8ecc4', to: '#22a99a', ink: '#0f6e66' },
  ch: { from: '#f3bdf6', to: '#9b7bf0', ink: '#6d28d9' },
};

const HUBS: Record<TargetSound, { x: number; y: number }> = {
  s: { x: 98, y: 100 },
  sh: { x: 262, y: 92 },
  z: { x: 92, y: 236 },
  ch: { x: 266, y: 236 },
};

/** The four level blobs fan out from the sound's center, away from the middle of the map. */
const FAN = [-75, -25, 25, 75];

function blobSpot(sound: TargetSound, index: number): { x: number; y: number } {
  const hub = HUBS[sound];
  const out = Math.atan2(hub.y - CENTER.y, hub.x - CENTER.x);
  const a = out + (FAN[index] * Math.PI) / 180;
  return { x: hub.x + REACH * Math.cos(a), y: hub.y + REACH * Math.sin(a) };
}

/** The hardest tier passed for this level, or null. */
function bestTier(results: LevelResults, sound: TargetSound, level: Level): Tier | null {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (tierPassed(results, sound, level.id, TIERS[i].id)) return TIERS[i].id;
  }
  return null;
}

interface Picked {
  sound: TargetSound;
  level: Level;
}

function Details({
  results,
  picked,
  onClose,
}: {
  results: LevelResults;
  picked: Picked;
  onClose: () => void;
}) {
  const { sound, level } = picked;
  const tier = bestTier(results, sound, level);
  const open = isUnlocked(results, sound, level.id);
  const saved = results[levelKey(sound, level.id)]?.tiers;
  const shown = tier ? saved?.[tier] : undefined;
  const next = currentTier(results, sound, level.id);
  const before = LEVELS[LEVELS.findIndex((l) => l.id === level.id) - 1];
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold" style={{ color: PALETTE[sound].ink }}>
            {SOUND_MAP.soundName(sound)}
          </p>
          <h3 className="text-xl leading-tight font-extrabold">
            {SOUND_MAP.levelName(level.number, level.title)}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 shrink-0 rounded-lg px-2 text-[15px] font-bold text-muted underline underline-offset-4"
        >
          {SOUND_MAP.close}
        </button>
      </div>
      <p className="text-[17px] text-muted">{level.hint}</p>
      <ul className="flex flex-col gap-1 text-[17px] font-bold">
        {tier ? (
          <li>{SOUND_MAP.tierPassed(TIERS.find((t) => t.id === tier)?.title ?? '')}</li>
        ) : (
          <li>{open ? SOUND_MAP.notYet : SOUND_MAP.locked}</li>
        )}
        {shown && <li className="font-medium">{SOUND_MAP.best(shown.bestHits, ITEMS_PER_LEVEL)}</li>}
        {shown && (
          <li className="font-medium text-muted">
            {SOUND_MAP.on(
              new Date(shown.updatedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric' }),
            )}
          </li>
        )}
      </ul>
      {open ? (
        <Button href={`/practice?sound=${sound}&level=${level.id}&tier=${next.id}`}>
          {tier ? SOUND_MAP.playAgain : SOUND_MAP.play}
        </Button>
      ) : (
        before && (
          <Button variant="secondary" href={`/levels?sound=${sound}`}>
            {SOUND_MAP.goFirst}
          </Button>
        )
      )}
    </div>
  );
}

export function SoundMap({ results }: { results: LevelResults }) {
  const [picked, setPicked] = useState<Picked | null>(null);
  const all = TARGET_SOUNDS.length * LEVELS.length;
  const done = TARGET_SOUNDS.reduce(
    (n, s) => n + LEVELS.filter((l) => bestTier(results, s, l) !== null).length,
    0,
  );
  const isPicked = (s: TargetSound, l: Level) => picked?.sound === s && picked.level.id === l.id;

  return (
    <Card as="section" aria-labelledby="sound-map-heading" className="flex flex-col gap-3 overflow-hidden">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="sound-map-heading" className="text-xl font-bold">
          {SOUND_MAP.title}
        </h2>
        <p className="text-[15px] font-bold text-muted">{SOUND_MAP.passedCount(done, all)}</p>
      </div>
      <p className="text-[15px] text-muted">{done === 0 ? SOUND_MAP.empty : SOUND_MAP.lede}</p>

      <div className="relative mx-auto w-full max-w-[420px]" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            {/* Joins a sound's center and its filled blobs into one soft shape. */}
            <filter id="sm-join" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
              <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
            </filter>
            <filter id="sm-haze" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="26" />
            </filter>
            {TARGET_SOUNDS.map((s) => (
              <radialGradient
                key={s}
                id={`sm-fill-${s}`}
                gradientUnits="userSpaceOnUse"
                cx={HUBS[s].x - 18}
                cy={HUBS[s].y - 22}
                r={REACH + 50}
              >
                <stop offset="0" stopColor={PALETTE[s].from} />
                <stop offset="1" stopColor={PALETTE[s].to} />
              </radialGradient>
            ))}
          </defs>

          {/* A faint haze of each sound's color behind its corner of the map. */}
          <g filter="url(#sm-haze)" opacity="0.28">
            {TARGET_SOUNDS.map((s) => (
              <circle key={s} cx={HUBS[s].x} cy={HUBS[s].y} r="62" fill={PALETTE[s].to} />
            ))}
          </g>

          {/* Thin threads from the middle to each sound, as in a mind map. */}
          {TARGET_SOUNDS.map((s) => (
            <path
              key={s}
              d={`M ${CENTER.x} ${CENTER.y} Q ${(CENTER.x + HUBS[s].x) / 2} ${HUBS[s].y} ${HUBS[s].x} ${HUBS[s].y}`}
              fill="none"
              stroke={PALETTE[s].ink}
              strokeOpacity="0.35"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ))}
          <circle cx={CENTER.x} cy={CENTER.y} r="5" fill="var(--foreground)" />

          {TARGET_SOUNDS.map((s) => {
            const hub = HUBS[s];
            return (
              <g key={s}>
                {/* Not passed yet: a dashed thread and a dashed outline. */}
                {LEVELS.map((l, i) => {
                  if (bestTier(results, s, l)) return null;
                  const p = blobSpot(s, i);
                  return (
                    <g key={l.id}>
                      <line
                        x1={hub.x}
                        y1={hub.y}
                        x2={p.x}
                        y2={p.y}
                        stroke={PALETTE[s].ink}
                        strokeOpacity="0.45"
                        strokeWidth="1.5"
                        strokeDasharray="3 5"
                      />
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={RADIUS.none + (isPicked(s, l) ? 4 : 0)}
                        fill="var(--surface)"
                        stroke={PALETTE[s].ink}
                        strokeWidth="2"
                        strokeDasharray="4 5"
                        className="transition-[r] duration-200 motion-reduce:transition-none"
                      />
                    </g>
                  );
                })}
                {/* The sound's center and its passed levels, melted into one blob. */}
                <g filter="url(#sm-join)" fill={`url(#sm-fill-${s})`} stroke={`url(#sm-fill-${s})`}>
                  <circle cx={hub.x} cy={hub.y} r={HUB_R} stroke="none" />
                  {LEVELS.map((l, i) => {
                    const tier = bestTier(results, s, l);
                    if (!tier) return null;
                    const p = blobSpot(s, i);
                    return (
                      <g key={l.id}>
                        <line
                          x1={hub.x}
                          y1={hub.y}
                          x2={p.x}
                          y2={p.y}
                          strokeWidth="16"
                          strokeLinecap="round"
                        />
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={RADIUS[tier] + (isPicked(s, l) ? 5 : 0)}
                          stroke="none"
                          className="transition-[r] duration-200 motion-reduce:transition-none"
                        />
                      </g>
                    );
                  })}
                </g>
              </g>
            );
          })}
        </svg>

        {/* The sound letters, and one real button per blob, placed over the picture. */}
        {TARGET_SOUNDS.map((s) => (
          <span
            key={s}
            aria-hidden="true"
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-[22px] font-extrabold text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.45)]"
            style={{ left: `${(HUBS[s].x / W) * 100}%`, top: `${(HUBS[s].y / H) * 100}%` }}
          >
            {s}
          </span>
        ))}
        {TARGET_SOUNDS.flatMap((s) =>
          LEVELS.map((l, i) => {
            const p = blobSpot(s, i);
            const tier = bestTier(results, s, l);
            const state = tier
              ? SOUND_MAP.tierPassed(TIERS.find((t) => t.id === tier)?.title ?? '')
              : SOUND_MAP.notYet;
            const on = isPicked(s, l);
            return (
              <button
                key={`${s}-${l.id}`}
                type="button"
                aria-pressed={on}
                aria-label={SOUND_MAP.blobLabel(s, l.number, l.title, state)}
                onClick={() => setPicked(on ? null : { sound: s, level: l })}
                className="absolute grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
                style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` }}
              >
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full text-[13px] font-extrabold ${
                    tier ? 'bg-surface text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.25)]' : ''
                  } ${on ? 'ring-2 ring-foreground ring-offset-1' : ''}`}
                  style={tier ? undefined : { color: PALETTE[s].ink }}
                >
                  {l.number}
                </span>
              </button>
            );
          }),
        )}
      </div>

      <p className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[13px] font-bold text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 rounded-full bg-[linear-gradient(135deg,#7cc4ff,#3b7de0)]"
          />
          {SOUND_MAP.legendDone}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full border-2 border-dashed border-muted" />
          {SOUND_MAP.legendOpen}
        </span>
      </p>

      <div aria-live="polite">
        {picked ? (
          <Details results={results} picked={picked} onClose={() => setPicked(null)} />
        ) : (
          <p className="text-center text-[15px] text-muted">{SOUND_MAP.tapHint}</p>
        )}
      </div>
    </Card>
  );
}
