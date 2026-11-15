'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { CheckCircleIcon, HomeIcon, LockIcon, StarIcon } from '@/components/Icons';
import { Button, Card } from '@/components/ui';
import {
  ITEMS_PER_LEVEL,
  LEVELS,
  PASS_ITEMS,
  currentLevel,
  isUnlocked,
  levelKey,
  type Level,
  type LevelResults,
} from '@/lib/levels';
import { TARGET_SOUNDS, isTargetSound } from '@/lib/scoring/constants';
import { loadLevelResults } from '@/lib/store';
import type { TargetSound } from '@/lib/types';

function practiceHref(sound: TargetSound, level: Level): string {
  return `/practice?sound=${sound}&level=${level.id}`;
}

/** One stop on the path. State is always a word plus an icon, never color alone. */
function LevelStop({
  sound,
  level,
  results,
  current,
}: {
  sound: TargetSound;
  level: Level;
  results: LevelResults;
  current: boolean;
}) {
  const result = results[levelKey(sound, level.id)];
  const done = result?.passed === true;
  const open = isUnlocked(results, sound, level.id);
  // The path zig-zags like a game map: odd levels sit left, even ones right.
  const side = level.number % 2 === 1 ? 'self-start' : 'self-end';

  return (
    <li className={`flex w-[85%] flex-col ${side}`}>
      <Card highlight={current} className={`flex items-center gap-4 ${open ? '' : 'opacity-70'}`}>
        <span
          aria-hidden="true"
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-extrabold ${
            done
              ? 'bg-hit text-hit-ink'
              : open
                ? 'bg-accent text-accent-ink'
                : 'border-2 border-muted/60 bg-surface text-muted'
          }`}
        >
          {done ? (
            <CheckCircleIcon className="h-8 w-8" />
          ) : open ? (
            level.number
          ) : (
            <LockIcon className="h-7 w-7" />
          )}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-sm font-bold text-muted">Level {level.number}</p>
          <h2 className="text-lg leading-tight font-extrabold">{level.title}</h2>
          <p className="text-sm text-muted">{level.hint}</p>
          <p className="text-sm font-bold">
            {done ? (
              <span className="inline-flex items-center gap-1 text-foreground">
                <StarIcon className="h-4 w-4" />
                Passed, best {result.bestHits} of {ITEMS_PER_LEVEL}
              </span>
            ) : result ? (
              <span>
                Best so far {result.bestHits} of {ITEMS_PER_LEVEL}. Pass with {PASS_ITEMS}.
              </span>
            ) : open ? (
              <span>
                Pass with {PASS_ITEMS} of {ITEMS_PER_LEVEL} right.
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-muted">
                Locked: pass level {level.number - 1} first
              </span>
            )}
          </p>
        </div>
      </Card>
      {open ? (
        <Button
          href={practiceHref(sound, level)}
          variant={current ? 'primary' : 'secondary'}
          size="md"
          className="mt-2"
        >
          {done ? 'Play again' : current ? 'Start' : 'Play'}
        </Button>
      ) : (
        <Link
          href={practiceHref(sound, level)}
          className="mt-1 inline-block self-start py-2 text-sm font-bold text-accent-edge underline underline-offset-4"
        >
          Jump ahead anyway
        </Link>
      )}
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
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 pt-2 pb-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex min-h-12 min-w-12 shrink-0 items-center justify-center gap-1 rounded-xl px-1 text-base font-bold text-accent-edge"
          >
            <HomeIcon className="h-6 w-6" />
            <span>Home</span>
          </Link>
          <h1 className="text-[28px] leading-tight font-extrabold tracking-tight">Levels</h1>
        </div>
        <p className="text-base text-muted">
          The order speech therapists teach a sound: on its own first, then in words, then in phrases.
        </p>
        <div role="group" aria-label="Sound" className="grid grid-cols-4 gap-2">
          {TARGET_SOUNDS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={s === sound}
              onClick={() => setSound(s)}
              className={`min-h-12 rounded-2xl text-xl font-extrabold ${
                s === sound
                  ? 'bg-accent text-accent-ink underline underline-offset-4'
                  : 'border border-accent bg-surface text-accent-edge'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </header>

      {results === null ? (
        <Card className="py-8 text-center text-muted">Loading levels...</Card>
      ) : (
        <ol className="flex flex-col gap-5" aria-label={`Levels for the "${sound}" sound`}>
          {LEVELS.map((level) => (
            <LevelStop
              key={level.id}
              sound={sound}
              level={level}
              results={results}
              current={level.id === current.id && results[levelKey(sound, level.id)]?.passed !== true}
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
