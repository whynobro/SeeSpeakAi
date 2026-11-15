import { describe, expect, it } from 'vitest';
import {
  baselineFrom,
  frameShape,
  lipCloseHint,
  lipFrameFromBlendshapes,
  lipHint,
  lipSeparation,
  shapeAgainst,
  summarizeLips,
} from './features';
import type { LipFrame, LipSummary } from './types';

const frame = (rounded: number, spread: number, over: Partial<LipFrame> = {}): LipFrame => ({
  tMs: 0,
  faceSeen: true,
  rounded,
  spread,
  jawOpen: 0.1,
  ...over,
});
const many = (n: number, f: LipFrame): LipFrame[] => Array.from({ length: n }, () => ({ ...f }));

describe('lipFrameFromBlendshapes', () => {
  it('takes the stronger of pucker and funnel for rounded', () => {
    const f = lipFrameFromBlendshapes({ mouthPucker: 0.2, mouthFunnel: 0.6, jawOpen: 0.3 }, 40);
    expect(f).toEqual({ tMs: 40, faceSeen: true, rounded: 0.6, spread: 0, jawOpen: 0.3 });
  });
  it('averages left and right, then takes the stronger of smile and stretch for spread', () => {
    const a = lipFrameFromBlendshapes({ mouthSmileLeft: 0.8, mouthSmileRight: 0.4 }, 0);
    expect(a.spread).toBeCloseTo(0.6);
    const b = lipFrameFromBlendshapes(
      { mouthSmileLeft: 0.1, mouthSmileRight: 0.1, mouthStretchLeft: 0.5, mouthStretchRight: 0.3 },
      0,
    );
    expect(b.spread).toBeCloseTo(0.4);
  });
  it('treats missing names as 0 and clamps out of range numbers', () => {
    const f = lipFrameFromBlendshapes({ mouthPucker: 3, jawOpen: -1, mouthSmileLeft: NaN }, 0);
    expect(f.rounded).toBe(1);
    expect(f.jawOpen).toBe(0);
    expect(f.spread).toBe(0);
  });
});

describe('summarizeLips', () => {
  it('is unknown with fewer than 3 frames', () => {
    const s = summarizeLips(many(2, frame(0.9, 0)));
    expect(s.shape).toBe('unknown');
    expect(s.shapeEnd).toBe('unknown');
  });
  it('is unknown with no frames at all', () => {
    const s = summarizeLips([]);
    expect(s.frames).toBe(0);
    expect(s.faceSeenShare).toBe(0);
    expect(s.shape).toBe('unknown');
  });
  it('is unknown when a face was seen in under half the frames', () => {
    const frames = [...many(2, frame(0.9, 0)), ...many(4, frame(0, 0, { faceSeen: false }))];
    const s = summarizeLips(frames);
    expect(s.faceSeenShare).toBeCloseTo(1 / 3);
    expect(s.shape).toBe('unknown');
  });
  it('calls rounded when rounded clearly wins', () => {
    const s = summarizeLips(many(6, frame(0.6, 0.05)));
    expect(s.shape).toBe('rounded');
    expect(s.rounded).toBeCloseTo(0.6);
  });
  it('calls spread when spread clearly wins', () => {
    expect(summarizeLips(many(6, frame(0.05, 0.5))).shape).toBe('spread');
  });
  it('calls neutral when both are weak', () => {
    expect(summarizeLips(many(6, frame(0.1, 0.05))).shape).toBe('neutral');
  });
  it('calls neutral between the smile and rounded cutoffs', () => {
    expect(summarizeLips(many(6, frame(0.3, 0.57))).shape).toBe('neutral');
  });
  it('does not call a relaxed, slightly smiling mouth rounded', () => {
    expect(summarizeLips(many(6, frame(0.02, 0.15))).shape).toBe('neutral');
  });
  it('reads the real capture (one face): "sss" is spread, the "shh" end is rounded', () => {
    // Numbers from the first real capture, Windows laptop webcam, 2026-11-14.
    expect(summarizeLips(many(6, frame(0.107, 0.449))).shape).toBe('spread');
    expect(summarizeLips(many(6, frame(0.207, 0.408))).shape).toBe('rounded');
  });
  it('averages only frames with a face', () => {
    const frames = [
      ...many(4, frame(0.4, 0.2, { jawOpen: 0.2 })),
      ...many(1, frame(0, 0, { faceSeen: false })),
    ];
    const s = summarizeLips(frames);
    expect(s.rounded).toBeCloseTo(0.4);
    expect(s.jawOpen).toBeCloseTo(0.2);
    expect(s.faceSeenShare).toBeCloseTo(0.8);
  });
  it('reads the last third separately', () => {
    const frames = [...many(12, frame(0, 0.9)), ...many(6, frame(0.7, 0.05))];
    const s = summarizeLips(frames);
    expect(s.shapeEnd).toBe('rounded');
    expect(s.roundedEnd).toBeCloseTo(0.7);
    expect(s.spreadEnd).toBeCloseTo(0.05);
    expect(s.shape).toBe('spread');
  });
  it('has an unknown end when no face was seen in the last third', () => {
    const frames = [...many(6, frame(0.05, 0.6)), ...many(3, frame(0, 0, { faceSeen: false }))];
    const s = summarizeLips(frames);
    expect(s.shapeEnd).toBe('unknown');
    expect(s.shape).toBe('spread');
  });
});

