import { buildFeedback } from '@/lib/ai/feedback';
import { cleanTrace } from '@/lib/ai/validate';
import { isTargetSound } from '@/lib/scoring/constants';
import type { AttemptScore, FeedbackRequest } from '@/lib/types';

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
    await buildFeedback({ target: body.target, word: body.word.slice(0, 40), recent, trace }),
  );
}
