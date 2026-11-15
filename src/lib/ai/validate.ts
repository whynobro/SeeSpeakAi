import { WORD_BANK } from '@/content/words';
import { toPracticeWord } from '@/lib/ai/wordCheck';
import { isTargetSound } from '@/lib/scoring/constants';
import type { LipShape, LipSummary } from '@/lib/lips/types';
import type { CoachFeedback, PlanStep, PracticePlan, PracticeWord, TraceSummary } from '@/lib/types';

// Built from a char code so this file never contains the character itself.
const EM_DASH = new RegExp(`\\s*${String.fromCharCode(0x2014)}\\s*`, 'g');

export const MAX_PLAN_TEXT = 300;
export const MAX_MESSAGE = 240;
export const MAX_CUE = 200;
export const MIN_AI_WORDS = 4;
const MAX_AI_WORDS = 12;
/** Themed words (suggested by Claude, checked by the dictionary) kept per step, and the step's total. */
export const MAX_THEMED_WORDS = 6;
export const WORDS_PER_STEP = 8;
/** At most this many suggestions are looked at per step. */
const MAX_SUGGESTIONS = 15;

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
 * Themed words: run each of Claude's suggestions through the pronunciation check, drop failures and repeats,
 * keep up to MAX_THEMED_WORDS, then fill up to WORDS_PER_STEP with the bank words. Grammar endings go first.
 * Returns the bank words unchanged when nothing passes.
 */
function withThemedWords(newWords: unknown, step: PlanStep, bankWords: PracticeWord[]): PracticeWord[] {
  if (!Array.isArray(newWords) || !isTargetSound(step.sound)) return bankWords;
  const target = step.sound;
  const themed: PracticeWord[] = [];
  for (const raw of newWords.slice(0, MAX_SUGGESTIONS)) {
    if (typeof raw !== 'string') continue;
    const word = toPracticeWord(raw, target);
    if (word && !themed.some((t) => t.id === word.id)) themed.push(word);
    if (themed.length >= MAX_THEMED_WORDS) break;
  }
  if (themed.length === 0) return bankWords;
  const fill = bankWords.filter((b) => !themed.some((t) => t.id === b.id));
  const all = [...themed, ...fill].slice(0, WORDS_PER_STEP);
  return [...all.filter((w) => w.baseWord !== null), ...all.filter((w) => w.baseWord === null)];
}

/**
 * Merge Claude's plan into the rules plan. Claude may only reorder steps, reword summary, why and goal, and
 * choose word ids from the word bank. The sounds and the `scored` flags always come from the rules plan.
 * Scored steps may also carry `newWords`: themed suggestions, each checked by wordCheck (set `allowThemed`
 * to false when the learner gave no interests).
 * Expected shape: { summary, steps: [{ sound, why, goal, wordIds, newWords? }] }.
 */
export function mergePlan(rulesPlan: PracticePlan, aiJson: unknown, allowThemed = true): PracticePlan {
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
    const bankWords = base.scored ? (pickWords(raw.wordIds, base) ?? base.words) : base.words;
    const words = base.scored && allowThemed ? withThemedWords(raw.newWords, base, bankWords) : bankWords;
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

const LIP_SHAPES: readonly LipShape[] = ['spread', 'rounded', 'neutral', 'unknown'];
const isLipShape = (v: unknown): v is LipShape => LIP_SHAPES.includes(v as LipShape);

/** Lip numbers from the camera: every number is clamped, the two shape calls must be known words. Anything else drops them. */
export function cleanLips(raw: unknown): LipSummary | null {
  if (!isRecord(raw)) return null;
  const out = {
    frames: num(raw.frames, 0, 5000),
    faceSeenShare: num(raw.faceSeenShare, 0, 1),
    rounded: num(raw.rounded, 0, 1),
    spread: num(raw.spread, 0, 1),
    jawOpen: num(raw.jawOpen, 0, 1),
    roundedEnd: num(raw.roundedEnd, 0, 1),
    spreadEnd: num(raw.spreadEnd, 0, 1),
  };
  if (Object.values(out).some((v) => v === null)) return null;
  if (!isLipShape(raw.shape) || !isLipShape(raw.shapeEnd)) return null;
  return { ...(out as Omit<LipSummary, 'shape' | 'shapeEnd'>), shape: raw.shape, shapeEnd: raw.shapeEnd };
}
