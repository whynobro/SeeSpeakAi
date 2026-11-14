import { afterEach, describe, expect, it, vi } from 'vitest';
import { buzz, canVibrate, giveFeedback } from '@/lib/feedback';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('giveFeedback without a vibration API', () => {
  it('navigator absent: nothing vibrates, the pulse is still reported', () => {
    vi.stubGlobal('navigator', undefined);
    expect(canVibrate()).toBe(false);
    expect(giveFeedback('hit')).toEqual({ vibrated: false, pattern: [200], pulse: 'long' });
    expect(giveFeedback('close')).toEqual({ vibrated: false, pattern: [60, 80, 60], pulse: 'double' });
    expect(giveFeedback('miss')).toEqual({ vibrated: false, pattern: [], pulse: 'none' });
    expect(buzz('hit')).toBe(false);
  });

  it('navigator without vibrate (iPhone): same', () => {
    vi.stubGlobal('navigator', {});
    expect(giveFeedback('hit').vibrated).toBe(false);
  });
});

describe('giveFeedback with navigator.vibrate', () => {
  it('hit: one long pulse, vibrated when accepted', () => {
    const vibrate = vi.fn(() => true);
    vi.stubGlobal('navigator', { vibrate });
    expect(giveFeedback('hit')).toEqual({ vibrated: true, pattern: [200], pulse: 'long' });
    expect(vibrate).toHaveBeenCalledWith([200]);
  });

  it('close: two short pulses', () => {
    const vibrate = vi.fn(() => true);
    vi.stubGlobal('navigator', { vibrate });
    expect(giveFeedback('close')).toEqual({ vibrated: true, pattern: [60, 80, 60], pulse: 'double' });
    expect(vibrate).toHaveBeenCalledWith([60, 80, 60]);
  });

  it('miss: no vibration call at all', () => {
    const vibrate = vi.fn(() => true);
    vi.stubGlobal('navigator', { vibrate });
    expect(giveFeedback('miss')).toEqual({ vibrated: false, pattern: [], pulse: 'none' });
    expect(vibrate).not.toHaveBeenCalled();
  });

  it('device refuses (returns false): vibrated is false', () => {
    vi.stubGlobal('navigator', { vibrate: vi.fn(() => false) });
    expect(giveFeedback('hit').vibrated).toBe(false);
  });

  it('device throws: vibrated is false, no crash', () => {
    vi.stubGlobal('navigator', {
      vibrate: () => {
        throw new Error('blocked');
      },
    });
    expect(giveFeedback('hit').vibrated).toBe(false);
  });
});
