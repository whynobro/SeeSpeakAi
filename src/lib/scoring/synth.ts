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

/**
 * The noise that follows a stop sound ("t" or "k") when it is released with a puff of air, as in an
 * aspirated "cat" or "duck". It starts with a sharp, loud burst and then fades away, so it is loudest
 * at the start. That fading shape is what tells it apart from a real "s", which holds a steady level.
 *  - 't' flavour: energy mostly above 4 kHz (alveolar, close to an "s").
 *  - 'k' flavour: energy around 2 to 4 kHz (velar, close to an "sh").
 * `decayRate` is how many fade time constants fit in the length: 3 fades to about 5 percent by the end,
 * a smaller number gives a flatter, longer-lasting release (a harder case for scoring).
 */
export function stopRelease(flavour: 't' | 'k', ms: number, sampleRate: number, decayRate = 3): Float32Array {
  const n = samplesFor(ms, sampleRate);
  const high = Math.min(8000, sampleRate / 2 - 100);
  const noise =
    flavour === 't' ? bandNoise(n, sampleRate, 4000, high, 41) : bandNoise(n, sampleRate, 2000, 4000, 53);
  const tau = Math.max(1, n / decayRate);
  const spike = samplesFor(5, sampleRate); // the sharp onset: twice as loud for the first 5 ms
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = noise[i] * Math.exp(-i / tau) * (i < spike ? 2 : 1);
  // Scale so the first 20 ms (the loud part) is about 0.3 of the vowel loudness, with no fade in.
  const head = out.subarray(0, Math.min(n, samplesFor(20, sampleRate)));
  const gain = rms(head) > 0 ? (VOWEL_RMS * 0.3) / rms(head) : 0;
  const fade = Math.min(Math.floor(n / 2), samplesFor(FADE_MS, sampleRate));
  for (let i = 0; i < n; i++) {
    let g = gain;
    if (i >= n - fade) g *= (n - 1 - i) / fade;
    out[i] *= g;
  }
  return out;
}

/** A hiss that starts as one sound and ends as the other: `first` for half the time, then `second`. */
export function hissSlide(
  first: 's' | 'sh',
  second: 's' | 'sh',
  ms: number,
  sampleRate: number,
): Float32Array {
  return concat(hiss(first, ms / 2, sampleRate), hiss(second, ms / 2, sampleRate));
}

/** How strong the buzz of a voiced hiss is next to the hiss itself (loudness ratio). */
const VOICED_BUZZ_TO_HISS = 0.5;
/** Length of the stop burst at the start of an affricate ("ch"), in ms. */
export const AFFRICATE_BURST_MS = 25;

/**
 * A voiced "s", the "z" of "zoo" or "dogs": the same 4 to 8 kHz hiss as `hiss('s', ...)`, with the buzz of
 * the voice (150 Hz and its first two harmonics) on top the whole way through. The buzz is half the
 * loudness of the hiss, so most of the energy is still the hiss.
 */
export function voicedHiss(ms: number, sampleRate: number): Float32Array {
  const n = samplesFor(ms, sampleRate);
  const hissPart = hiss('s', ms, sampleRate); // already scaled and faded
  const buzz = new Float32Array(n);
  const f0 = 150;
  for (let k = 1; k <= 3; k++) {
    for (let i = 0; i < n; i++) buzz[i] += (1 / k) * Math.sin((2 * Math.PI * f0 * k * i) / sampleRate);
  }
  const fade = Math.min(Math.floor(n / 2), samplesFor(FADE_MS, sampleRate));
  const buzzGain = rms(buzz) > 0 ? (VOICED_BUZZ_TO_HISS * VOWEL_RMS * HISS_TO_VOWEL) / rms(buzz) : 0;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let g = buzzGain;
    if (i < fade) g *= i / fade;
    else if (i >= n - fade) g *= (n - 1 - i) / fade;
    out[i] = hissPart[i] + buzz[i] * g;
  }
  return out;
}

/**
 * An affricate, the "ch" of "chip" or "watch": a stop burst (like `burst`, `AFFRICATE_BURST_MS` long) that
 * runs straight into a "sh" hiss. `ms` is the whole length, so the "sh" part is `ms` minus the burst.
 * The burst and the hiss overlap by one fade length, so there is no dip between them.
 */
export function affricate(ms: number, sampleRate: number): Float32Array {
  const click = burst(AFFRICATE_BURST_MS, sampleRate);
  const shPart = hiss('sh', Math.max(0, ms - AFFRICATE_BURST_MS + FADE_MS), sampleRate);
  const out = new Float32Array(
    Math.max(click.length, click.length + shPart.length - samplesFor(FADE_MS, sampleRate)),
  );
  const start = Math.max(0, click.length - samplesFor(FADE_MS, sampleRate));
  for (let i = 0; i < click.length; i++) out[i] += click[i];
  for (let i = 0; i < shPart.length && start + i < out.length; i++) out[start + i] += shPart[i];
  return out;
}
