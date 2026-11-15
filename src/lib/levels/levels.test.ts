import { describe, expect, it } from 'vitest';
import { featuresFromSamples } from '@/lib/audio/features';
import {
  ITEMS_PER_LEVEL,
  LEVELS,
  currentLevel,
  isUnlocked,
  levelItems,
  levelKey,
  mergeResult,
  nextLevel,
  passed,
} from '@/lib/levels';
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

  it('unlocks the next level only after a pass, and never takes a pass away', () => {
    let results = {};
    expect(isUnlocked(results, 's', 'alone')).toBe(true);
    expect(isUnlocked(results, 's', 'start')).toBe(false);
    expect(currentLevel(results, 's').id).toBe('alone');

    results = mergeResult(results, 's', 'alone', 3);
    expect(isUnlocked(results, 's', 'start')).toBe(false);

    results = mergeResult(results, 's', 'alone', 4);
    expect(passed(4)).toBe(true);
    expect(isUnlocked(results, 's', 'start')).toBe(true);
    expect(isUnlocked(results, 'sh', 'start')).toBe(false);
    expect(currentLevel(results, 's').id).toBe('start');

    results = mergeResult(results, 's', 'alone', 1);
    expect(
      (results as Record<string, { passed: boolean; bestHits: number }>)[levelKey('s', 'alone')],
    ).toMatchObject({
      passed: true,
      bestHits: 4,
    });
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
