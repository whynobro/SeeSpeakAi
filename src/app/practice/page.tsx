'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { AdultOverrideDialog } from '@/components/AdultOverrideDialog';
import { LightbulbIcon, MicIcon, StarIcon } from '@/components/Icons';
import { LipCamera } from '@/components/LipCamera';
import { SoundVideo } from '@/components/SoundVideo';
import { SoundMeter } from '@/components/SoundMeter';
import { BackLink, PageHeader } from '@/components/PageHeader';
import { Button, Card, IconTile, buttonClass } from '@/components/ui';
import { CoachCard } from '@/components/CoachCard';
import { StuckHelp } from '@/components/StuckHelp';
import { Confetti } from '@/components/Confetti';
import { playHitDing } from '@/components/hitDing';
import { VerdictBadge } from '@/components/VerdictBadge';
import { WordCard } from '@/components/WordCard';
import { BirdMascot } from '@/components/bird/BirdMascot';
import { CUES } from '@/content/cues';
import { stepWords } from '@/lib/ai/rulesPlan';
import {
  countsFor,
  currentTier,
  isLevelId,
  isTier,
  itemsHit,
  levelById,
  levelItems,
  mergeResult,
  nextLevel,
  nextTier,
  passItems,
  tierById,
  tierPasses,
  tierPlays,
  type Tier,
} from '@/lib/levels';
import { loadPlan } from '@/components/planStore';
import { useCoachFeedback } from '@/hooks/useCoachFeedback';
import { useLipCamera } from '@/hooks/useLipCamera';
import { useSoundMeter } from '@/hooks/useSoundMeter';
import { useStuckHelp } from '@/hooks/useStuckHelp';
import {
  AUTO_STOP_QUIET_MS,
  AUTO_STOP_QUIET_MS_WORD,
  autoGradeStep,
  type LevelPoint,
} from '@/lib/audio/autoStop';
import { buzz } from '@/lib/feedback';
import type { LipSummary } from '@/lib/lips/types';
import { saveOverride } from '@/lib/override';
import { scoreAttempt } from '@/lib/scoring';
import { isTargetSound } from '@/lib/scoring/constants';
import { loadLevelResults, loadProfile, loadSettings, saveAttempt, saveLevelResults } from '@/lib/store';
import type { AttemptScore, HearingProfile, LearnerSettings, PracticeWord, TargetSound } from '@/lib/types';

const WORD_COUNT = 8;

/** Bring a block into view. Instant (no glide) when the learner asked for reduced motion. */
function scrollToBlock(element: HTMLElement | null) {
  if (!element) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  element.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
}

function StopIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3" fill="currentColor" />
    </svg>
  );
}

/** "Word 3 of 8" as a row of segments: done ones filled, the current one wide, the rest hollow. */
function WordSteps({ index, total }: { index: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <ol className="flex flex-1 items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <li
            key={i}
            className={`h-3 rounded-full ${
              i < index
                ? 'flex-1 bg-accent-edge'
                : i === index
                  ? 'flex-[2] bg-accent'
                  : 'flex-1 border-2 border-muted/60 bg-surface'
            }`}
          />
        ))}
      </ol>
      <p className="shrink-0 text-sm font-bold text-muted">
        Word {index + 1} of {total}
      </p>
    </div>
  );
}

