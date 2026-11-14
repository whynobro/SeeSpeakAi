import { fftInPlace } from '@/lib/audio/fft';

/**
 * Deterministic test signal generators. No Math.random: the same call always gives the same samples.
 * Used by the unit tests and later by a debug page.
 */

/** RMS loudness of every generated vowel. */
export const VOWEL_RMS = 0.08;
/** Hisses are quieter than vowels in real speech: about 0.2 of the vowel loudness. */
export const HISS_TO_VOWEL = 0.2;
/** RMS loudness of the /t/ release click. */
const BURST_RMS = 0.08;
/** Length of the fade in and out on each sound, so joins do not click. */
const FADE_MS = 10;

/** Small seeded random number generator (mulberry32). Returns numbers in 0 to 1. */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function samplesFor(ms: number, sampleRate: number): number {
  return Math.max(0, Math.round((ms / 1000) * sampleRate));
}

function rms(x: Float32Array): number {
  if (x.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < x.length; i++) sum += x[i] * x[i];
  return Math.sqrt(sum / x.length);
}

/** Scale to the wanted RMS, then fade the edges. */
function finish(x: Float32Array, targetRms: number, sampleRate: number): Float32Array {
  const current = rms(x);
  const gain = current > 0 ? targetRms / current : 0;
  const fade = Math.min(Math.floor(x.length / 2), samplesFor(FADE_MS, sampleRate));
  for (let i = 0; i < x.length; i++) {
    let g = gain;
    if (i < fade) g *= i / fade;
    else if (i >= x.length - fade) g *= (x.length - 1 - i) / fade;
    x[i] *= g;
  }
  return x;
}

/** A vowel: a 150 Hz tone with harmonics up to about 1.2 kHz. Nearly all its energy is below 1.5 kHz. */
export function vowel(ms: number, sampleRate: number): Float32Array {
  const n = samplesFor(ms, sampleRate);
  const out = new Float32Array(n);
  const f0 = 150;
  for (let k = 1; k <= 8; k++) {
    const amp = 1 / k;
    for (let i = 0; i < n; i++) out[i] += amp * Math.sin((2 * Math.PI * f0 * k * i) / sampleRate);
  }
  return finish(out, VOWEL_RMS, sampleRate);
}

/** White noise with only the bins between lowHz and highHz kept (FFT-domain band-pass). */
function bandNoise(n: number, sampleRate: number, lowHz: number, highHz: number, seed: number): Float32Array {
  let size = 1;
  while (size < Math.max(n, 2)) size <<= 1;
  const rng = makeRng(seed);
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  for (let i = 0; i < size; i++) re[i] = rng() * 2 - 1;
  fftInPlace(re, im);
  for (let k = 0; k <= size / 2; k++) {
    const hz = (k * sampleRate) / size;
    if (hz < lowHz || hz > highHz) {
      re[k] = 0;
      im[k] = 0;
      if (k > 0 && k < size / 2) {
        re[size - k] = 0;
        im[size - k] = 0;
      }
    }
  }
  // Inverse FFT by swapping real and imaginary parts.
  fftInPlace(im, re);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = re[i] / size;
  return out;
}

/** A hiss: "s" is noise from 4 to 8 kHz, "sh" is noise from 2 to 4 kHz. About 0.2 of the vowel loudness. */
export function hiss(kind: 's' | 'sh', ms: number, sampleRate: number): Float32Array {
  const n = samplesFor(ms, sampleRate);
  const high = Math.min(8000, sampleRate / 2 - 100);
  const noise =
    kind === 's' ? bandNoise(n, sampleRate, 4000, high, 11) : bandNoise(n, sampleRate, 2000, 4000, 23);
  return finish(noise, VOWEL_RMS * HISS_TO_VOWEL, sampleRate);
}

/** A short broadband click, like the release of a /t/ at the end of "cat". Default length 30 ms. */
export function burst(ms: number, sampleRate: number): Float32Array {
  const n = samplesFor(ms, sampleRate);
  const rng = makeRng(37);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const decay = Math.exp((-4 * i) / Math.max(1, n)); // loudest at the start, then dies away
    out[i] = (rng() * 2 - 1) * decay;
  }
  return finish(out, BURST_RMS, sampleRate);
}

/** Digital silence. */
export function silence(ms: number, sampleRate: number): Float32Array {
  return new Float32Array(samplesFor(ms, sampleRate));
}

/** Join sounds end to end. */
export function concat(...parts: Float32Array[]): Float32Array {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Float32Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** Multiply every sample by `gain` (returns a new array). */
export function scale(x: Float32Array, gain: number): Float32Array {
  const out = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) out[i] = x[i] * gain;
  return out;
}
