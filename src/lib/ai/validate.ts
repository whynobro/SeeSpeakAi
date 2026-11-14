import { WORD_BANK } from '@/content/words';
import type { CoachFeedback, PlanStep, PracticePlan, PracticeWord } from '@/lib/types';

// Built from a char code so this file never contains the character itself.
const EM_DASH = new RegExp(`\\s*${String.fromCharCode(0x2014)}\\s*`, 'g');

export const MAX_PLAN_TEXT = 300;
export const MAX_MESSAGE = 240;
export const MAX_CUE = 200;
export const MIN_AI_WORDS = 4;
const MAX_AI_WORDS = 12;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A usable string: non-empty after trimming, within the cap. Em dashes become commas. Otherwise null. */
export function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const text = value.replace(EM_DASH, ', ').trim();
  return text.length > 0 && text.length <= max ? text : null;
}

/** Look up words by id for one target. Unknown ids, other-target words and repeats are dropped. */
function pickWords(ids: unknown, step: PlanStep): PracticeWord[] | null {
  if (!Array.isArray(ids)) return null;
  const out: PracticeWord[] = [];
  for (const id of ids) {
    if (typeof id !== 'string') continue;
    const word = WORD_BANK.find((w) => w.id === id.trim().toLowerCase() && w.target === step.sound);
    if (word && !out.includes(word)) out.push(word);
  }
  return out.length >= MIN_AI_WORDS ? out.slice(0, MAX_AI_WORDS) : null;
}

/**
 * Merge Claude's plan into the rules plan. Claude may only reorder steps, reword summary, why and goal, and
 * choose word ids from the word bank. The sounds and the `scored` flags always come from the rules plan.
 * Expected shape: { summary, steps: [{ sound, why, goal, wordIds }] }.
 */
export function mergePlan(rulesPlan: PracticePlan, aiJson: unknown): PracticePlan {
  if (!isRecord(aiJson)) return rulesPlan;
  let used = false;

  const summary = cleanText(aiJson.summary, MAX_PLAN_TEXT);
  if (summary) used = true;

  const seen = new Set<string>();
  const ordered: PlanStep[] = [];
  const aiSteps = Array.isArray(aiJson.steps) ? aiJson.steps : [];
  for (const raw of aiSteps) {
    if (!isRecord(raw) || typeof raw.sound !== 'string') continue;
    const wanted = raw.sound.trim();
    const base = rulesPlan.steps.find((s) => s.sound === wanted);
    if (!base || seen.has(base.sound)) continue; // unknown sounds and repeats are ignored
    seen.add(base.sound);
    used = true;
    const why = cleanText(raw.why, MAX_PLAN_TEXT) ?? base.why;
    const goal = cleanText(raw.goal, MAX_PLAN_TEXT) ?? base.goal;
    const words = base.scored ? (pickWords(raw.wordIds, base) ?? base.words) : base.words;
    ordered.push({ ...base, why, goal, words });
  }
  if (!used) return rulesPlan;

  // Sounds Claude left out keep their rules version, after the ones it ordered.
  const steps = [...ordered, ...rulesPlan.steps.filter((s) => !seen.has(s.sound))];
  return { ...rulesPlan, source: 'ai', summary: summary ?? rulesPlan.summary, steps };
}

/**
 * Merge Claude's feedback into the rules feedback. `nextAction` always stays from the rules.
 * Expected shape: { message, cue }. A bad message returns the rules feedback unchanged.
 */
export function mergeFeedback(rulesFeedback: CoachFeedback, aiJson: unknown): CoachFeedback {
  if (!isRecord(aiJson)) return rulesFeedback;
  const message = cleanText(aiJson.message, MAX_MESSAGE);
  if (!message) return rulesFeedback;
  let cue = rulesFeedback.cue;
  if (aiJson.cue === null) cue = null;
  else {
    const text = cleanText(aiJson.cue, MAX_CUE);
    if (text) cue = text;
  }
  return { source: 'ai', message, cue, nextAction: rulesFeedback.nextAction };
}
