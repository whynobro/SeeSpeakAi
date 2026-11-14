import { magnitudeSpectrum } from '@/lib/audio/fft';
import type { FrameFeatures } from '@/lib/types';

/** Frame size used everywhere (samples). At 48 kHz one frame is about 21 ms. */
export const FFT_SIZE = 1024;

/** Energy above this frequency counts as "hiss". Vowels keep most of their energy below it. */
const HISS_FROM_HZ = 2000;
/** The centroid is measured inside this band: low enough to include "sh", high enough to include "s". */
const CENTROID_LOW_HZ = 1500;
const CENTROID_HIGH_HZ = 10000;
/**
 * If the centroid band holds less energy than this (sum of squared magnitudes, amplitude units),
 * there is no hiss to measure and the centroid is null. About amplitude 0.0003: below mic noise.
 */
const CENTROID_MIN_ENERGY = 1e-7;

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/**
 * Turn one magnitude spectrum into the numbers scoring needs.
 * `magnitudes` is linear (not dB), length fftSize / 2, bin i covers i * sampleRate / fftSize Hz.
 * Works the same on a browser AnalyserNode spectrum and on our own FFT, so tests and the live app agree.
 * Loudness is the square root of the summed energy, so a sine of amplitude A reads about A.
 */
export function featuresFromSpectrum(
  magnitudes: Float32Array,
  sampleRate: number,
  tMs: number,
): FrameFeatures {
  const bins = magnitudes.length;
  const binHz = sampleRate / (bins * 2);
  const nyquist = sampleRate / 2;
  const centroidHigh = Math.min(CENTROID_HIGH_HZ, nyquist);

  let total = 0;
  let hiss = 0;
  let bandEnergy = 0;
  let bandWeighted = 0;
  // Bin 0 is DC (a steady offset, not sound), so skip it.
  for (let k = 1; k < bins; k++) {
    const hz = k * binHz;
    const energy = magnitudes[k] * magnitudes[k];
    total += energy;
    if (hz >= HISS_FROM_HZ) hiss += energy;
    if (hz >= CENTROID_LOW_HZ && hz <= centroidHigh) {
      bandEnergy += energy;
      bandWeighted += energy * hz;
    }
  }

  const centroidHz = bandEnergy > CENTROID_MIN_ENERGY ? Math.min(nyquist, bandWeighted / bandEnergy) : null;
  return {
    tMs,
    level: clamp01(Math.sqrt(total)),
    hissLevel: clamp01(Math.sqrt(hiss)),
    hissRatio: total > 0 ? clamp01(hiss / total) : 0,
    centroidHz,
  };
}

/**
 * One frame of raw samples (length FFT_SIZE, values -1 to 1) to features: window, FFT, then
 * `featuresFromSpectrum`. The live mic and the tests both go through this, so they agree.
 */
export function featuresFromFrame(frame: Float32Array, sampleRate: number, tMs: number): FrameFeatures {
  return featuresFromSpectrum(magnitudeSpectrum(frame), sampleRate, tMs);
}

/** Cut raw samples into frames and run `featuresFromFrame` on each. Used by tests and uploaded clips. */
export function featuresFromSamples(samples: Float32Array, sampleRate: number): FrameFeatures[] {
  const hop = FFT_SIZE / 2; // 50% overlap
  const out: FrameFeatures[] = [];
  if (samples.length === 0) return out;
  if (samples.length < FFT_SIZE) {
    // Too short for one frame: pad with silence so the caller still gets a reading.
    const padded = new Float32Array(FFT_SIZE);
    padded.set(samples);
    return [featuresFromFrame(padded, sampleRate, 0)];
  }
  for (let start = 0; start + FFT_SIZE <= samples.length; start += hop) {
    const frame = samples.subarray(start, start + FFT_SIZE);
    out.push(featuresFromFrame(frame, sampleRate, (start / sampleRate) * 1000));
  }
  return out;
}
