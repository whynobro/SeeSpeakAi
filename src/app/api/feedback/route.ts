import { buildFeedback } from '@/lib/ai/feedback';
import { cleanLips, cleanTrace } from '@/lib/ai/validate';
import { isTargetSound } from '@/lib/scoring/constants';
import type { AttemptScore, FeedbackRequest, LearnerGoals } from '@/lib/types';

/** The learner's goals, already cleaned of names on the device. A generous limit only. */
function cleanGoals(value: unknown): LearnerGoals | null {
  if (typeof value !== 'object' || value === null) return null;
  const g = value as Partial<LearnerGoals>;
  const text = typeof g.text === 'string' ? g.text.slice(0, 6000) : '';
  const chips = Array.isArray(g.chips)
    ? g.chips
        .filter((c): c is string => typeof c === 'string')
        .slice(0, 12)
        .map((c) => c.slice(0, 40))
    : [];
  return text || chips.length > 0 ? { chips, text } : null;
}

// Server only: the key must never reach the browser. Numbers only: no audio, no names. Nothing is stored.
export async function POST(request: Request) {
  let body: Partial<FeedbackRequest>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON.' }, { status: 400 });
  }
  if (!isTargetSound(body.target) || typeof body.word !== 'string' || !Array.isArray(body.recent)) {
    return Response.json(
      { error: 'Expected { target: "s" | "sh" | "z" | "ch", word, recent: AttemptScore[] }.' },
      { status: 400 },
    );
  }
  const recent = (body.recent as AttemptScore[])
    .filter((a) => a && (a.verdict === 'hit' || a.verdict === 'close' || a.verdict === 'miss'))
    .slice(-10);
  const trace = cleanTrace(body.trace);
  return Response.json(
    await buildFeedback({
      target: body.target,
      word: body.word.slice(0, 40),
      recent,
      trace,
      learnerGoals: cleanGoals(body.learnerGoals),
      lips: cleanLips(body.lips),
    }),
  );
}
