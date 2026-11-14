import type { FrameFeatures } from '@/lib/types';

/**
 * The frames of the most recent recording, kept in memory only (never saved, never sent as audio), so the
 * feedback hook can summarize the shape of the sound without every screen passing the frames along.
 * Safe to import on the server: it only holds two variables.
 */
let frames: FrameFeatures[] = [];
let rate: number | null = null;

export function setLastRecording(next: FrameFeatures[], sampleRate: number | null): void {
  frames = next;
  rate = sampleRate;
}

export function getLastRecording(): { frames: FrameFeatures[]; sampleRate: number | null } {
  return { frames, sampleRate: rate };
}
