import { put } from '@vercel/blob';
import { isTargetSound } from '@/lib/scoring/constants';

const MAX_BYTES = 120_000;

// The shared test log. Only devices where a tester switched sharing on at /lab send anything here.
// Numbers only: no audio and no full names. Stored in our private Vercel Blob store.
// Without BLOB_READ_WRITE_TOKEN (local dev, forks) this does nothing and still answers OK.
export async function POST(request: Request) {
  let text: string;
  try {
    text = await request.text();
  } catch {
    return Response.json({ error: 'Could not read the body.' }, { status: 400 });
  }
  if (text.length > MAX_BYTES) return Response.json({ error: 'Too large.' }, { status: 413 });

  let entry: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error('shape');
    entry = parsed as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid JSON.' }, { status: 400 });
  }
  const okShape =
    entry.v === 1 &&
    isTargetSound(entry.target) &&
    (entry.page === 'practice' || entry.page === 'lab' || entry.page === 'guided') &&
    typeof entry.wordId === 'string' &&
    typeof entry.score === 'object' &&
    Array.isArray(entry.frames) &&
    Array.isArray(entry.runs);
  if (!okShape) return Response.json({ error: 'Not a test log entry.' }, { status: 400 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({ stored: false });

  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const id = `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    // The server sets the time, so a wrong clock on a phone cannot scramble the order.
    await put(`attempts/${day}/${id}.json`, JSON.stringify({ ...entry, receivedAt: now.toISOString() }), {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,
    });
    return Response.json({ stored: true });
  } catch {
    return Response.json({ stored: false }, { status: 502 });
  }
}
