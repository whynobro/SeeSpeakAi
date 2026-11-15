import { describe, expect, it } from 'vitest';
import { WORD_BANK } from '@/content/words';
import { baseWordFor, checkWord, toPracticeWord } from '@/lib/ai/wordCheck';

/** Bank words the dictionary check rejects. The bank itself is not edited here (Holly's lane). */
const KNOWN_BANK_EXCEPTIONS: string[] = [];

describe('checkWord on the word bank', () => {
  it('passes every bank word with its own target and position, except the known ones', () => {
    const failures: string[] = [];
    for (const w of WORD_BANK) {
      const r = checkWord(w.text, w.target);
      if (!r.ok || r.position !== w.position) failures.push(w.id);
    }
    expect(failures).toEqual(KNOWN_BANK_EXCEPTIONS);
  });
});

describe('checkWord', () => {
  const fails: [string, 's' | 'sh'][] = [
    ['dogs', 's'],
    ['beds', 's'],
    ['cars', 's'],
    ['bees', 's'],
    ['is', 's'],
    ['nose', 's'],
    ['sugar', 's'], // spelled with s, spoken "sh"
    ['sure', 's'], // same trap
    ['measure', 's'],
    ['measure', 'sh'],
    ['stop', 's'],
    ['snake', 's'],
    ['shoes', 'sh'], // ends in z
    ['church', 'sh'],
    ['juice', 's'],
    ['zebra', 's'],
    ['blorptastic', 's'],
    ['shit', 'sh'],
  ];
  for (const [word, target] of fails) {
    it(`rejects "${word}" for ${target} with a reason`, () => {
      const r = checkWord(word, target);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.length).toBeGreaterThan(5);
    });
  }

  it('accepts good words with the right position', () => {
    const good: [string, 's' | 'sh', string][] = [
      ['pass', 's', 'end'],
      ['kicks', 's', 'end'],
      ['nets', 's', 'end'],
      ['shot', 'sh', 'start'],
      ['ship', 'sh', 'start'],
      ['mouse', 's', 'end'],
      ['soap', 's', 'start'],
      ['boots', 's', 'end'],
      ['fish', 'sh', 'end'],
      ['bus', 's', 'end'],
    ];
    for (const [word, target, position] of good) {
      const r = checkWord(word, target);
      expect(r.ok, word).toBe(true);
      if (r.ok) expect(r.position).toBe(position);
    }
  });

  it('accepts "chef": it is spoken "sh" at the start, so the rules allow it', () => {
    const r = checkWord('chef', 'sh');
    expect(r.ok && r.position).toBe('start');
    expect(checkWord('chef', 's').ok).toBe(false);
  });

  it('is case and space tolerant', () => {
    expect(checkWord('  Pass ', 's').ok).toBe(true);
  });
});

describe('baseWordFor and toPracticeWord', () => {
  it('finds base words', () => {
    expect(baseWordFor('cats')).toBe('cat');
    expect(baseWordFor('kicks')).toBe('kick');
    expect(baseWordFor('bus')).toBeNull();
    expect(baseWordFor('dogs')).toBeNull();
    expect(baseWordFor('pass')).toBeNull();
  });

  it('builds a PracticeWord', () => {
    expect(toPracticeWord('Cats', 's')).toEqual({
      id: 'cats',
      text: 'cats',
      target: 's',
      position: 'end',
      baseWord: 'cat',
      contrastWord: null,
      sign: null,
    });
    expect(toPracticeWord('dogs', 's')).toBeNull();
  });
});
