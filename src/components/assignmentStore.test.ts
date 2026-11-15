import { describe, expect, it } from 'vitest';
import { assignPath, assignmentFromParams, assignmentStartHref, toAssignment } from './assignmentStore';

function fromQuery(query: string) {
  const params = new URLSearchParams(query);
  return assignmentFromParams((key) => params.get(key));
}

describe('practice link', () => {
  it('round-trips what the therapist chose', () => {
    const a = toAssignment(['sh', 's'], 'start', 5);
    expect(a).toEqual({ sounds: ['s', 'sh'], level: 'start', days: 5 });
    expect(assignPath(a!)).toBe('/assign?sounds=s,sh&level=start&days=5');
    expect(fromQuery('sounds=s,sh&level=start&days=5')).toEqual(a);
  });

  it('drops unknown sounds and never keeps typed text', () => {
    expect(fromQuery('sounds=s,Maya,<b>,SH&level=end&days=3')).toEqual({
      sounds: ['s', 'sh'],
      level: 'end',
      days: 3,
    });
  });

  it('falls back to the first level and no days on a hand-edited link', () => {
    expect(fromQuery('sounds=z&level=nope&days=99')).toEqual({ sounds: ['z'], level: 'alone', days: null });
  });

  it('gives null when no valid sound is left', () => {
    expect(fromQuery('')).toBeNull();
    expect(fromQuery('sounds=,,x&level=start')).toBeNull();
    expect(toAssignment('s', 'start', 5)).toBeNull();
  });

  it('starts on the first scored sound, or the plan when none can be scored', () => {
    expect(assignmentStartHref(toAssignment(['th', 'ch'], 'phrase', 7)!)).toBe(
      '/practice?sound=ch&level=phrase',
    );
    expect(assignmentStartHref(toAssignment(['r', 'th'], 'start', 3)!)).toBe('/plan');
  });
});
