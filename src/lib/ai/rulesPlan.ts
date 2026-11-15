import { WORD_BANK, wordsFor } from '@/content/words';
import { pickTargets } from '@/lib/profile';
import { TARGET_SOUNDS } from '@/lib/scoring/constants';
import type { AssessmentReport, PlanStep, PracticePlan, PracticeWord, TargetSound } from '@/lib/types';

/** Client safe: no AI client and no server code is imported here, so screens can build the built-in plan at once. */
const SCORED: readonly TargetSound[] = TARGET_SOUNDS;

function asScored(sound: string): TargetSound | null {
  const clean = sound
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  return SCORED.find((s) => s === clean) ?? null;
}

/**
 * The first word of each built-in step. "sip" and "ship" lead because they are the pitch's example: with
 * hearing loss the "s" can drift toward "sh" (see docs/pitch/judge-answers.md), and the meter shows exactly that.
 */
const LEAD_WORD: Partial<Record<TargetSound, string>> = { s: 'sip', sh: 'ship' };

/** Bank words for one sound with its lead word moved to the front. The rest keep their order. */
export function stepWords(sound: TargetSound, count: number): PracticeWord[] {
  const words = wordsFor(sound, count);
  const lead = LEAD_WORD[sound];
  const known = lead ? WORD_BANK.find((w) => w.id === lead && w.target === sound) : undefined;
  if (!known) return words;
  return [known, ...words.filter((w) => w.id !== known.id)].slice(0, count);
}

function scoredStep(sound: TargetSound, why: string): PlanStep {
  return {
    sound,
    scored: true,
    why,
    stages: ['show', 'find', 'lock', 'use'],
    views: ['mouth', 'graph', 'frequency'],
    words: stepWords(sound, 8),
    goal: `Say the "${sound}" sound in 8 of 10 words.`,
  };
}

/** Built-in plan, used when there is no key or the AI call fails. Pure, so it is easy to test. */
export function planFromRules(report: AssessmentReport, now: Date = new Date()): PracticePlan {
  const steps: PlanStep[] = [];
  const add = (step: PlanStep) => {
    if (!steps.some((s) => s.sound === step.sound)) steps.push(step);
  };

  for (const raw of report.therapistSounds) {
    const sound = asScored(raw);
    if (sound) add(scoredStep(sound, `Your speech therapist asked for practice on "${sound}".`));
  }
  if (report.profile) {
    for (const pick of pickTargets(report.profile)) {
      if (pick.risk !== 'low') add(scoredStep(pick.sound, pick.reason));
    }
  }
  for (const sound of SCORED) {
    const accuracy = report.baseline[sound];
    if (typeof accuracy === 'number' && accuracy < 0.8) {
      const percent = Math.round(accuracy * 100);
      add(scoredStep(sound, `In the starting test the "${sound}" was there in ${percent}% of tries.`));
    }
  }
  for (const raw of report.therapistSounds) {
    const label = raw.trim();
    if (label && !asScored(raw)) {
      add({
        sound: label,
        scored: false,
        why: `Your speech therapist asked for practice on "${label}". The app cannot check this sound yet, so it shows how to make it without a score.`,
        stages: ['show'],
        views: ['mouth'],
        words: [],
        goal: 'Practice with your therapist and mark it done yourself.',
      });
    }
  }
  if (steps.length === 0) {
    add(scoredStep('s', 'Nothing in the report pointed to one sound, so the plan starts with "s".'));
  }

  const scoredCount = steps.filter((s) => s.scored).length;
  const plural = steps.length === 1 ? '' : 's';
  return {
    id: `plan-${now.getTime()}`,
    createdAt: now.toISOString(),
    source: 'rules',
    summary: `This plan has ${steps.length} sound${plural}. The app can check ${scoredCount} of them. Start with the first one and move on when you reach its goal.`,
    steps,
  };
}
