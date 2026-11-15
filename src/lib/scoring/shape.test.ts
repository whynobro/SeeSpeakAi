import { describe, expect, it } from 'vitest';
import { featuresFromSamples } from '@/lib/audio/features';
import { WORD_BANK } from '@/content/words';
import { levelItems, phrasesFor } from '@/lib/levels';
import { SHAPE_WARNING, scoreAttempt } from '@/lib/scoring';
import {
  SHAPE_REASON_NO_VOWEL,
  SHAPE_REASON_TOO_MANY,
  syllablesOf,
  wordSyllables,
} from '@/lib/scoring/shape';
import { concat, hiss, silence, voicedHiss, vowel } from '@/lib/scoring/synth';
import type { PracticeWord, TargetSound } from '@/lib/types';

const SR = 48000;

/** Syllables of every bank word, by ear. A new bank word must be added here. */
const BANK_SYLLABLES: Record<string, number> = {
  cats: 1,
  hats: 1,
  cups: 1,
  books: 1,
  ducks: 1,
  boats: 1,
  rocks: 1,
  maps: 1,
  bats: 1,
  lips: 1,
  bus: 1,
  yes: 1,
  house: 1,
  mouse: 1,
  ice: 1,
  face: 1,
  sun: 1,
  sip: 1,
  sock: 1,
  seat: 1,
  soap: 1,
  sea: 1,
  sew: 1,
  save: 1,
  ship: 1,
  shoe: 1,
  sheep: 1,
  shop: 1,
  shell: 1,
  shirt: 1,
  sheet: 1,
  show: 1,
  fish: 1,
  wash: 1,
  dish: 1,
  push: 1,
  brush: 1,
  bush: 1,
  dogs: 1,
  beds: 1,
  bees: 1,
  toys: 1,
  cars: 1,
  eggs: 1,
  pigs: 1,
  keys: 1,
  nose: 1,
  rose: 1,
  buzz: 1,
  zoo: 1,
  zip: 1,
  zero: 2,
  zebra: 2,
  zoom: 1,
  zone: 1,
  zap: 1,
  chip: 1,
  chop: 1,
  chin: 1,
  cheek: 1,
  chair: 1,
  chalk: 1,
  chat: 1,
  watch: 1,
  beach: 1,
  lunch: 1,
  peach: 1,
  catch: 1,
  match: 1,
  bench: 1,
};

function bank(text: string, target: TargetSound): PracticeWord {
  const w = WORD_BANK.find((x) => x.text === text && x.target === target);
  if (!w) throw new Error(`${text} is not in the word bank`);
  return w;
}

function score(samples: Float32Array, w: PracticeWord, alone = false) {
  return scoreAttempt(featuresFromSamples(samples, SR), w, { alone });
}

describe('syllables from the spelling', () => {
  it('every bank word has the right count', () => {
    for (const w of WORD_BANK) {
      expect(BANK_SYLLABLES[w.text], `add "${w.text}" to BANK_SYLLABLES`).toBeDefined();
      expect(wordSyllables(w.text), w.text).toBe(BANK_SYLLABLES[w.text]);
    }
  });

  it('a phrase counts every word', () => {
    expect(syllablesOf('a big sun')).toBe(3);
    expect(syllablesOf('a little mouse')).toBe(4);
    expect(syllablesOf('a big zebra')).toBe(4);
    for (const t of ['s', 'sh', 'z', 'ch'] as const) {
      for (const p of phrasesFor(t)) {
        const sum = p.text.split(' ').reduce((n, w) => n + wordSyllables(w), 0);
        expect(syllablesOf(p.text), p.text).toBe(sum);
      }
    }
  });

  it('a sound on its own has no syllables, so it is never shape checked', () => {
    for (const t of ['s', 'sh', 'z', 'ch'] as const) {
      expect(syllablesOf(levelItems(t, 'alone')[0].text)).toBe(0);
    }
    expect(syllablesOf('s')).toBe(0);
    expect(syllablesOf('sh')).toBe(0);
  });

  it('handles silent e, "le" and a starting "y"', () => {
    expect(wordSyllables('little')).toBe(2);
    expect(wordSyllables('table')).toBe(2);
    expect(wordSyllables('practice')).toBe(2);
    expect(wordSyllables('yes')).toBe(1);
    expect(wordSyllables('the')).toBe(1);
  });
});

