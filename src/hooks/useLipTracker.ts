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
  start(): Promise<void>;
  /** Stops the camera and returns every frame collected since `start`. */
  stop(): LipFrame[];
}

/** About 10 state updates per second. */
const UI_INTERVAL_MS = 100;

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

  const start = useCallback(async () => {
    if (trackerRef.current) return;
    const video = videoRef.current;
    if (!video) {
      setError('The camera preview is not ready.');
      setStatus('error');
      return;
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
        if (frame.tMs - lastUiRef.current >= UI_INTERVAL_MS) {
          lastUiRef.current = frame.tMs;
          setLatest(frame);
        }
      });
      if (run !== runRef.current) {
        tracker.stop();
        return;
      }
      trackerRef.current = tracker;
      setStatus('watching');
    } catch (err) {
      if (run !== runRef.current) return;
      setError(err instanceof Error ? err.message : 'The camera could not be started.');
      setStatus('error');
    }
  }, []);

  const stop = useCallback((): LipFrame[] => {
    runRef.current++;
    trackerRef.current?.stop();
    trackerRef.current = null;
    setStatus((s) => (s === 'error' ? s : 'idle'));
    return framesRef.current;
  }, []);

  useEffect(
    () => () => {
      runRef.current++;
      trackerRef.current?.stop();
      trackerRef.current = null;
    },
    [],
  );

  return { status, error, latest, videoRef, start, stop };
}
