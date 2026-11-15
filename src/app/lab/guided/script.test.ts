import { describe, expect, it } from 'vitest';
import { GUIDED_SCRIPT, instructionFor, matchedExpectation, wordOf } from './script';
import type { AttemptScore } from '@/lib/types';

const score = (verdict: AttemptScore['verdict']): AttemptScore => ({
  target: 's',
  verdict,
  heard: null,
  meterPosition: null,
  hissMs: 0,
  confidence: 1,
  warnings: [],
});

describe('guided script', () => {
  it('has 24 steps that all resolve to words in the word bank', () => {
    expect(GUIDED_SCRIPT).toHaveLength(24);
    for (const step of GUIDED_SCRIPT) expect(wordOf(step)).toBeTruthy();
  });

  it('covers all four sounds, both starts and ends, and all three ways to say a word', () => {
    const words = GUIDED_SCRIPT.map(wordOf);
    for (const sound of ['s', 'sh', 'z', 'ch']) expect(words.some((w) => w.target === sound)).toBe(true);
    expect(words.some((w) => w.position === 'start')).toBe(true);
    expect(words.some((w) => w.position === 'end')).toBe(true);
    for (const say of ['with-sound', 'without-sound', 'other-sound'])
      expect(GUIDED_SCRIPT.some((s) => s.say === say)).toBe(true);
  });

  it('gives every swapped or dropped step a spoken form', () => {
    for (const step of GUIDED_SCRIPT) if (step.say !== 'with-sound') expect(step.as).toBeTruthy();
  });

  it('writes plain instructions', () => {
    expect(instructionFor({ wordId: 'cats', say: 'with-sound' })).toBe('cats');
    expect(instructionFor({ wordId: 'sip', say: 'other-sound', as: 'ship' })).toBe('ship');
    expect(instructionFor({ wordId: 'hats', say: 'without-sound', as: 'hat' })).toBe('hat');
  });

  it('judges a match against what was asked', () => {
    expect(matchedExpectation({ wordId: 'cats', say: 'with-sound' }, score('hit'))).toBe(true);
    expect(matchedExpectation({ wordId: 'cats', say: 'with-sound' }, score('close'))).toBe(false);
    expect(matchedExpectation({ wordId: 'hats', say: 'without-sound', as: 'hat' }, score('miss'))).toBe(true);
    expect(matchedExpectation({ wordId: 'sip', say: 'other-sound', as: 'ship' }, score('close'))).toBe(true);
    expect(matchedExpectation({ wordId: 'sip', say: 'other-sound', as: 'ship' }, score('hit'))).toBe(false);
  });
});
