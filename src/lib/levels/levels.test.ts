import { describe, expect, it } from 'vitest';
import { featuresFromSamples } from '@/lib/audio/features';
import {
  GOLD_MIN_CONFIDENCE,
  ITEMS_PER_LEVEL,
  LEVELS,
  TIERS,
  countsFor,
  currentLevel,
  currentTier,
  isTierUnlocked,
  isUnlocked,
  levelItems,
  levelKey,
  mergeResult,
  nextLevel,
  normalizeLevelResult,
  passItems,
  phrasesFor,
  tierPasses,
  tierPassed,
  type Tier,
} from '@/lib/levels';
import { WORD_BANK } from '@/content/words';
import type { AttemptScore, TargetSound } from '@/lib/types';
import { scoreAttempt } from '@/lib/scoring';
import { TARGET_SOUNDS } from '@/lib/scoring/constants';
import { concat, hiss, silence, vowel } from '@/lib/scoring/synth';

const SR = 48000;

describe('levels', () => {
  it('go in therapy order: alone, start, end, phrase', () => {
    expect(LEVELS.map((l) => l.id)).toEqual(['alone', 'start', 'end', 'phrase']);
    expect(LEVELS.map((l) => l.stage)).toEqual(['find', 'lock', 'lock', 'use']);
    expect(nextLevel('alone')?.id).toBe('start');
    expect(nextLevel('phrase')).toBeNull();
  });

  it('every sound has a full set of items at every level, all with the right target', () => {
    for (const sound of TARGET_SOUNDS) {
      for (const level of LEVELS) {
        const items = levelItems(sound, level.id);
        expect(items, `${sound} ${level.id}`).toHaveLength(ITEMS_PER_LEVEL);
        for (const item of items) expect(item.target).toBe(sound);
      }
    }
  });

  it('start and end levels use bank words in that spot', () => {
    for (const sound of TARGET_SOUNDS) {
      for (const w of levelItems(sound, 'start')) expect(w.position).toBe('start');
      for (const w of levelItems(sound, 'end')) expect(w.position).toBe('end');
    }
  });

  it('phrase lead-ins carry no other hiss', () => {
    for (const sound of TARGET_SOUNDS) {
      for (const p of levelItems(sound, 'phrase')) {
        const words = p.text.split(' ');
        const lead = words.slice(0, -1).join(' ');
        expect(lead, p.text).not.toMatch(/[szfv]|sh|ch|th/);
        expect(words.length).toBeGreaterThan(1);
      }
    }
  });

  it('unlocks tiers in order, and the next level only after silver', () => {
    let results = {};
    expect(isUnlocked(results, 's', 'alone')).toBe(true);
    expect(isTierUnlocked(results, 's', 'alone', 'bronze')).toBe(true);
    expect(isTierUnlocked(results, 's', 'alone', 'silver')).toBe(false);
    expect(isTierUnlocked(results, 's', 'alone', 'gold')).toBe(false);
    expect(isUnlocked(results, 's', 'start')).toBe(false);
    expect(currentLevel(results, 's').id).toBe('alone');
    expect(currentTier(results, 's', 'alone').id).toBe('bronze');

    results = mergeResult(results, 's', 'alone', 'bronze', 3);
    expect(isTierUnlocked(results, 's', 'alone', 'silver')).toBe(false);

    results = mergeResult(results, 's', 'alone', 'bronze', 4);
    expect(isTierUnlocked(results, 's', 'alone', 'silver')).toBe(true);
    expect(isTierUnlocked(results, 's', 'alone', 'gold')).toBe(false);
    expect(isUnlocked(results, 's', 'start')).toBe(false); // bronze alone does not open the next level
    expect(currentTier(results, 's', 'alone').id).toBe('silver');

    results = mergeResult(results, 's', 'alone', 'silver', 4);
    expect(isTierUnlocked(results, 's', 'alone', 'gold')).toBe(true);
    expect(isUnlocked(results, 's', 'start')).toBe(true);
    expect(isTierUnlocked(results, 's', 'start', 'bronze')).toBe(true);
    expect(isTierUnlocked(results, 's', 'start', 'silver')).toBe(false);
    expect(isUnlocked(results, 'sh', 'start')).toBe(false);
    expect(currentLevel(results, 's').id).toBe('start');
  });

  it('never takes a pass away, and counts plays', () => {
    let results = mergeResult({}, 's', 'alone', 'silver', 5);
    results = mergeResult(results, 's', 'alone', 'silver', 1);
    expect(results[levelKey('s', 'alone')]?.tiers.silver).toMatchObject({
      passed: true,
      bestHits: 5,
      plays: 2,
    });
  });

  it('a harder pass covers the easier tiers', () => {
    const results = mergeResult({}, 's', 'alone', 'gold', 5);
    expect(tierPassed(results, 's', 'alone', 'silver')).toBe(true);
    expect(tierPassed(results, 's', 'alone', 'bronze')).toBe(true);
    expect(isUnlocked(results, 's', 'start')).toBe(true);
  });

  it('pass counts: bronze 4 of 5, silver 4 of 5, gold 5 of 5', () => {
    expect(passItems('bronze')).toBe(4);
    expect(passItems('silver')).toBe(4);
    expect(passItems('gold')).toBe(5);
    expect(tierPasses('bronze', 4)).toBe(true);
    expect(tierPasses('silver', 3)).toBe(false);
    expect(tierPasses('gold', 4)).toBe(false);
    expect(tierPasses('gold', 5)).toBe(true);
  });

  it('reads the old saved shape as silver, and drops junk', () => {
    const old = { bestHits: 4, passed: true, updatedAt: '2026-11-13T00:00:00.000Z' };
    const r = normalizeLevelResult(old);
    expect(r?.tiers.silver).toMatchObject({ bestHits: 4, passed: true });
    expect(r?.tiers.bronze).toBeUndefined();
    const results = { [levelKey('s', 'alone')]: r! };
    expect(isUnlocked(results, 's', 'start')).toBe(true);
    expect(isTierUnlocked(results, 's', 'alone', 'gold')).toBe(true);
    const fresh = { tiers: { gold: { bestHits: 5, passed: true, plays: 2, updatedAt: 'x' } } };
    expect(normalizeLevelResult(fresh)).toEqual(fresh);
    expect(normalizeLevelResult('nope')).toBeNull();
    expect(normalizeLevelResult({ bestHits: 'x' })).toBeNull();
  });
});

