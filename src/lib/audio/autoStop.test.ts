import { describe, expect, it } from 'vitest';
import { AUTO_STOP_MAX_MS, autoStopReason, heardNothing, type LevelPoint } from './autoStop';

/** Readings every 50 ms from a list of levels. */
const series = (levels: number[]): LevelPoint[] => levels.map((level, i) => ({ tMs: i * 50, level }));
const repeat = (level: number, n: number) => Array<number>(n).fill(level);

describe('autoStopReason', () => {
  it('keeps listening on an empty list', () => {
    expect(autoStopReason([])).toBeNull();
  });

  it('keeps listening while the person is still talking', () => {
    expect(autoStopReason(series([...repeat(0.001, 5), ...repeat(0.2, 20)]))).toBeNull();
  });

  it('stops after sound then one second of quiet', () => {
    const pts = series([...repeat(0.001, 4), ...repeat(0.2, 10), ...repeat(0.005, 21)]);
    expect(autoStopReason(pts)).toBe('quiet');
  });

  it('does not stop on a short pause', () => {
    const pts = series([...repeat(0.2, 10), ...repeat(0.005, 10), ...repeat(0.2, 3)]);
    expect(autoStopReason(pts)).toBeNull();
  });

  it('judges quiet relative to the loudest frame, so a quiet mic still works', () => {
    // The peak is only 0.01, so 0.001 is quiet.
    const pts = series([...repeat(0.01, 10), ...repeat(0.001, 21)]);
    expect(autoStopReason(pts)).toBe('quiet');
  });

  it('does not stop on quiet alone when nothing was said, until time runs out', () => {
    expect(autoStopReason(series(repeat(0.0005, 40)))).toBeNull();
    expect(autoStopReason(series(repeat(0.0005, AUTO_STOP_MAX_MS / 50 + 1)))).toBe('max-time');
  });

  it('stops at the maximum time even while sound continues', () => {
    expect(autoStopReason(series(repeat(0.2, AUTO_STOP_MAX_MS / 50 + 1)))).toBe('max-time');
  });
});

describe('heardNothing', () => {
  it('is true for mic noise only, false when there was sound', () => {
    expect(heardNothing(series(repeat(0.001, 10)))).toBe(true);
    expect(heardNothing(series([0.001, 0.2, 0.001]))).toBe(false);
  });
});
