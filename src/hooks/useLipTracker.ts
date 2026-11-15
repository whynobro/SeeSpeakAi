'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { startLipTracker } from '@/lib/lips/tracker';
import type { LipTracker } from '@/lib/lips/tracker';
import type { LipFrame } from '@/lib/lips/types';

export type LipTrackerStatus = 'idle' | 'starting' | 'watching' | 'error';

export interface LipTrackerState {
  status: LipTrackerStatus;
  error: string | null;
  latest: LipFrame | null;
  /** Attach to a `<video>` element. It must be mounted before `start` is called. */
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Resolves true once the camera is watching, false when it could not start (see `error`). */
  start(): Promise<boolean>;
  /** Stops the camera and returns every frame collected since `start`. */
  stop(): LipFrame[];
  /** Forgets the frames so far. Call when a try starts, so the next `peekFrames` covers that try only. */
  clearFrames(): void;
  /** The frames since `start` or the last `clearFrames`, without stopping the camera. */
  peekFrames(): LipFrame[];
}

/** About 10 state updates per second. */
const UI_INTERVAL_MS = 100;
/** Oldest frames are dropped past this many (about 3 minutes), so a camera left on cannot grow forever. */
const MAX_FRAMES = 3000;

export function useLipTracker(): LipTrackerState {
  const [status, setStatus] = useState<LipTrackerStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [latest, setLatest] = useState<LipFrame | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const trackerRef = useRef<LipTracker | null>(null);
  const framesRef = useRef<LipFrame[]>([]);
  const lastUiRef = useRef(0);
  // Bumped on every start and stop, so a slow start that finishes after a stop is shut down again.
  const runRef = useRef(0);

  const start = useCallback(async (): Promise<boolean> => {
    if (trackerRef.current) return true;
    const video = videoRef.current;
    if (!video) {
      setError('The camera preview is not ready.');
      setStatus('error');
      return false;
    }
    const run = ++runRef.current;
    framesRef.current = [];
    lastUiRef.current = 0;
    setError(null);
    setLatest(null);
    setStatus('starting');
    try {
      const tracker = await startLipTracker(video, (frame) => {
        if (run !== runRef.current) return;
        framesRef.current.push(frame);
        if (framesRef.current.length > MAX_FRAMES) framesRef.current.shift();
        if (frame.tMs - lastUiRef.current >= UI_INTERVAL_MS) {
          lastUiRef.current = frame.tMs;
          setLatest(frame);
        }
      });
      if (run !== runRef.current) {
        tracker.stop();
        return false;
      }
      trackerRef.current = tracker;
      setStatus('watching');
      return true;
    } catch (err) {
      if (run !== runRef.current) return false;
      setError(err instanceof Error ? err.message : 'The camera could not be started.');
      setStatus('error');
      return false;
    }
  }, []);

  const stop = useCallback((): LipFrame[] => {
    runRef.current++;
    trackerRef.current?.stop();
    trackerRef.current = null;
    setStatus((s) => (s === 'error' ? s : 'idle'));
    return framesRef.current;
  }, []);

  const clearFrames = useCallback(() => {
    framesRef.current = [];
  }, []);
  const peekFrames = useCallback((): LipFrame[] => [...framesRef.current], []);

  useEffect(
    () => () => {
      runRef.current++;
      trackerRef.current?.stop();
      trackerRef.current = null;
    },
    [],
  );

  return { status, error, latest, videoRef, start, stop, clearFrames, peekFrames };
}
