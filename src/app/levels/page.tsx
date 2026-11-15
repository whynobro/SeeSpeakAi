'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ArrowLeftIcon, CheckCircleIcon, LockIcon } from '@/components/Icons';
import { Button, SegmentedControl } from '@/components/ui';
import {
  LEVELS,
  TIERS,
  currentLevel,
  currentTier,
  isTierUnlocked,
  isUnlocked,
  levelPassed,
  tierPassed,
  type Level,
  type LevelResults,
  type Tier,
} from '@/lib/levels';
import { TARGET_SOUNDS, isTargetSound } from '@/lib/scoring/constants';
import { loadLevelResults } from '@/lib/store';
import type { TargetSound } from '@/lib/types';

const SOUND_OPTIONS = TARGET_SOUNDS.map((s) => ({ value: s, label: s }));

function practiceHref(sound: TargetSound, level: Level, tier: Tier): string {
  return `/practice?sound=${sound}&level=${level.id}&tier=${tier}`;
}

const QUIET_LINK =
  'inline-flex min-h-12 items-center self-start text-[15px] font-bold text-accent-edge underline decoration-2 underline-offset-4';

/**
 * One stop on the path: the level number on a rail, then the words. No box around it.
 * State is always a word plus an icon, never color alone.
 */
function LevelStop({
  sound,
  level,
  results,
  current,
  last,
}: {
  sound: TargetSound;
  level: Level;
  results: LevelResults;
  current: boolean;
  last: boolean;
}) {
  const done = levelPassed(results, sound, level.id);
  const open = isUnlocked(results, sound, level.id);
  const started = TIERS.some((t) => results[`${sound}:${level.id}`]?.tiers[t.id] !== undefined);

  return (
    <li className="flex gap-4">
      {/* The rail: the level number, then a hairline down to the next stop. */}
      <div aria-hidden="true" className="flex flex-col items-center">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl font-extrabold ${
            done
              ? 'bg-accent text-accent-ink'
              : open
                ? 'border-2 border-accent bg-surface text-accent-edge'
                : 'border-2 border-dashed border-muted/60 text-muted'
          }`}
        >
          {level.number}
        </span>
        {!last && <span className={`w-px flex-1 ${done ? 'bg-accent' : 'bg-line'}`} />}
      </div>

      <div className={`flex min-w-0 flex-1 flex-col pt-1.5 ${last ? '' : current ? 'pb-7' : 'pb-3'}`}>
        <h2 className={`leading-tight font-extrabold ${current ? 'text-[20px]' : 'text-[17px]'}`}>
          <span className="sr-only">Level {level.number}: </span>
          {level.title}
        </h2>
        <p className="text-[15px] text-muted">{level.hint}</p>
        <p className="mt-1 text-[15px] font-bold">
          {done ? (
            <span className="inline-flex items-center gap-1.5 text-hit-strong">
              <CheckCircleIcon className="h-4 w-4 shrink-0" />
              Level passed
            </span>
          ) : open ? (
            <span>{started ? 'Pass Silver to open the next level.' : 'Start with Bronze.'}</span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-muted">
              <LockIcon className="h-4 w-4 shrink-0" />
              Locked: pass level {level.number - 1} first
            </span>
          )}
        </p>
        <ul className="mt-1 flex flex-wrap gap-x-4" aria-label="Tiers">
          {TIERS.map((t) => {
            const tierDone = tierPassed(results, sound, level.id, t.id);
            const tierOpen = isTierUnlocked(results, sound, level.id, t.id);
            const inner = (
              <>
                {tierDone ? (
                  <CheckCircleIcon className="h-4 w-4 shrink-0" />
                ) : !tierOpen ? (
                  <LockIcon className="h-4 w-4 shrink-0" />
                ) : null}
                {t.title}
                <span className="sr-only">{tierDone ? ', passed' : tierOpen ? '' : ', locked'}</span>
              </>
            );
            return (
              <li key={t.id}>
                {tierOpen ? (
                  <Link
                    href={practiceHref(sound, level, t.id)}
                    className={`inline-flex min-h-12 min-w-12 items-center gap-1.5 text-[15px] font-bold underline decoration-2 underline-offset-4 ${tierDone ? 'text-hit-strong' : 'text-accent-edge'}`}
                  >
                    {inner}
                  </Link>
                ) : (
                  <span className="inline-flex min-h-12 items-center gap-1.5 text-[15px] font-bold text-muted">
                    {inner}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        {current ? (
          <Button
            href={practiceHref(sound, level, currentTier(results, sound, level.id).id)}
            size="md"
            className="mt-1"
          >
            Start
          </Button>
        ) : (
          !open && (
            <Link href={practiceHref(sound, level, 'bronze')} className={QUIET_LINK}>
              Jump ahead anyway
            </Link>
          )
        )}
      </div>
    </li>
  );
}

function LevelsMap() {
  const searchParams = useSearchParams();
  const wanted = searchParams.get('sound');
  const [sound, setSound] = useState<TargetSound>(isTargetSound(wanted) ? wanted : 's');
  const [results, setResults] = useState<LevelResults | null>(null);

  // Saved results are read after the page is on screen, never during render.
  useEffect(() => {
    const id = setTimeout(() => setResults(loadLevelResults()), 0);
    return () => clearTimeout(id);
  }, []);

  const current = results ? currentLevel(results, sound) : LEVELS[0];

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-2 pb-8">
      <Button href="/" variant="ghost" block={false} className="self-start">
        <ArrowLeftIcon className="h-5 w-5" />
        Home
      </Button>
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] leading-tight font-extrabold tracking-tight">Levels</h1>
        <p className="text-[17px] text-muted">
          The order speech therapists teach a sound: on its own first, then in words, then in phrases.
        </p>
      </header>

      <SegmentedControl label="Sound" options={SOUND_OPTIONS} value={sound} onChange={setSound} />

      {results === null ? (
        <p className="py-8 text-[15px] text-muted">Loading levels...</p>
      ) : (
        <ol className="flex flex-col" aria-label={`Levels for the "${sound}" sound`}>
          {LEVELS.map((level, i) => (
            <LevelStop
              key={level.id}
              sound={sound}
              level={level}
              results={results}
              current={level.id === current.id && !levelPassed(results, sound, level.id)}
              last={i === LEVELS.length - 1}
            />
          ))}
        </ol>
      )}
    </main>
  );
}

export default function LevelsPage() {
  return (
    <Suspense fallback={<p className="p-4">Loading...</p>}>
      <LevelsMap />
    </Suspense>
  );
}
