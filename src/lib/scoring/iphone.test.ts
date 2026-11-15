import { afterEach, describe, expect, it } from 'vitest';
import { scoreAttempt, setMicProfile } from '@/lib/scoring';
import fixture from '@/lib/scoring/fixtures/real-iphone-tries.json';
import type { FrameFeatures, PracticeWord, TargetSound } from '@/lib/types';

// Two real recordings from an iPhone (Safari, /lab, 2026-11-15): one of clear "s" ("sip"), one of clear "sh".
const tries = (fixture as { tries: { name: string; sound: TargetSound; frames: number[][] }[] }).tries;
const sRec = tries.find((t) => t.sound === 's')!;
const shRec = tries.find((t) => t.sound === 'sh')!;

function unpack(packed: number[][]): FrameFeatures[] {
  return packed.map(([tMs, level, hissRatio, centroidHz, flatness, voicing]) => ({
    tMs,
    level,
    hissLevel: 0,
    hissRatio,
    centroidHz: centroidHz < 0 ? null : centroidHz,
    flatness: flatness < 0 ? undefined : flatness,
    voicing,
  }));
}
const word = (target: TargetSound): PracticeWord => ({
  id: target === 's' ? 'sip' : 'ship',
  text: target === 's' ? 'sip' : 'ship',
  target,
  position: 'start',
  baseWord: null,
  contrastWord: null,
  sign: null,
});

afterEach(() => setMicProfile('default'));

describe('iPhone mic profile (real iPhone tries)', () => {
  it('with the laptop numbers, a clear iPhone "s" is not a hit (why the profile exists)', () => {
    setMicProfile('default');
    expect(scoreAttempt(unpack(sRec.frames), word('s')).verdict).not.toBe('hit');
  });

  it('with the iPhone numbers, a clear "s" is a hit and a clear "sh" is a hit', () => {
    setMicProfile('ios');
    expect(scoreAttempt(unpack(sRec.frames), word('s')).verdict).toBe('hit');
    expect(scoreAttempt(unpack(shRec.frames), word('sh')).verdict).toBe('hit');
  });

  it('with the iPhone numbers, the wrong hiss is still not a hit', () => {
    setMicProfile('ios');
    const shForS = scoreAttempt(unpack(shRec.frames), word('s'));
    expect(shForS.verdict).not.toBe('hit');
    expect(scoreAttempt(unpack(sRec.frames), word('sh')).verdict).not.toBe('hit');
  });
});
