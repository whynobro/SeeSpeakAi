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

describe('checkWord for z and ch', () => {
  it('accepts z words: plurals after a vowel or a voiced sound, and z at the start', () => {
    const good: [string, 'z', string][] = [
      ['dogs', 'z', 'end'],
      ['beds', 'z', 'end'],
      ['bees', 'z', 'end'],
      ['toys', 'z', 'end'],
      ['cars', 'z', 'end'],
      ['zoo', 'z', 'start'],
      ['zip', 'z', 'start'],
    ];
    for (const [word, target, position] of good) {
      const r = checkWord(word, target);
      expect(r.ok, word).toBe(true);
      if (r.ok) expect(r.position).toBe(position);
    }
  });

  it('rejects z words that borrow a voiceless sound or hold a second hiss', () => {
    expect(checkWord('cats', 'z').ok).toBe(false); // ends in "s"
    expect(checkWord('zebras', 'z').ok).toBe(false); // too long
    expect(checkWord('zoos', 'z').ok).toBe(false); // two z sounds
    expect(checkWord('shoes', 'z').ok).toBe(false); // has "sh" as well
    expect(checkWord('blorptastic', 'z').ok).toBe(false);
  });

  it('accepts ch words at the start and end', () => {
    const good: [string, string][] = [
      ['chip', 'start'],
      ['chair', 'start'],
      ['cheek', 'start'],
      ['watch', 'end'],
      ['beach', 'end'],
      ['lunch', 'end'],
      ['catch', 'end'],
    ];
    for (const [word, position] of good) {
      const r = checkWord(word, 'ch');
      expect(r.ok, word).toBe(true);
      if (r.ok) expect(r.position).toBe(position);
    }
  });

  it('rejects ch words spoken as k or sh, and ch words with another hiss', () => {
    expect(checkWord('school', 'ch').ok).toBe(false); // spoken "k"
    expect(checkWord('chef', 'ch').ok).toBe(false); // spoken "sh"
    expect(checkWord('cheese', 'ch').ok).toBe(false); // has a "z"
    expect(checkWord('chairs', 'ch').ok).toBe(false); // has a "z"
    expect(checkWord('church', 'ch').ok).toBe(false); // two "ch"
    expect(checkWord('chips', 'ch').ok).toBe(false); // has an "s"
  });

  it('keeps "s" and "sh" strict about z and ch sounds', () => {
    expect(checkWord('cheese', 's').ok).toBe(false);
    expect(checkWord('dogs', 'sh').ok).toBe(false);
    expect(checkWord('chip', 'sh').ok).toBe(false);
  });

  it('gives a base word for a z plural, and for nothing when the sounds differ', () => {
    expect(baseWordFor('bees', 'Z')).toBe('bee');
    expect(baseWordFor('cars', 'Z')).toBe('car');
    expect(baseWordFor('bees')).toBeNull(); // default ending is "s", and "bees" ends in "z"
    expect(toPracticeWord('toys', 'z')?.baseWord).toBe('toy');
    expect(toPracticeWord('cheese', 'ch')).toBeNull();
  });
});
