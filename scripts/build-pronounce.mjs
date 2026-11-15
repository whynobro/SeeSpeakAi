// One-off script: node scripts/build-pronounce.mjs
// Reads the CMU Pronouncing Dictionary (npm package `cmu-pronouncing-dictionary`, ISC wrapper around the
// Carnegie Mellon data, BSD-style licence) and writes src/lib/ai/pronounce.generated.json.
// Kept: words of 2 to 8 lower-case letters with an S or SH sound, first pronunciation only, stress digits
// removed. Entries with a "#" comment in the source (mostly names and places) are dropped. Words with more
// than 2 vowel sounds are dropped (the check rejects them anyway). Also kept: the plain base of a plural ("cat" for "cats") so baseWordFor can look it up.
import { writeFileSync } from 'node:fs';
import { dictionary } from 'cmu-pronouncing-dictionary';

const strip = (p) => p.replace(/[0-9]/g, '');
const out = {};
const plain = (w) => /^[a-z]{2,8}$/.test(w);
const VOWELS = /^(AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)$/;
const clean = (raw) => !raw.includes('#');

for (const [word, raw] of Object.entries(dictionary)) {
  if (!plain(word) || !clean(raw)) continue;
  const ph = strip(raw).split(' ');
  if (!ph.includes('S') && !ph.includes('SH')) continue;
  if (ph.filter((p) => VOWELS.test(p)).length > 2) continue;
  out[word] = ph.join(' ');
  // Plural base, for example "cats" -> "cat".
  if (word.endsWith('s') && ph[ph.length - 1] === 'S') {
    const base = word.slice(0, -1);
    const baseRaw = dictionary[base];
    if (plain(base) && baseRaw && clean(baseRaw) && strip(baseRaw) === ph.slice(0, -1).join(' ')) {
      out[base] = ph.slice(0, -1).join(' ');
    }
  }
}

const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => (a < b ? -1 : 1)));
writeFileSync(
  new URL('../src/lib/ai/pronounce.generated.json', import.meta.url),
  JSON.stringify(sorted) + '\n',
);
console.log(Object.keys(sorted).length, 'words');
