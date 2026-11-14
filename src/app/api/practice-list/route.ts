// Server only. The API key must never reach the browser.
// No names, audio or hearing thresholds are accepted here: only target sounds, interests and a count.
import { getPracticeList } from '@/lib/ai/practiceList';
import type { PracticeListRequest, TargetSound } from '@/lib/types';

function bad(error: string): Response {
  return Response.json({ error }, { status: 400 });
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad('Body must be valid JSON.');
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return bad('Body must be an object.');
  const b = body as Record<string, unknown>;

  const t = b.targets;
  if (!Array.isArray(t) || t.length === 0 || !t.every((x) => x === 's' || x === 'sh')) {
    return bad('targets must be a non-empty array of "s" or "sh".');
  }
  const targets = t as TargetSound[];

  const interests = b.interests ?? [];
  if (
    !Array.isArray(interests) ||
    interests.length > 5 ||
    !interests.every((x) => typeof x === 'string' && x.length <= 40)
  ) {
    return bad('interests must be at most 5 strings of at most 40 characters.');
  }

  const count = b.count ?? 8;
  if (typeof count !== 'number' || !Number.isInteger(count) || count < 1 || count > 20) {
    return bad('count must be a whole number from 1 to 20.');
  }

  const req: PracticeListRequest = { targets, interests: interests as string[], count };
  return Response.json(await getPracticeList(req));
}
