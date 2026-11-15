import { put } from '@vercel/blob';
import { cleanLips } from '@/lib/ai/validate';
import { isTargetSound } from '@/lib/scoring/constants';
import { nicknameOnly } from '@/lib/testlog';

const MAX_BYTES = 120_000;

function isTryEntry(entry: Record<string, unknown>): boolean {
  return (
    entry.v === 1 &&
    isTargetSound(entry.target) &&
    (entry.page === 'practice' || entry.page === 'lab' || entry.page === 'guided') &&
    typeof entry.wordId === 'string' &&
    typeof entry.score === 'object' &&
    Array.isArray(entry.frames) &&
    Array.isArray(entry.runs)
  );
}

// The shared test log. Only devices where a tester switched sharing on at /lab send anything here.
// Numbers only: no audio and no full names. Stored in our private Vercel Blob store.
// Lip captures (`kind: 'lips'`) are stored the same way. Never a picture.
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
  // A lip capture from /lab/lips: the held sound and lip numbers, cleaned like the feedback route does.
  if (entry.kind === 'lips') {
    const summary = cleanLips(entry.summary);
    if (entry.v !== 1 || (entry.sound !== 's' && entry.sound !== 'sh') || !summary) {
      return Response.json({ error: 'Not a lip log entry.' }, { status: 400 });
    }
    const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');
    entry = {
      v: 1,
      kind: 'lips',
      attemptId: str(entry.attemptId, 40),
      at: str(entry.at, 40),
      tester: str(entry.tester, 20),
      label: nicknameOnly(entry.label),
      page: 'lab',
      sound: entry.sound,
      device: str(entry.device, 200),
      summary,
    };
  } else if (!isTryEntry(entry)) {
    return Response.json({ error: 'Not a test log entry.' }, { status: 400 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({ stored: false });

  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const id = `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    // The server sets the time, so a wrong clock on a phone cannot scramble the order.
    await put(
      `attempts/${day}/${id}.json`,
      JSON.stringify({ ...entry, label: nicknameOnly(entry.label), receivedAt: now.toISOString() }),
      {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
      },
    );
    return Response.json({ stored: true });
  } catch {
    return Response.json({ stored: false }, { status: 502 });
  }
}
