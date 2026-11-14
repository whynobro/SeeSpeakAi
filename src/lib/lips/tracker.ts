import type { FaceLandmarker } from '@mediapipe/tasks-vision';
import { lipFrameFromBlendshapes } from './features';
import type { LipFrame } from './types';

/*
 * Browser only. Camera pictures stay inside this file's loop: only LipFrame numbers go out.
 * The type import above is erased at build time, so MediaPipe is not in the main bundle.
 */

/**
 * The wasm files, from the public jsDelivr CDN. The version is pinned to the installed
 * `@mediapipe/tasks-vision` (1.2.3): update both together.
 */
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm';
/** The face_landmarker model, from Google's public model storage. */
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

/** About 15 checks a second. */
const MIN_GAP_MS = 1000 / 15;

export interface LipTracker {
  stop(): void;
}

function cameraError(err: unknown): Error {
  const name = err instanceof DOMException ? err.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return new Error(
      'The camera is blocked. Allow the camera for this site in the browser settings, then try again.',
    );
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return new Error('No camera was found on this device.');
  }
  if (name === 'NotReadableError') {
    return new Error('The camera is busy. Close other apps that use it, then try again.');
  }
  return new Error('The camera could not be started.');
}

export async function startLipTracker(
  video: HTMLVideoElement,
  onFrame: (f: LipFrame) => void,
): Promise<LipTracker> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error(
      'This browser cannot use the camera here. The camera needs a secure page (HTTPS or localhost).',
    );
  }
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
  } catch (err) {
    throw cameraError(err);
  }
  const stopTracks = () => stream.getTracks().forEach((t) => t.stop());

  // Loaded here, not at the top, so it stays out of the main bundle and never runs on the server.
  let landmarker: FaceLandmarker;
  try {
    const { FaceLandmarker: Landmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
    const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
    landmarker = await Landmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL },
      runningMode: 'VIDEO',
      numFaces: 1,
      outputFaceBlendshapes: true,
    });
  } catch {
    stopTracks();
    throw new Error('The lip check could not load. Check the internet connection and try again.');
  }

  try {
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    await video.play();
  } catch {
    landmarker.close();
    stopTracks();
    video.srcObject = null;
    throw new Error('The camera picture could not be shown.');
  }

  let stopped = false;
  let lastRun = -Infinity;
  let lastVideoTime = -1;
  let timer: ReturnType<typeof setInterval> | null = null;
  let callbackId: number | null = null;
  const t0 = performance.now();

  const detect = () => {
    if (stopped || video.readyState < 2) return;
    const now = performance.now();
    // Never faster than 15 a second, and never twice on the same video frame.
    if (now - lastRun < MIN_GAP_MS - 1 || video.currentTime === lastVideoTime) return;
    lastRun = now;
    lastVideoTime = video.currentTime;
    try {
      const result = landmarker.detectForVideo(video, now);
      const shapes = result.faceBlendshapes?.[0]?.categories;
      const tMs = now - t0;
      if (!shapes || result.faceLandmarks.length === 0) {
        onFrame({ tMs, faceSeen: false, rounded: 0, spread: 0, jawOpen: 0 });
        return;
      }
      const scores: Record<string, number> = {};
      for (const c of shapes) scores[c.categoryName] = c.score;
      onFrame(lipFrameFromBlendshapes(scores, tMs));
    } catch {
      // One bad frame is skipped. The loop keeps going.
    }
  };

  if ('requestVideoFrameCallback' in video) {
    const loop = () => {
      detect();
      if (!stopped) callbackId = video.requestVideoFrameCallback(loop);
    };
    callbackId = video.requestVideoFrameCallback(loop);
  } else {
    timer = setInterval(detect, MIN_GAP_MS);
  }

  return {
    stop() {
      if (stopped) return;
      stopped = true;
      if (timer !== null) clearInterval(timer);
      if (callbackId !== null && 'cancelVideoFrameCallback' in video) {
        video.cancelVideoFrameCallback(callbackId);
      }
      stopTracks();
      video.srcObject = null;
      try {
        landmarker.close();
      } catch {
        // Already closed.
      }
    },
  };
}