describe('word shape', () => {
  it('vowel + "s" for "bus" passes', () => {
    const r = score(
      concat(silence(100, SR), vowel(200, SR), hiss('s', 200, SR), silence(100, SR)),
      bank('bus', 's'),
    );
    expect(r.verdict).toBe('hit');
    expect(r.warnings).not.toContain(SHAPE_WARNING);
  });

  it('a hiss with no vowel for "sip" fails with the shape warning first', () => {
    const r = score(concat(silence(100, SR), hiss('s', 400, SR), silence(100, SR)), bank('sip', 's'));
    expect(r.verdict).toBe('miss');
    expect(r.warnings[0]).toBe(SHAPE_WARNING);
    expect(r.warnings[1]).toBe(SHAPE_REASON_NO_VOWEL);
    expect(r.confidence).toBeLessThan(0.5);
  });

  it('the same hiss on the "sound alone" level is still a hit', () => {
    const clip = concat(silence(100, SR), hiss('s', 400, SR), silence(100, SR));
    const r = score(clip, levelItems('s', 'alone')[0], true);
    expect(r.verdict).toBe('hit');
    expect(r.warnings).not.toContain(SHAPE_WARNING);
  });

  it('three vowel beats for a one-syllable word fail', () => {
    const clip = concat(
      silence(100, SR),
      hiss('s', 200, SR),
      vowel(200, SR),
      silence(300, SR),
      vowel(200, SR),
      silence(300, SR),
      vowel(200, SR),
      silence(100, SR),
    );
    const r = score(clip, bank('sun', 's'));
    expect(r.verdict).toBe('miss');
    expect(r.warnings[0]).toBe(SHAPE_WARNING);
    expect(r.warnings[1]).toBe(SHAPE_REASON_TOO_MANY);
  });

  it('two vowel beats for a one-syllable word still pass (a click or a breath can add one)', () => {
    const clip = concat(
      silence(100, SR),
      hiss('s', 200, SR),
      vowel(200, SR),
      silence(300, SR),
      vowel(200, SR),
      silence(100, SR),
    );
    expect(score(clip, bank('sun', 's')).verdict).toBe('hit');
  });

  it('the same word said three times, each with its hiss, is not called another word', () => {
    const once = () => concat(hiss('s', 200, SR), vowel(200, SR), silence(300, SR));
    const r = score(concat(silence(100, SR), once(), once(), once()), bank('sun', 's'));
    expect(r.verdict).toBe('hit');
  });

  it('a two-syllable bank word with two vowels passes ("zebra")', () => {
    const clip = concat(
      silence(100, SR),
      voicedHiss(200, SR),
      vowel(150, SR),
      silence(80, SR),
      vowel(200, SR),
      silence(100, SR),
    );
    const r = score(clip, bank('zebra', 'z'));
    expect(r.warnings).not.toContain(SHAPE_WARNING);
    expect(r.verdict).toBe('hit');
  });

  it('a phrase passes with one beat per word ("a big sun")', () => {
    const phrase = phrasesFor('s').find((p) => p.text === 'a big sun')!;
    const clip = concat(
      silence(100, SR),
      vowel(100, SR),
      silence(200, SR),
      vowel(150, SR),
      silence(200, SR),
      hiss('s', 200, SR),
      vowel(200, SR),
      silence(100, SR),
    );
    const r = score(clip, phrase);
    expect(r.warnings).not.toContain(SHAPE_WARNING);
    expect(r.verdict).toBe('hit');
  });

  it('a phrase said for a single word fails', () => {
    const clip = concat(
      silence(100, SR),
      vowel(150, SR),
      silence(200, SR),
      vowel(150, SR),
      silence(200, SR),
      hiss('s', 200, SR),
      vowel(200, SR),
      silence(200, SR),
      vowel(150, SR),
      silence(100, SR),
    );
    expect(score(clip, bank('sun', 's')).warnings[0]).toBe(SHAPE_WARNING);
  });

  it('a long stretch of voice for a one-syllable word fails', () => {
    const clip = concat(silence(100, SR), hiss('s', 200, SR), vowel(1600, SR), silence(100, SR));
    const r = score(clip, bank('sun', 's'));
    expect(r.warnings[0]).toBe(SHAPE_WARNING);
    expect(r.warnings[1]).toBe(SHAPE_REASON_TOO_MANY);
  });

  it('"ch" words are shape checked too', () => {
    const r = score(concat(silence(100, SR), hiss('sh', 300, SR), silence(100, SR)), bank('chip', 'ch'));
    expect(r.verdict).toBe('miss');
    expect(r.warnings[0]).toBe(SHAPE_WARNING);
  });
});
