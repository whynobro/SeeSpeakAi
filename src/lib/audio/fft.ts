/**
 * A small radix-2 FFT with no dependencies. Used by the scoring features and by the test signal
 * generators, so the tests and the live app share one implementation.
 */

/** True when n is a power of two (1, 2, 4, 8, ...). */
function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

/**
 * In-place forward FFT on separate real and imaginary arrays. Length must be a power of two.
 * To get an inverse FFT, swap `re` and `im` on the way in and out, then divide by the length.
 */
export function fftInPlace(re: Float32Array | Float64Array, im: Float32Array | Float64Array): void {
  const n = re.length;
  if (!isPowerOfTwo(n) || im.length !== n) {
    throw new Error('FFT length must be a power of two and re/im must be the same length.');
  }
  // Put the samples in bit-reversed order.
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i];
      re[i] = re[j];
      re[j] = tr;
      const ti = im[i];
      im[i] = im[j];
      im[j] = ti;
    }
  }
  // Combine pairs, then groups of 4, 8, ... samples.
  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len;
    const wRe = Math.cos(angle);
    const wIm = Math.sin(angle);
    const half = len >> 1;
    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;
      for (let k = 0; k < half; k++) {
        const a = i + k;
        const b = a + half;
        const tRe = re[b] * curRe - im[b] * curIm;
        const tIm = re[b] * curIm + im[b] * curRe;
        re[b] = re[a] - tRe;
        im[b] = im[a] - tIm;
        re[a] += tRe;
        im[a] += tIm;
        const nextRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nextRe;
      }
    }
  }
}

/**
 * Hann-window the frame, run the FFT and return linear magnitudes, length `frame.length / 2`.
 * Scaled so a pure sine of amplitude A gives a peak bin of about A (the window and FFT gains are
 * divided out). Bin i covers i * sampleRate / frame.length Hz.
 */
export function magnitudeSpectrum(frame: Float32Array): Float32Array {
  const n = frame.length;
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n);
    re[i] = frame[i] * window;
  }
  fftInPlace(re, im);
  const half = n / 2;
  const out = new Float32Array(half);
  const scale = 4 / n; // the Hann window averages 0.5, and a real sine splits into two bins
  for (let k = 0; k < half; k++) {
    out[k] = Math.hypot(re[k], im[k]) * scale;
  }
  return out;
}
