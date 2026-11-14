// Download the shared test log to data/attempts.jsonl (one try per line) and print a summary.
// Needs BLOB_READ_WRITE_TOKEN in .env.local (run `vercel env pull` once). data/ is git-ignored.
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

const blobs = [];
let cursor;
do {
  const page = await list({ prefix: 'attempts/', cursor, limit: 1000 });
  blobs.push(...page.blobs);
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);
blobs.sort((a, b) => a.pathname.localeCompare(b.pathname));

const entries = [];
for (const blob of blobs) {
  const result = await get(blob.pathname, { access: 'private' });
  if (!result) continue;
  try {
    entries.push(JSON.parse(await new Response(result.stream).text()));
  } catch {
    console.error(`Skipped unreadable entry ${blob.pathname}`);
  }
}

mkdirSync('data', { recursive: true });
writeFileSync(
  'data/attempts.jsonl',
  entries.map((e) => JSON.stringify(e)).join('\n') + (entries.length ? '\n' : ''),
);

// Summary: for tries where the tester told us what they really said, was the verdict right?
const expected = { 'with-sound': 'hit', 'without-sound': 'miss', 'other-sound': 'close' };
const rows = new Map();
for (const e of entries) {
  const key = `${e.label || e.tester} | ${e.target} at ${e.position} | said: ${e.said ?? 'not asked'}`;
  const row = rows.get(key) ?? { n: 0, hit: 0, close: 0, miss: 0, right: 0, judged: 0 };
  row.n++;
  row[e.score.verdict]++;
  if (e.said && expected[e.said]) {
    row.judged++;
    if (e.score.verdict === expected[e.said]) row.right++;
  }
  rows.set(key, row);
}
console.log(`${entries.length} tries saved to data/attempts.jsonl\n`);
for (const [key, r] of [...rows].sort()) {
  const right = r.judged ? `, correct ${r.right}/${r.judged}` : '';
  console.log(`${key}: ${r.n} tries (hit ${r.hit}, close ${r.close}, miss ${r.miss}${right})`);
}