describe('lipHint', () => {
  const summary = (shape: LipSummary['shape']): LipSummary => ({
    frames: 10,
    faceSeenShare: 1,
    rounded: 0,
    spread: 0,
    jawOpen: 0,
    roundedEnd: 0,
    spreadEnd: 0,
    shape,
    shapeEnd: shape,
  });
  it('tells an "s" try with rounded lips to smile', () => {
    expect(lipHint('s', summary('rounded'))).toBe(
      'Your lips were rounded. For "s", smile so your lips pull back.',
    );
  });
  it('tells an "sh" try with spread lips to round them', () => {
    expect(lipHint('sh', summary('spread'))).toContain('For "sh", round your lips');
  });
  it('is null when the lips match', () => {
    expect(lipHint('s', summary('spread'))).toBeNull();
    expect(lipHint('sh', summary('rounded'))).toBeNull();
  });
  it('is null when neutral or unknown', () => {
    expect(lipHint('s', summary('neutral'))).toBeNull();
    expect(lipHint('sh', summary('unknown'))).toBeNull();
  });
  it('never uses an em dash', () => {
    expect(lipHint('s', summary('rounded'))).not.toContain('—');
    expect(lipHint('sh', summary('spread'))).not.toContain('—');
  });
});

describe('frameShape', () => {
  it('gives a live call per frame and unknown without a face', () => {
    expect(frameShape(frame(0.1, 0.5))).toBe('spread');
    expect(frameShape(frame(0.6, 0.1))).toBe('rounded');
    expect(frameShape(frame(0, 0, { faceSeen: false }))).toBe('unknown');
    expect(frameShape(null)).toBe('unknown');
  });
});

describe('own baseline and separation', () => {
  const sum = (rounded: number, spread: number) => summarizeLips(many(8, frame(rounded, spread)));
  it('judges a try against the own smile of the person', () => {
    const smile = sum(0.107, 0.449);
    const base = baselineFrom(smile);
    expect(base.smileLean).toBeCloseTo(-0.342);
    expect(shapeAgainst(sum(0.207, 0.408), base)).toBe('rounded');
    expect(shapeAgainst(smile, base)).toBe('spread');
    expect(shapeAgainst(sum(0.12, 0.4), base)).toBe('neutral');
  });
  it('a smaller-smile person still separates by their own baseline', () => {
    const smile = sum(0.05, 0.25);
    expect(shapeAgainst(sum(0.2, 0.2), baselineFrom(smile))).toBe('rounded');
  });
  it('measures separation as the rise in lean from "s" to "sh"', () => {
    expect(lipSeparation(sum(0.107, 0.449), sum(0.207, 0.408))).toBeCloseTo(0.141, 2);
    expect(lipSeparation(sum(0.2, 0.2), sum(0.2, 0.2))).toBe(0);
  });
  it('is unknown against a baseline when the try itself is unknown', () => {
    expect(shapeAgainst(summarizeLips([]), { smileLean: -0.3 })).toBe('unknown');
  });
});

describe('lipCloseHint', () => {
  const sumShape = (shape: LipSummary['shape']): LipSummary => ({
    ...summarizeLips([]),
    shape,
    shapeEnd: shape,
  });
  it('puts the lip cause first for a close try', () => {
    expect(lipCloseHint('s', sumShape('rounded'))).toContain('nearer "sh"');
    expect(lipCloseHint('sh', sumShape('spread'))).toContain('nearer "s"');
  });
  it('is null when the lips match or are unknown', () => {
    expect(lipCloseHint('s', sumShape('spread'))).toBeNull();
    expect(lipCloseHint('sh', sumShape('unknown'))).toBeNull();
  });
  it('never uses an em dash', () => {
    expect(lipCloseHint('s', sumShape('rounded'))).not.toContain('—');
  });
});
