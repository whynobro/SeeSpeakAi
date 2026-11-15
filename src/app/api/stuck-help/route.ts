import { buildStuckHelp, cleanStuckRequest } from '@/lib/ai/stuck';

// Server only: the key must never reach the browser. Numbers only: no audio, no picture, no names. Nothing is stored.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON.' }, { status: 400 });
  }
  const req = cleanStuckRequest(body);
  if (!req) {
    return Response.json(
      { error: 'Expected { target: "s" | "sh" | "z" | "ch", word, tries: [{ score, trace, lips }] }.' },
      { status: 400 },
    );
  }
  return Response.json(await buildStuckHelp(req));
}
