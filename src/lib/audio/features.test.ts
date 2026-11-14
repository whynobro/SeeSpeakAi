import { describe, expect, it } from 'vitest';
import { FFT_SIZE, featuresFromFrame, featuresFromSamples } from '@/lib/audio/features';
import { magnitudeSpectrum } from '@/lib/audio/fft';
import { hiss, silence } from '@/lib/scoring/synth';

function sine(hz: number, sampleRate: number, amp = 0.5): Float32Array {
  const out = new Float32Array(FFT_SIZE);
  for (let i = 0; i < FFT_SIZE; i++) out[i] = amp * Math.sin((2 * Math.PI * hz * i) / sampleRate);
  return out;
}

function middleFrame(x: Float32Array): Float32Array {
  const start = Math.floor((x.length - FFT_SIZE) / 2);
  return x.subarray(start, start + FFT_SIZE);
}

describe.each([44100, 48000])('features at %i Hz', (sr) => {
  it('a 1 kHz sine has low hissRatio and peaks at the 1 kHz bin', () => {
    const frame = sine(1000, sr);
    const spectrum = magnitudeSpectrum(frame);
    expect(spectrum.length).toBe(FFT_SIZE / 2);
    let peak = 0;
    for (let k = 1; k < spectrum.length; k++) if (spectrum[k] > spectrum[peak]) peak = k;
    const expectedBin = Math.round((1000 * FFT_SIZE) / sr);
    expect(Math.abs(peak - expectedBin)).toBeLessThanOrEqual(1);
    expect(spectrum[peak]).toBeGreaterThan(0.4);
    const f = featuresFromFrame(frame, sr, 0);
    expect(f.hissRatio).toBeLessThan(0.05);
  });

  it('an "s" hiss has a centroid well above an "sh" hiss', () => {
    const s = featuresFromFrame(middleFrame(hiss('s', 200, sr)), sr, 0);
    const sh = featuresFromFrame(middleFrame(hiss('sh', 200, sr)), sr, 0);
    expect(s.centroidHz).not.toBeNull();
    expect(sh.centroidHz).not.toBeNull();
    expect((s.centroidHz ?? 0) - (sh.centroidHz ?? 0)).toBeGreaterThan(1500);
    expect(s.hissRatio).toBeGreaterThan(0.8);
    expect(sh.hissRatio).toBeGreaterThan(0.8);
  });

  it('silence has a null centroid and zero level', () => {
    const f = featuresFromFrame(new Float32Array(FFT_SIZE), sr, 0);
    expect(f.centroidHz).toBeNull();
    expect(f.level).toBe(0);
    expect(f.hissRatio).toBe(0);
  });

  it('featuresFromSamples hops by half a frame and stamps time from the frame start', () => {
    const frames = featuresFromSamples(silence(200, sr), sr);
    expect(frames.length).toBeGreaterThan(5);
    expect(frames[0].tMs).toBe(0);
    expect(frames[1].tMs).toBeCloseTo((FFT_SIZE / 2 / sr) * 1000, 5);
  });
});

describe('featuresFromSamples edge cases', () => {
  it('returns nothing for no samples and one padded frame for a very short clip', () => {
    expect(featuresFromSamples(new Float32Array(0), 48000)).toEqual([]);
    expect(featuresFromSamples(new Float32Array(100), 48000)).toHaveLength(1);
  });
});
