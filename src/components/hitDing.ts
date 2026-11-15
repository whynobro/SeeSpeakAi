/**
 * The small "ding" played when a try is a hit. It is extra: the badge, color and words still carry the verdict,
 * because many users will not hear it. The tone is made in code with Web Audio. No audio file.
 */

/** Its own key, saved on the device. "Start over" clears every key that starts with "seespeak:". */
const KEY = 'seespeak:ding';

/** Total length of the tone in seconds. Kept under 300 ms. */
const LENGTH = 0.26;
/** Loudest point of the tone, from 0 to 1. Kept quiet. */
const PEAK = 0.12;

/** On unless the learner switched it off. */
export function loadDingOn(): boolean {
  try {
    return window.localStorage.getItem(KEY) !== 'off';
  } catch {
    return true; // Storage blocked: use the default.
  }
}

export function saveDingOn(on: boolean): void {
  try {
    window.localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    // Storage blocked: the choice lasts only for this visit.
  }
}

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (context) return context;
  const Ctor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!Ctor) return null;
  context = new Ctor();
  return context;
}

/**
 * Plays one short, quiet two-note ding if the switch is on. Call it only after the mic has stopped.
 * Never throws: with no Web Audio, or audio blocked, nothing plays.
 */
export function playHitDing(): void {
  try {
    if (typeof window === 'undefined' || !loadDingOn()) return;
    const ctx = audioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});

    const now = ctx.currentTime;
    const tone = ctx.createOscillator();
    const volume = ctx.createGain();
    tone.type = 'sine';
    // Two notes, the second a fifth higher (A5 then E6).
    tone.frequency.setValueAtTime(880, now);
    tone.frequency.setValueAtTime(1318.5, now + 0.09);
    // A quick fade in and a longer fade out, so there is no click.
    volume.gain.setValueAtTime(0.0001, now);
    volume.gain.exponentialRampToValueAtTime(PEAK, now + 0.015);
    volume.gain.exponentialRampToValueAtTime(0.0001, now + LENGTH);
    tone.connect(volume);
    volume.connect(ctx.destination);
    tone.start(now);
    tone.stop(now + LENGTH + 0.02);
    tone.onended = () => {
      tone.disconnect();
      volume.disconnect();
      // Close the player once the ding ends. On iPhone Safari a sound player left running can make the next
      // microphone start hear only silence (the meter stays flat). The next ding makes a new one.
      if (context === ctx) context = null;
      void ctx.close().catch(() => {});
    };
  } catch {
    // Sound is extra. The verdict is already on screen.
  }
}
