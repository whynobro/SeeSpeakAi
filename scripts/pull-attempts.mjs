// Download the shared test log and write:
//   data/attempts.jsonl  one try per line (the newest entry for each try wins)
//   data/lips.jsonl      one lip capture per line (/lab/lips: the held sound and lip numbers, never a picture)
//   data/summary.md      how often the verdict was right, per tester and word type
// Needs BLOB_READ_WRITE_TOKEN in the environment or in .env.local (run `vercel env pull` once).
// data/ is git-ignored on main. A GitHub Action copies both files to the `test-log` branch.
// Usage: node scripts/pull-attempts.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { get, list } from '@vercel/blob';

try {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)="?([^"]*)"?$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  // No .env.local: rely on the environment.
}
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('No BLOB_READ_WRITE_TOKEN. Run `vercel env pull` in the repo first.');
  process.exit(1);
}

/** The log is published, so keep only the kind of device, not the full browser string. */
function coarseDevice(ua) {
  const text = String(ua ?? '');
  const system = /iPhone|iPad/.test(text)
    ? 'iPhone or iPad'
    : /Android/.test(text)
      ? 'Android'
      : /Windows/.test(text)
        ? 'Windows'
        : /Mac OS X/.test(text)
          ? 'Mac'
          : /Linux/.test(text)
            ? 'Linux'
            : 'other';
  const browser = /Edg\//.test(text)
    ? 'Edge'
    : /Firefox\//.test(text)
      ? 'Firefox'
      : /Chrome\//.test(text)
        ? 'Chrome'
        : /Safari\//.test(text)
          ? 'Safari'
          : 'other';
  return `${system}, ${browser}`;
}

const blobs = [];
let cursor;
do {
  const page = await list({ prefix: 'attempts/', cursor, limit: 1000 });
  blobs.push(...page.blobs);
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);
blobs.sort((a, b) => a.pathname.localeCompare(b.pathname));

// Entries arrive oldest first. A later entry with the same attemptId (the tester's answer) replaces the first.
const byTry = new Map();
for (const blob of blobs) {
  const result = await get(blob.pathname, { access: 'private' });
  if (!result) continue;
  try {
    const entry = JSON.parse(await new Response(result.stream).text());
    entry.device = coarseDevice(entry.device);
    const key = entry.attemptId ?? blob.pathname;
    const earlier = byTry.get(key);
    if (!earlier || entry.said || !earlier.said) byTry.set(key, entry);
  } catch {
    console.error(`Skipped unreadable entry ${blob.pathname}`);
  }
}
// Lip captures from /lab/lips (kind "lips") go to their own file. They have no verdict, so they stay out of the summary.
const lipEntries = [...byTry.values()].filter((e) => e.kind === 'lips');
// The log is public: a label is a nickname only (first word). Older tries saved a full name, so clean them here too.
for (const e of byTry.values()) {
  if (typeof e.label === 'string') e.label = (e.label.trim().split(/\s+/)[0] ?? '').slice(0, 20);
}
const entries = [...byTry.values()].filter((e) => e.kind !== 'lips');

mkdirSync('data', { recursive: true });
writeFileSync(
  'data/attempts.jsonl',
  entries.map((e) => JSON.stringify(e)).join('\n') + (entries.length ? '\n' : ''),
);

writeFileSync(
  'data/lips.jsonl',
  lipEntries.map((e) => JSON.stringify(e)).join('\n') + (lipEntries.length ? '\n' : ''),
);

// For tries where the tester told us what they really said: was the verdict right?
const expected = { 'with-sound': 'hit', 'without-sound': 'miss', 'other-sound': 'close', lisp: 'close' };
const rows = new Map();
const wrong = [];
for (const e of entries) {
  const who = e.label || e.tester;
  const key = `${who} | ${e.device} | ${e.page} | ${e.target} at ${e.position} | ${e.said ?? 'not answered'}`;
  const row = rows.get(key) ?? { n: 0, hit: 0, close: 0, miss: 0, right: 0, judged: 0 };
  row.n++;
  row[e.score.verdict]++;
  if (e.said && expected[e.said]) {
    row.judged++;
    if (e.score.verdict === expected[e.said]) row.right++;
    else wrong.push(e);
  }
  rows.set(key, row);
}

const judged = [...rows.values()].reduce((n, r) => n + r.judged, 0);
const right = [...rows.values()].reduce((n, r) => n + r.right, 0);
const lines = [
  '# SeeSpeak shared test log',
  '',
  `Updated ${new Date().toISOString()}. ${entries.length} tries. Numbers only, never audio.`,
  '',
  judged
    ? `Tries where the tester said what they really said: ${judged}. Verdict was right on ${right} of them.`
    : 'No tries have an answer yet ("what did you really say?"), so there is no accuracy number.',
  '',
  'This is a small test log from a few voices. It is not a clinical accuracy figure.',
  '',
  '| Tester | Device | Page | Scored as | Really said | Tries | Hit | Close | Miss | Verdict right |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ...[...rows].sort().map(([key, r]) => {
    const cells = key.split(' | ');
    return `| ${cells.join(' | ')} | ${r.n} | ${r.hit} | ${r.close} | ${r.miss} | ${r.judged ? `${r.right} of ${r.judged}` : '-'} |`;
  }),
  '',
  '## Tries where the verdict was wrong',
  '',
  wrong.length === 0
    ? 'None so far.'
    : '| When | Tester | Word | Scored as | Really said | Verdict | Runs (length ms / held ms / meter) |',
  ...(wrong.length === 0 ? [] : ['| --- | --- | --- | --- | --- | --- | --- |']),
  ...wrong.map((e) => {
    const runs = (e.runs ?? [])
      .map(
        (r) =>
          `${Math.round(r.lengthMs)} / ${Math.round(r.sustainedMs)} / ${r.meanPosition?.toFixed(2) ?? '-'}`,
      )
      .join('; ');
    return `| ${e.receivedAt ?? e.at} | ${e.label || e.tester} | ${e.wordId} | ${e.target} at ${e.position} | ${e.said} | ${e.score.verdict} | ${runs || 'none'} |`;
  }),
  '',
  'Every try, with its frame-by-frame numbers, is in `attempts.jsonl` (one JSON object per line).',
  '',
];
writeFileSync('data/summary.md', lines.join('\n'));

console.log(`${entries.length} tries saved to data/attempts.jsonl, summary in data/summary.md`);
console.log(lines.slice(4, 5).join('\n'));
for (const [key, r] of [...rows].sort()) {
  const mark = r.judged ? `, right ${r.right}/${r.judged}` : '';
  console.log(`${key}: ${r.n} tries (hit ${r.hit}, close ${r.close}, miss ${r.miss}${mark})`);
}