function score(over: Partial<AttemptScore>): AttemptScore {
  return {
    target: 's',
    verdict: 'hit',
    heard: 's',
    meterPosition: 0.9,
    hissMs: 400,
    confidence: 0.9,
    warnings: [],
    ...over,
  };
}

describe('what counts per tier', () => {
  it('bronze takes a hit or a close try, not a miss', () => {
    expect(countsFor('bronze', score({ verdict: 'hit' }))).toBe(true);
    expect(countsFor('bronze', score({ verdict: 'close' }))).toBe(true);
    expect(countsFor('bronze', score({ verdict: 'miss' }))).toBe(false);
  });

  it('silver takes only a hit', () => {
    expect(countsFor('silver', score({ verdict: 'hit' }))).toBe(true);
    expect(countsFor('silver', score({ verdict: 'close' }))).toBe(false);
    expect(countsFor('silver', score({ verdict: 'miss' }))).toBe(false);
  });

  it('gold needs a hit, enough confidence and no lisp', () => {
    expect(countsFor('gold', score({ confidence: GOLD_MIN_CONFIDENCE }))).toBe(true);
    expect(countsFor('gold', score({ confidence: GOLD_MIN_CONFIDENCE - 0.01 }))).toBe(false);
    expect(countsFor('gold', score({ lisp: true }))).toBe(false);
    expect(countsFor('gold', score({ lisp: false }))).toBe(true);
    expect(countsFor('gold', score({ verdict: 'close', confidence: 1 }))).toBe(false);
  });
});

describe('new items for each tier and round', () => {
  const tiers = TIERS.map((t) => t.id);
  const texts = (sound: TargetSound, level: 'start' | 'end' | 'phrase', tier: Tier, round: number) =>
    levelItems(sound, level, tier, round)
      .map((w) => w.text)
      .join('|');

  it('differ between tiers and between rounds, and are valid bank words', () => {
    for (const sound of TARGET_SOUNDS) {
      for (const level of ['start', 'end', 'phrase'] as const) {
        expect(new Set(tiers.map((t) => texts(sound, level, t, 0))).size, `${sound} ${level} tiers`).toBe(3);
        for (const t of tiers) {
          expect(texts(sound, level, t, 0), `${sound} ${level} ${t} round`).not.toBe(
            texts(sound, level, t, 1),
          );
          expect(texts(sound, level, t, 2)).toBe(texts(sound, level, t, 2)); // fixed, no randomness
          const items = levelItems(sound, level, t, 1);
          expect(items).toHaveLength(ITEMS_PER_LEVEL);
          for (const item of items) {
            const word = level === 'phrase' ? item.text.split(' ').slice(-1)[0] : item.text;
            expect(
              WORD_BANK.some((w) => w.text === word && w.target === sound),
              `${sound} ${item.text}`,
            ).toBe(true);
          }
        }
      }
    }
  });

  it('every sound has at least 10 phrases, each with a clean lead-in', () => {
    for (const sound of TARGET_SOUNDS) {
      const phrases = phrasesFor(sound);
      expect(phrases.length, sound).toBeGreaterThanOrEqual(10);
      expect(new Set(phrases.map((p) => p.text)).size, sound).toBe(phrases.length);
      for (const p of phrases) {
        const lead = p.text.split(' ').slice(0, -1).join(' ');
        expect(lead, p.text).not.toMatch(/[szfv]|sh|ch|th/);
      }
    }
  });

  it('the sound alone stays the sound itself', () => {
    for (const t of tiers) {
      expect(new Set(levelItems('s', 'alone', t, 3).map((w) => w.text))).toEqual(new Set(['sss']));
    }
  });
});

describe('scoring the sound alone', () => {
  const alone = levelItems('s', 'alone')[0];
  const sss = () => featuresFromSamples(concat(silence(150, SR), hiss('s', 500, SR), silence(150, SR)), SR);
  const shh = () => featuresFromSamples(concat(silence(150, SR), hiss('sh', 500, SR), silence(150, SR)), SR);

  it('a held "s" with no word around it is a hit, with no vowel warning', () => {
    const r = scoreAttempt(sss(), alone, { alone: true });
    expect(r.verdict).toBe('hit');
    expect(r.warnings.join(' ')).not.toMatch(/vowel/);
  });

  it('a held "sh" when "s" is asked is close, not a hit', () => {
    const r = scoreAttempt(shh(), alone, { alone: true });
    expect(r.verdict).toBe('close');
    expect(r.heard).toBe('sh');
  });

  it('a vowel only is a miss', () => {
    const r = scoreAttempt(featuresFromSamples(concat(silence(150, SR), vowel(400, SR)), SR), alone, {
      alone: true,
    });
    expect(r.verdict).toBe('miss');
  });

  it('in a word, placement still counts: an "s" after the vowel is not a start "s"', () => {
    const start = levelItems('s', 'start')[0];
    const frames = featuresFromSamples(
      concat(silence(100, SR), vowel(200, SR), hiss('s', 200, SR), silence(100, SR)),
      SR,
    );
    expect(scoreAttempt(frames, start).verdict).toBe('miss');
  });
});
