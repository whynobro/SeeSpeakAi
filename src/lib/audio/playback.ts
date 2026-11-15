import { hiss, vowel } from '@/lib/scoring/synth';

/*
 * Sounds for the listening check. Browser only.
 * The "s", "sh" and "ah" sounds are made on the device (band-limited noise and a vowel-like tone), all at the
 * same loudness, so the learner's own volume setting decides how loud they are. Words use the browser's
 * built-in voice for now; real recorded voices should replace it (content lane).
 * A phone or laptop speaker is not calibrated: these sounds never measure hearing in decibels.
 */

/** Same loudness (RMS) for every made sound, so none is easier to hear just because it is louder. */
const PLAY_RMS = 0.12;
const FADE_MS = 20;

let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') return null;
  if (context === null) context = new AudioContext();
  return context;
}

function levelAndFade(x: Float32Array, sampleRate: number): Float32Array<ArrayBuffer> {
  let sum = 0;
  for (let i = 0; i < x.length; i++) sum += x[i] * x[i];
  const rms = Math.sqrt(sum / Math.max(1, x.length));
  const gain = rms > 0 ? PLAY_RMS / rms : 0;
  const fade = Math.floor((FADE_MS / 1000) * sampleRate);
  const out = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) {
    const edge = Math.min(1, i / fade, (x.length - 1 - i) / fade);
    out[i] = Math.max(-1, Math.min(1, x[i] * gain * edge));
  }
  return out;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Play "s", "sh" or "ah" for `ms` milliseconds. `null` plays nothing for the same time (a silent trial).
 * Resolves when the sound has finished.
 */
export async function playCheckSound(kind: 's' | 'sh' | 'ah' | null, ms = 700): Promise<void> {
  const ctx = audioContext();
  if (kind === null || ctx === null) {
    await wait(ms);
    return;
  }
  // A browser can keep audio paused until a tap: never wait for it forever.
  if (ctx.state === 'suspended') await Promise.race([ctx.resume().catch(() => undefined), wait(300)]);
  const raw = kind === 'ah' ? vowel(ms, ctx.sampleRate) : hiss(kind, ms, ctx.sampleRate);
  const samples = levelAndFade(raw, ctx.sampleRate);
  const buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
  buffer.copyToChannel(samples, 0);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  const ended = new Promise<void>((resolve) => {
    source.onended = () => resolve();
  });
  source.start();
  // onended does not fire while the audio is paused, so the trial still moves on after the sound's length.
  await Promise.race([ended, wait(ms + 300)]);
}

/**
 * Call from a tap (a click handler), before any sound plays later on a timer. Browsers only let audio
 * start after the person has tapped, and only in the tap itself.
 */
export function unlockAudio(): void {
  const ctx = audioContext();
  if (ctx && ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
}

/** True when this browser can say words out loud. */
export function canSpeakWords(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Say one word with the built-in voice. Resolves when it is done, or after 4 seconds at most. */
export function speakWord(word: string): Promise<void> {
  if (!canSpeakWords()) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const done = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(done, 4000);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    utterance.onend = done;
    utterance.onerror = done;
    window.speechSynthesis.speak(utterance);
  });
}
