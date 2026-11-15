'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLipTracker } from '@/hooks/useLipTracker';
import type { LipTrackerState } from '@/hooks/useLipTracker';
import { MIN_FRAMES, summarizeLips } from '@/lib/lips/features';
import type { LipSummary } from '@/lib/lips/types';

/** The learner's choice, saved on this device. Off unless they switched it on. */
const KEY = 'seespeak.lips.camera';

function readSaved(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}
function writeSaved(on: boolean): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    // Storage is blocked: the choice simply is not remembered.
  }
}

export interface LipCameraState {
  /** The learner's switch. */
  enabled: boolean;
  setEnabled(on: boolean): void;
  status: LipTrackerState['status'];
  error: string | null;
  /** The newest camera frame, about 10 times a second. For a live badge. */
  latest: LipTrackerState['latest'];
  /** Attach to the preview `<video>`. It stays mounted even while the camera is off. */
  videoRef: LipTrackerState['videoRef'];
  /** Call when a try starts: the lip numbers will cover this try only. */
  begin(): void;
  /** Call when the try ends: the lip numbers for this try, or null when the camera is off. Never a picture. */
  collect(): LipSummary | null;
}

/**
 * The optional lip camera for the practice screen. Off by default and remembered per device. Pictures stay
 * inside the tracker and the preview: only `LipSummary` numbers come out. If the camera cannot start, `error`
 * says why and practice carries on without it.
 */
export function useLipCamera(): LipCameraState {
  const tracker = useLipTracker();
  const { start, stop, clearFrames, peekFrames } = tracker;
  const [enabled, setEnabledState] = useState(false);

  // The saved choice is read after the first paint. The state is set in a microtask and ignored if the page left.
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active || !readSaved()) return;
      setEnabledState(true);
      void start();
    });
    return () => {
      active = false;
    };
  }, [start]);

  const setEnabled = useCallback(
    (on: boolean) => {
      setEnabledState(on);
      writeSaved(on);
      if (on) void start();
      else stop();
    },
    [start, stop],
  );

  const begin = useCallback(() => clearFrames(), [clearFrames]);

  const collect = useCallback((): LipSummary | null => {
    if (tracker.status !== 'watching') return null;
    const frames = peekFrames();
    return frames.length >= MIN_FRAMES ? summarizeLips(frames) : null;
  }, [tracker.status, peekFrames]);

  return {
    enabled,
    setEnabled,
    status: tracker.status,
    error: tracker.error,
    latest: tracker.latest,
    videoRef: tracker.videoRef,
    begin,
    collect,
  };
}
