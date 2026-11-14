import { WORD_BANK, wordsFor } from '@/content/words';
import { askClaudeForJson } from '@/lib/ai/client';
import { mergePlan } from '@/lib/ai/validate';
import { pickTargets } from '@/lib/profile';
import type { AssessmentReport, PlanStep, PracticePlan, TargetSound } from '@/lib/types';

const SCORED: TargetSound[] = ['s', 'sh'];

function asScored(sound: string): TargetSound | null {
  const clean = sound
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  return SCORED.find((s) => s === clean) ?? null;
}

function scoredStep(sound: TargetSound, why: string): PlanStep {
  return {
    sound,
    scored: true,
    why,
    stages: ['show', 'find', 'lock', 'use'],
    views: ['mouth', 'graph', 'frequency'],
    words: wordsFor(sound, 8),
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

const PLAN_SYSTEM = `You write a short practice plan for a learner who is practicing speech sounds between speech therapy sessions.
Rules:
- Use plain, kind English for the learner's age group (child, teen or adult).
- This is opt-in practice. It is not therapy, not a diagnosis and not a hearing test.
- Never describe the learner as broken, wrong or needing to be fixed.
- Do not use em dashes.
- You may only reorder the steps, and rewrite "summary", each "why" and each "goal". Each text is at most 300 characters.
- For steps with "scored": true, choose and order "wordIds" ONLY from that sound's list in allowedWordIds. Pick at least 4. Never invent words.
- Do not add, remove or rename sounds.
Reply with JSON only, no other text, in exactly this shape:
{"summary": string, "steps": [{"sound": string, "why": string, "goal": string, "wordIds": string[]}]}
Use an empty wordIds array for steps that are not scored.`;

/**
 * Step 2 of the loop: the brain turns a report into a curated plan. The rules plan is always built first.
 * Claude (when a key is set) can only reorder and reword it, see mergePlan. Server side only.
 */
export async function buildPlan(report: AssessmentReport): Promise<PracticePlan> {
  const rulesPlan = planFromRules(report);
  const allowed: Record<string, string[]> = {};
  for (const step of rulesPlan.steps) {
    if (step.scored) allowed[step.sound] = WORD_BANK.filter((w) => w.target === step.sound).map((w) => w.id);
  }
  const ling = report.profile?.ling;
  const user = JSON.stringify({
    report: {
      therapistSounds: report.therapistSounds,
      therapistNotes: report.therapistNotes,
      ageGroup: report.ageGroup,
      interests: report.interests,
      baseline: report.baseline,
      lingSoundsNotHeard: ling
        ? Object.entries(ling)
            .filter(([, heard]) => !heard)
            .map(([sound]) => sound)
        : [],
    },
    rulesPlan: rulesPlan.steps.map((s) => ({
      sound: s.sound,
      scored: s.scored,
      why: s.why,
      goal: s.goal,
      wordIds: s.words.map((w) => w.id),
    })),
    rulesSummary: rulesPlan.summary,
    allowedWordIds: allowed,
  });
  const reply = await askClaudeForJson({
    model: process.env.SEESPEAK_PLAN_MODEL || 'claude-opus-5-5',
    system: PLAN_SYSTEM,
    user,
    maxTokens: 2000,
    timeoutMs: 20_000,
  });
  return mergePlan(rulesPlan, reply);
}
