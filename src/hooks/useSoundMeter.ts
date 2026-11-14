'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { startMic } from '@/lib/audio/mic';
import type { MicHandle } from '@/lib/audio/mic';
import { readFrame } from '@/lib/scoring';
import type { FrameFeatures, SoundReading } from '@/lib/types';

export type MeterStatus = 'idle' | 'starting' | 'listening' | 'error';

export interface SoundMeterState {
  status: MeterStatus;
  error: string | null;
  reading: SoundReading | null;
  latest: FrameFeatures | null;
  sampleRate: number | null;
  start(): Promise<void>;
  /** Stops the mic and returns every frame collected since `start`. */
  stop(): FrameFeatures[];
}

/** About 20 state updates per second, so React is not flooded by 50 frames per second. */
const UI_INTERVAL_MS = 50;

export function useSoundMeter(): SoundMeterState {
  const [status, setStatus] = useState<MeterStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<SoundReading | null>(null);
  const [latest, setLatest] = useState<FrameFeatures | null>(null);
  const [sampleRate, setSampleRate] = useState<number | null>(null);

  const micRef = useRef<MicHandle | null>(null);
  const framesRef = useRef<FrameFeatures[]>([]);
  const lastUiRef = useRef(0);
  // Bumped on every start and stop, so a slow start that finishes after a stop is shut down again.
  const runRef = useRef(0);

  const start = useCallback(async () => {
    if (micRef.current) return;
    const run = ++runRef.current;
    framesRef.current = [];
    lastUiRef.current = 0;
    setError(null);
    setReading(null);
    setLatest(null);
    setStatus('starting');
    try {
      const mic = await startMic((frame) => {
        if (run !== runRef.current) return;
        framesRef.current.push(frame);
        if (frame.tMs - lastUiRef.current >= UI_INTERVAL_MS) {
          lastUiRef.current = frame.tMs;
          setLatest(frame);
          setReading(readFrame(frame));
        }
      });
      if (run !== runRef.current) {
        mic.stop();
        return;
      }
      micRef.current = mic;
      setSampleRate(mic.sampleRate);
      setStatus('listening');
    } catch (err) {
      if (run !== runRef.current) return;
      setError(err instanceof Error ? err.message : 'The microphone could not be started.');
      setStatus('error');
    }
  }, []);

  const stop = useCallback((): FrameFeatures[] => {
    runRef.current++;
    micRef.current?.stop();
    micRef.current = null;
    setStatus((s) => (s === 'error' ? s : 'idle'));
    setReading(null);
    return framesRef.current;
  }, []);

  useEffect(
    () => () => {
      runRef.current++;
      micRef.current?.stop();
      micRef.current = null;
    },
    [],
  );

  return { status, error, reading, latest, sampleRate, start, stop };
}
