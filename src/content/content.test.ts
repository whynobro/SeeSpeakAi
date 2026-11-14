import { describe, expect, it } from 'vitest';
import { CUES } from '@/content/cues';
import { WORD_BANK, wordsFor } from '@/content/words';
import type { TargetSound, WordPosition } from '@/lib/types';

describe('WORD_BANK', () => {
  it('has unique ids', () => {
    const ids = WORD_BANK.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has at least 28 words and ids match the text', () => {
    expect(WORD_BANK.length).toBeGreaterThanOrEqual(28);
    for (const w of WORD_BANK) expect(w.id).toBe(w.text.toLowerCase());
  });

  it('contains the letters of its target', () => {
    for (const w of WORD_BANK) {
      if (w.target === 'sh') expect(w.text, w.text).toContain('sh');
      else expect(/s|c/.test(w.text), w.text).toBe(true);
    }
  });

  it('has no "sh" in s words', () => {
    for (const w of WORD_BANK.filter((x) => x.target === 's')) expect(w.text, w.text).not.toContain('sh');
  });

  it('only makes plurals after a voiceless consonant', () => {
    for (const w of WORD_BANK.filter((x) => x.baseWord !== null)) {
      expect(w.text, w.text).toBe(`${w.baseWord}s`);
      expect(/(p|t|k|ck|f)$/.test(w.baseWord ?? ''), w.text).toBe(true);
    }
  });

  it('has at least 5 words for each target and position used', () => {
    const pairs: [TargetSound, WordPosition][] = [
      ['s', 'start'],
      ['s', 'end'],
      ['sh', 'start'],
      ['sh', 'end'],
    ];
    for (const [t, p] of pairs) {
      const n = WORD_BANK.filter((w) => w.target === t && w.position === p).length;
      expect(n, `${t} ${p}`).toBeGreaterThanOrEqual(5);
    }
    expect(WORD_BANK.filter((w) => w.baseWord !== null).length).toBeGreaterThanOrEqual(8);
  });
});

describe('wordsFor', () => {
  it('respects count and target', () => {
    for (const t of ['s', 'sh'] as const) {
      const list = wordsFor(t, 6);
      expect(list).toHaveLength(6);
      expect(list.every((w) => w.target === t)).toBe(true);
    }
    expect(wordsFor('s', 0)).toEqual([]);
    expect(wordsFor('sh', 999).length).toBeLessThan(999);
  });

  it('is deterministic and puts grammar endings early', () => {
    expect(wordsFor('s', 8)).toEqual(wordsFor('s', 8));
    expect(wordsFor('s', 3)[0].baseWord).not.toBeNull();
  });
});

describe('CUES', () => {
  it('covers both sounds with at least 3 steps', () => {
    for (const t of ['s', 'sh'] as const) {
      expect(CUES[t].sound).toBe(t);
      expect(CUES[t].steps.length).toBeGreaterThanOrEqual(3);
    }
  });
});
