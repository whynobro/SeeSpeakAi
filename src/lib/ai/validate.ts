import { WORD_BANK } from '@/content/words';
import type { CoachFeedback, PlanStep, PracticePlan, PracticeWord, TraceSummary } from '@/lib/types';

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

/** Numbers with units ("120 ms", "4kHz") and technical words must never reach the learner. */
const TECHNICAL_TEXT = /\d\s*(ms|k?hz)\b|\b(pitch|centroid|frequenc(y|ies))\b/i;

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
  if (!message || TECHNICAL_TEXT.test(message)) return rulesFeedback;
  let cue = rulesFeedback.cue;
  if (aiJson.cue === null) cue = null;
  else {
    const text = cleanText(aiJson.cue, MAX_CUE);
    if (text && TECHNICAL_TEXT.test(text)) return rulesFeedback;
    if (text) cue = text;
  }
  return { source: 'ai', message, cue, nextAction: rulesFeedback.nextAction };
}

function num(value: unknown, min: number, max: number): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : null;
}

/** Every field must be a finite number: clamp it to a sane range. Anything malformed drops the trace. */
export function cleanTrace(raw: unknown): TraceSummary | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const t = raw as Record<string, unknown>;
  const gapMs = t.gapMs === null ? null : num(t.gapMs, 0, 10000);
  const out = {
    hissMs: num(t.hissMs, 0, 10000),
    heldMs: num(t.heldMs, 0, 10000),
    positionStart: num(t.positionStart, 0, 1),
    positionMid: num(t.positionMid, 0, 1),
    positionEnd: num(t.positionEnd, 0, 1),
    drift: num(t.drift, -1, 1),
    steadiness: num(t.steadiness, 0, 1),
    hissToVowel: num(t.hissToVowel, 0, 100),
    vowelMs: num(t.vowelMs, 0, 10000),
  };
  if (gapMs === null && t.gapMs !== null) return null;
  if (Object.values(out).some((v) => v === null)) return null;
  return { ...(out as Omit<TraceSummary, 'gapMs'>), gapMs };
}
