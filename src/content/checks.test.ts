import { describe, expect, it } from 'vitest';
import { CHECK_POSITIONS, CHECK_SOUNDS, GOAL_CHIPS, LISTEN_PAIRS, TRY_ALONE, checkWordsFor } from './checks';

const AGES = ['child', 'teen', 'adult'] as const;

/** Letters that usually mean another hiss-like sound. "fish" keeps its "f" outside the scored end zone. */
const OTHER_HISS = /[zxj]|ph|tch|ge|gi/;
const F_ALLOWED = new Set(['fish']);

describe('check words', () => {
  for (const age of AGES) {
    describe(age, () => {
      const words = checkWordsFor(age);

      it('has 3 unique words for every sound and spot', () => {
        expect(words).toHaveLength(18);
        expect(new Set(words.map((w) => w.id)).size).toBe(18);
        for (const sound of CHECK_SOUNDS) {
          for (const position of CHECK_POSITIONS) {
            expect(words.filter((w) => w.target === sound && w.position === position)).toHaveLength(3);
          }
        }
      });

      it('spells every sh word with exactly one "sh" and no other "s"', () => {
        for (const w of words.filter((x) => x.target === 'sh')) {
          expect(w.text.split('sh').length - 1, w.text).toBe(1);
          expect(w.text.replace('sh', ''), w.text).not.toContain('s');
        }
      });

      it('keeps "sh" out of s words and has one s-spelling only', () => {
        for (const w of words.filter((x) => x.target === 's')) {
          expect(w.text, w.text).not.toContain('sh');
          expect(w.text.replace('ss', 's').split('s').length - 1, w.text).toBeLessThanOrEqual(1);
          expect(/[sc]/.test(w.text), w.text).toBe(true);
        }
      });

      it('has no "s" cluster at the start and no other hiss-like letters', () => {
        for (const w of words) {
          expect(/^s[ptkclmnwq]/.test(w.text), w.text).toBe(false);
          expect(OTHER_HISS.test(w.text), w.text).toBe(false);
          if (!F_ALLOWED.has(w.id)) expect(w.text, w.text).not.toContain('f');
        }
      });

      it('has 4 listening pairs, the last one the no-hiss control', () => {
        const pairs = LISTEN_PAIRS[age];
        expect(pairs).toHaveLength(4);
        expect(pairs.filter((p) => p.control)).toHaveLength(1);
        expect(pairs[3].control).toBe(true);
        for (const p of pairs.filter((x) => !x.control)) {
          expect(p.sh, p.sh).toContain('sh');
          expect(p.s, p.s).not.toContain('sh');
        }
      });

      it('offers goal chips', () => {
        expect(GOAL_CHIPS[age].length).toBeGreaterThanOrEqual(4);
      });
    });
  }

  it('has a try-alone syllable for every sound and spot', () => {
    for (const sound of CHECK_SOUNDS) {
      for (const position of CHECK_POSITIONS) expect(TRY_ALONE[sound][position]).toContain(sound);
    }
  });
});