function PracticeLoop() {
  const searchParams = useSearchParams();
  const wanted = searchParams.get('sound');
  const target: TargetSound = isTargetSound(wanted) ? wanted : 's';
  // Opened from a plan's start button: ?plan=<id>&step=<n>. Then the words come from that plan step.
  const planId = searchParams.get('plan');
  const stepIndex = Number(searchParams.get('step') ?? '-1');
  // Opened from the levels map: ?level=alone|start|end|phrase. Then the words come from that level.
  const levelParam = searchParams.get('level');
  const level = isLevelId(levelParam) ? levelById(levelParam) : null;
  // ?tier=bronze|silver|gold. Without it, the level opens on its first tier not yet passed.
  const tierParam = searchParams.get('tier');

  const meter = useSoundMeter();
  const coach = useCoachFeedback();
  const clearCoach = coach.clear;
  const stuck = useStuckHelp();
  const resetStuck = stuck.reset;
  const { begin: beginLips, collect: collectLips, ...lipCam } = useLipCamera();
  const [lastLips, setLastLips] = useState<LipSummary | null>(null);
  const [settings, setSettings] = useState<LearnerSettings | null>(null);
  const [profile, setProfile] = useState<HearingProfile | null>(null);
  const [words, setWords] = useState<PracticeWord[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState<AttemptScore | null>(null);
  const [hits, setHits] = useState(0);
  const [tries, setTries] = useState(0);
  const [finished, setFinished] = useState(false);
  const [fromPlan, setFromPlan] = useState(false);
  /** Level mode: did each item get at least one try that counts for the tier (retries count). */
  const [countedByItem, setCountedByItem] = useState<boolean[]>([]);
  /** Level mode: the tier being played, and how many times it was finished (the round, so words change). */
  const [tier, setTier] = useState<Tier>('bronze');
  const [round, setRound] = useState(0);
  /** Tries in a row on this item that did not count. */
  const [missStreak, setMissStreak] = useState(0);
  const [stepsOpen, setStepsOpen] = useState(false);
  /** An adult marked this try right. The measured verdict is not changed. */
  const [adultRight, setAdultRight] = useState(false);
  const [adultOpen, setAdultOpen] = useState(false);
  /** The last try ended with no voice in it: nothing was scored or saved. */
  const [heardNone, setHeardNone] = useState(false);
  // Hands-free grading: loudness points for this try, whether a try is open, and the latest onDone.
  const points = useRef<LevelPoint[]>([]);
  const armed = useRef(false);
  const stopping = useRef(false);
  const onDoneRef = useRef<() => void>(() => {});
  // The bird is the help button: these are the blocks it scrolls to.
  const closerLookRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDetailsElement>(null);
  /** The bird was tapped and the closer look has not shown up on screen yet. */
  const wantCloserLook = useRef(false);

  /** The plan step's words, in the plan's order, when this page was opened from that plan. Else the word bank. */
  function pickWords(t: Tier = tier, r: number = round): { list: PracticeWord[]; planned: boolean } {
    if (level) return { list: levelItems(target, level.id, t, r), planned: false };
    const plan = planId ? loadPlan() : null;
    const step = plan && plan.id === planId ? plan.steps[stepIndex] : undefined;
    const planned = step?.words.filter((w) => w.target === target) ?? [];
    return planned.length > 0
      ? { list: planned, planned: true }
      : { list: stepWords(target, WORD_COUNT), planned: false };
  }

  // Storage and the word list are read in an effect, never during render.
  // The state is set in a microtask (not synchronously in the effect body) and ignored if the page left.
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setSettings(loadSettings());
      setProfile(loadProfile());
      let t: Tier = 'bronze';
      let r = 0;
      if (level) {
        const saved = loadLevelResults();
        t = isTier(tierParam) ? tierParam : currentTier(saved, target, level.id).id;
        r = tierPlays(saved, target, level.id, t);
      }
      setTier(t);
      setRound(r);
      setMissStreak(0);
      setStepsOpen(false);
      const picked = pickWords(t, r);
      setWords(picked.list);
      setFromPlan(picked.planned);
      setIndex(0);
      setScore(null);
      setAdultRight(false);
      setHits(0);
      setTries(0);
      setCountedByItem([]);
      setFinished(false);
    });
    return () => {
      active = false;
    };
    // pickWords reads only the URL values listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, planId, stepIndex, levelParam, tierParam]);

  const cue = CUES[target];
  const word = words[index] ?? null;
  const stuckProps = { loading: stuck.loading, help: stuck.help, failed: stuck.failed, ref: closerLookRef };

  /** The bird was tapped. Tries that did not count: ask for a closer look. No tries yet: open the steps. */
  function onBirdPress() {
    if (stuck.hasTries && word) {
      if (stuck.help || stuck.loading) scrollToBlock(closerLookRef.current);
      else {
        wantCloserLook.current = true; // the effect below scrolls once the loading line or the answer is on screen
        void stuck.ask(word);
      }
      return;
    }
    setStepsOpen(true);
    if (stepsRef.current) stepsRef.current.open = true;
    scrollToBlock(stepsRef.current);
  }

  const { help: stuckHelp, loading: stuckLoading, failed: stuckFailed } = stuck;
  useEffect(() => {
    if (!wantCloserLook.current || !(stuckHelp || stuckLoading || stuckFailed)) return;
    if (!stuckLoading) wantCloserLook.current = false;
    scrollToBlock(closerLookRef.current);
  }, [stuckHelp, stuckLoading, stuckFailed]);

  // A new word starts with no coach sentence.
  useEffect(() => {
    clearCoach();
    resetStuck();
  }, [index, words, clearCoach, resetStuck]);

  // The coach's next step is only a suggestion: it picks which button is the main one. Nothing moves on by itself.
  const suggestRetry = coach.feedback?.nextAction === 'repeat' || coach.feedback?.nextAction === 'easier';
  const listening = meter.status === 'listening';
  const busy = meter.status === 'starting';

  // The bird opens its beak with the mic level. Loudness only, never a verdict.
  const birdLevel = listening ? (meter.reading?.level ?? 0) : 0;

  async function onStart() {
    points.current = [];
    armed.current = true;
    stopping.current = false;
    setHeardNone(false);
    setScore(null);
    setAdultRight(false);
    setLastLips(null);
    coach.clear();
    beginLips(); // the lip numbers cover this try only
    await meter.start();
  }

  function onDone() {
    if (!word || !settings || !armed.current) return;
    armed.current = false; // One grade per try, whether Done or the auto-stop got here first.
    const frames = meter.stop();
    const lips = collectLips(); // numbers only, null when the camera is off
    setLastLips(lips);
    const result = scoreAttempt(frames, word, { alone: level?.id === 'alone' });
    setScore(result);
    setAdultRight(false);
    setTries((n) => n + 1);
    // Three tries in a row that did not count on this word make the bird say "Stuck? Tap me" (numbers only if tapped).
    stuck.record(word, result, level ? countsFor(tier, result) : result.verdict === 'hit', lips);
    if (result.verdict === 'hit') {
      playHitDing(); // the mic has stopped (meter.stop() above). Extra only: the badge carries the verdict.
      setHits((n) => n + 1);
    }
    if (level) {
      if (countsFor(tier, result)) {
        setMissStreak(0);
        setCountedByItem((prev) => {
          const next = [...prev];
          next[index] = true;
          return next;
        });
      } else {
        // Two tries in a row that do not count: open the steps and point at them.
        if (missStreak + 1 >= 2) setStepsOpen(true);
        setMissStreak((n) => n + 1);
      }
    }
    if (settings.channels.includes('vibration')) buzz(result.verdict);
    saveAttempt(
      {
        id: crypto.randomUUID(),
        wordId: word.id,
        target: word.target,
        stage: level?.stage ?? 'use',
        createdAt: new Date().toISOString(),
        score: result,
        channels: settings.channels,
      },
      word.position,
    );
    // The verdict is already on screen. The coach's sentence (numbers only go out, never audio) arrives after.
    void coach.ask(word, result, lips);
  }

  /** Nothing was said before time ran out: stop the mic, score nothing, save nothing. */
  function onNoVoice() {
    if (!armed.current) return;
    armed.current = false;
    meter.stop();
    collectLips(); // drop this try's lip numbers
    setHeardNone(true);
  }

  // Keep the newest onDone/onNoVoice for the auto-stop below, so it never runs with stale state.
  const onNoVoiceRef = useRef<() => void>(() => {});
  useEffect(() => {
    onDoneRef.current = onDone;
    onNoVoiceRef.current = onNoVoice;
  });

  // Watch the loudness. When the learner has spoken and gone quiet (or time is up), grade by itself.
  const latest = meter.latest;
  const phrase = level?.id === 'phrase';
  useEffect(() => {
    if (!armed.current || meter.status !== 'listening' || !latest) return;
    points.current.push({ tMs: latest.tMs, level: latest.level });
    if (stopping.current) return;
    const step = autoGradeStep(points.current, phrase ? AUTO_STOP_QUIET_MS : AUTO_STOP_QUIET_MS_WORD);
    if (step === 'listen') return;
    stopping.current = true; // One stop per try, even if more frames arrive first.
    setTimeout(() => (step === 'grade' ? onDoneRef.current() : onNoVoiceRef.current()), 0);
  }, [latest, meter.status, phrase]);

  /** The right adult code was entered: remember it, and in level mode count this item for the tier. */
  function onAdultRight() {
    setAdultOpen(false);
    if (!word || !score) return;
    saveOverride({
      wordId: word.id,
      target: word.target,
      level: level?.id,
      tier: level ? tier : undefined,
      at: new Date().toISOString(),
    });
    setAdultRight(true);
    stuck.reset(); // an adult heard it right, so this word is not a stuck streak
    if (level) {
      setMissStreak(0);
      setCountedByItem((prev) => {
        const next = [...prev];
        next[index] = true;
        return next;
      });
    }
  }

  function onNext() {
    setScore(null);
    setAdultRight(false);
    setMissStreak(0);
    if (index + 1 >= words.length) {
      if (level) {
        const merged = mergeResult(loadLevelResults(), target, level.id, tier, itemsHit(countedByItem));
        saveLevelResults(merged);
        // The tier was finished once more, so a replay gets new words.
        setRound(tierPlays(merged, target, level.id, tier));
      }
      setFinished(true);
    } else setIndex(index + 1);
  }

  function onRestart() {
    setWords(pickWords(tier, round).list);
    setIndex(0);
    setScore(null);
    setAdultRight(false);
    setHits(0);
    setTries(0);
    setCountedByItem([]);
    setMissStreak(0);
    setStepsOpen(false);
    setFinished(false);
  }

  if (finished && level) {
    const got = itemsHit(countedByItem);
    const ok = tierPasses(tier, got);
    const tierInfo = tierById(tier);
    const upTier = nextTier(tier);
    const next = nextLevel(level.id);
    // Silver opens the next level, so a silver or gold pass leads there.
    const levelOpen = ok && tier !== 'bronze' && next !== null;
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pt-2 pb-8">
        <BackLink href="/" label="Home" />
        <Card className="relative flex flex-col gap-4">
          {ok && <Confetti />}
          <div className={`flex flex-col gap-1 ${ok ? 'pr-16' : ''}`}>
            <p className="text-[15px] font-bold text-muted">
              Level {level.number}: {level.title}, {tierInfo.title}
            </p>
            <h1 className="flex items-center gap-2 text-[28px] leading-tight font-extrabold tracking-tight">
              {ok ? (
                <>
                  <StarIcon className="h-7 w-7 shrink-0 text-accent" />
                  {tierInfo.title} passed
                </>
              ) : (
                'Nice work, keep going'
              )}
            </h1>
          </div>
          <ul className="flex flex-wrap gap-1.5" aria-hidden="true">
            {words.map((w, i) => (
              <li
                key={i}
                className={`flex h-6 w-6 items-center justify-center rounded-full border ${countedByItem[i] ? 'border-hit-strong bg-hit text-hit-ink' : 'border-muted bg-surface'}`}
              >
                {countedByItem[i] && (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3.5}
                  >
                    <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </li>
            ))}
          </ul>
          <p className="text-[20px] leading-snug font-bold">
            {got} of {words.length}.
          </p>
          <p className="text-[17px] leading-relaxed text-muted">
            {ok
              ? levelOpen
                ? `Level ${next.number} is open: ${next.title.toLowerCase()}.`
                : upTier
                  ? `${upTier.title} is open. ${upTier.line}`
                  : `That was the last level for "${target}".`
              : `${tierInfo.line} Get ${passItems(tier)} of ${words.length} to pass ${tierInfo.title}. Tries again count, and the words change.`}
          </p>
        </Card>
        {ok && levelOpen ? (
          <Button href={`/practice?sound=${target}&level=${next.id}&tier=bronze`} size="xl">
            Next level
          </Button>
        ) : ok && upTier ? (
          <Button href={`/practice?sound=${target}&level=${level.id}&tier=${upTier.id}`} size="xl">
            Go for {upTier.title}
          </Button>
        ) : (
          <Button size="xl" onClick={onRestart}>
            {ok ? 'Play again' : 'Try again'}
          </Button>
        )}
        {ok && levelOpen && upTier && (
          <Button
            href={`/practice?sound=${target}&level=${level.id}&tier=${upTier.id}`}
            variant="secondary"
            size="lg"
          >
            Go for {upTier.title}
          </Button>
        )}
        {ok && (levelOpen || upTier) && (
          <Button variant="secondary" size="lg" onClick={onRestart}>
            Try again
          </Button>
        )}
        <Button href={`/levels?sound=${target}`} variant="secondary" size="lg">
          All levels
        </Button>
      </main>
    );
  }

  if (finished) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pt-2 pb-8">
        <BackLink href="/" label="Home" />
        <Card className="flex flex-col gap-4">
          <h1 className="text-[28px] leading-tight font-extrabold tracking-tight">All done</h1>
          {tries > 0 && (
            <ul className="flex flex-wrap gap-2" aria-hidden="true">
              {Array.from({ length: tries }, (_, i) => (
                <li
                  key={i}
                  className={`h-8 w-8 rounded-full border-[3px] ${i < hits ? 'border-hit-strong bg-hit' : 'border-muted bg-surface'}`}
                />
              ))}
            </ul>
          )}
          <p className="text-2xl font-bold">
            You got {hits} out of {tries} tries.
          </p>
        </Card>
        <Button href="/progress" size="xl">
          See your progress
        </Button>
        <Button variant="secondary" size="lg" onClick={onRestart}>
          Practice again
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 pt-2 pb-8">
      <PageHeader
        back={{ href: '/', label: 'Home' }}
        title={<>Practice the &apos;{target}&apos; sound</>}
        aside={<BirdMascot level={birdLevel} onPress={onBirdPress} nudge={stuck.canAsk} />}
      >
        {level && (
          <p className="text-base font-bold">
            Level {level.number} of 4: {level.title}, {tierById(tier).title}.{' '}
            <Link
              href={`/levels?sound=${target}`}
              className="inline-flex min-h-11 items-center text-sm text-accent-edge underline underline-offset-4"
            >
              All levels
            </Link>
          </p>
        )}
        {!level && (
          <p className="text-sm text-muted">
            <Link
              href={`/levels?sound=${target}`}
              className="inline-flex min-h-11 items-center font-bold text-accent-edge underline underline-offset-4"
            >
              Practice by level
            </Link>
          </p>
        )}
        {words.length > 0 && <WordSteps index={Math.min(index, words.length - 1)} total={words.length} />}
        {fromPlan && (
          <p className="text-sm text-muted">
            Words from your plan.{' '}
            <Link
              href="/plan"
              className="inline-flex min-h-11 items-center font-bold text-accent-edge underline underline-offset-4"
            >
              Back to your plan
            </Link>
          </p>
        )}
        {profile === null && settings !== null && (
          <p className="text-sm text-muted">
            No hearing check saved yet.{' '}
            <Link
              href="/profile"
              className="inline-flex min-h-11 items-center font-bold text-accent-edge underline underline-offset-4"
            >
              Do the hearing check
            </Link>
          </p>
        )}
      </PageHeader>

      {word ? (
        <WordCard word={word} showSign={settings?.showSigns ?? false} />
      ) : (
        <Card className="py-8 text-center text-muted">Loading words...</Card>
      )}

      <SoundMeter
        reading={meter.reading}
        target={target}
        status={meter.status}
        result={score ? { position: score.meterPosition } : null}
      />

      {meter.status === 'error' && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border-4 border-dashed border-miss bg-surface p-4"
        >
          <p className="text-lg font-bold">{meter.error ?? 'The microphone could not be started.'}</p>
          <Button variant="secondary" onClick={onStart}>
            Try the microphone again
          </Button>
        </div>
      )}

      {heardNone && !score && !listening && meter.status !== 'error' && (
        <p role="status" className="rounded-2xl border-2 border-line bg-surface p-4 text-lg font-bold">
          I did not hear anything. Tap Start and say the word.
        </p>
      )}

      {!score && meter.status !== 'error' && (
        <button
          type="button"
          onClick={listening ? onDone : onStart}
          disabled={!word || busy}
          aria-label={
            listening
              ? 'Listening, it stops by itself when you finish. Tap to check the word now.'
              : undefined
          }
          className={
            listening
              ? 'flex min-h-[72px] w-full items-center justify-center gap-3 rounded-2xl border-2 border-accent bg-surface px-6 text-2xl font-bold text-foreground transition-[transform,background-color] duration-75 active:scale-[0.98]'
              : buttonClass({ size: 'xl' })
          }
        >
          {listening ? (
            <>
              <span className="relative flex h-4 w-4" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 motion-safe:animate-ping" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-accent" />
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-left text-sm leading-snug font-bold text-muted">
                  Listening... it stops by itself when you finish
                </span>
                <span>Done</span>
              </span>
              <StopIcon />
            </>
          ) : (
            <>
              <MicIcon className="h-7 w-7" />
              {busy ? 'Starting...' : 'Start'}
            </>
          )}
        </button>
      )}

      {/* After the next try starts, a closer look already received stays on screen (the button waits for the result). */}
      {!score && word && <StuckHelp {...stuckProps} />}

      {score && word && (
        <div className="flex flex-col gap-3">
          <VerdictBadge verdict={score.verdict} target={word.target} heard={score.heard} />
          {adultRight && <p className="text-base font-bold">Marked right by an adult.</p>}
          {level && score.verdict === 'close' && countsFor(tier, score) && (
            <p className="text-base font-bold">Close. That counts for {tierById(tier).title}.</p>
          )}
          {level && missStreak >= 2 && !countsFor(tier, score) && (
            <p className="text-base">Tip: open the steps below and try it slowly.</p>
          )}
          {score.warnings.length > 0 && (
            <ul className="flex flex-col gap-1 text-base text-muted">
              {score.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
          <CoachCard feedback={coach.feedback} loading={coach.loading} />
          <StuckHelp {...stuckProps} />
          {!adultRight && score.verdict !== 'hit' && !(level && countsFor(tier, score)) && (
            <Button variant="secondary" size="md" onClick={() => setAdultOpen(true)}>
              An adult heard it right
            </Button>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Button variant={suggestRetry ? 'primary' : 'secondary'} size="lg" onClick={onStart}>
              Try again
            </Button>
            <Button variant={suggestRetry ? 'secondary' : 'primary'} size="lg" onClick={onNext}>
              {index + 1 >= words.length ? 'Finish' : 'Next word'}
            </Button>
          </div>
        </div>
      )}

      {/* The camera sits below the Start button and the result, so the word and the button stay on one screen. */}
      <LipCamera
        enabled={lipCam.enabled}
        onEnabledChange={lipCam.setEnabled}
        status={lipCam.status}
        error={lipCam.error}
        latest={lipCam.latest}
        videoRef={lipCam.videoRef}
        target={target}
        lastTry={score ? lastLips : null}
      />

      {/* Below the meter and the main button, so opening it never pushes them off the screen. */}
      <details
        ref={stepsRef}
        open={index === 0 || stepsOpen}
        className="group scroll-mt-4 rounded-xl border border-line bg-surface px-4 py-2"
      >
        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
          <IconTile tone="violet-soft" size="sm">
            <LightbulbIcon className="h-5 w-5" />
          </IconTile>
          <span className="flex flex-1 flex-col">
            <span className="text-lg font-bold">How to make this sound</span>
            <span className="text-sm text-muted">{cue.nickname}</span>
          </span>
          <span
            aria-hidden="true"
            className="text-2xl font-bold text-accent-edge transition-transform group-open:rotate-90"
          >
            &rsaquo;
          </span>
        </summary>
        <div className="flex flex-col gap-3 pt-2 pb-3">
          <SoundVideo sound={target} />
          <h3 className="pt-1 text-base font-bold">Step by step</h3>
          <ol className="flex list-decimal flex-col gap-1 pl-6 text-base marker:font-bold">
            {cue.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="rounded-2xl bg-accent-soft p-3 text-base">{cue.shaping}</p>
          <p className="text-base">{cue.touch}</p>
        </div>
      </details>

      <AdultOverrideDialog open={adultOpen} onClose={() => setAdultOpen(false)} onRight={onAdultRight} />
    </main>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<p className="p-4">Loading...</p>}>
      <PracticeLoop />
    </Suspense>
  );
}
