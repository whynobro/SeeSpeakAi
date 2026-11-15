import { FFT_SIZE, featuresFromFrame } from '@/lib/audio/features';
import type { FrameFeatures } from '@/lib/types';
import { setMicProfile } from '@/lib/scoring';

export interface MicHandle {
  sampleRate: number;
  stop(): void;
}

const FRAME_INTERVAL_MS = 20;

function micError(err: unknown): Error {
  const name = err instanceof DOMException ? err.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return new Error(
      'Microphone access was blocked. Allow the microphone for this site in your browser settings, then try again.',
    );
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return new Error(
      'No microphone was found. Plug one in or check that your device has a working microphone.',
    );
  }
  if (name === 'NotReadableError' || name === 'AbortError') {
    return new Error(
      'The microphone could not be opened. Close other apps that may be using it and try again.',
    );
  }
  return new Error('The microphone could not be started. Please try again.');
}

/**
 * Start the microphone and call `onFrame` about 50 times a second.
 * Browser only. Audio is analysed on the device and never uploaded or stored.
 */
export async function startMic(onFrame: (frame: FrameFeatures) => void): Promise<MicHandle> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error(
      'This browser cannot use the microphone here. Open the app over HTTPS (or localhost) in a current browser.',
    );
  }

  // iPhone and iPad mics hear the hiss lower and softer than a laptop does: score with their own numbers.
  // iPadOS reports itself as a Mac, so a Mac with a touch screen counts too.
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  setMicProfile(isIos ? 'ios' : 'default');

  let stream: MediaStream;
  try {
    // Browser noise suppression can treat a hiss as noise and remove it, and in Chrome automatic gain
    // is only switched off together with echo cancellation, so all three are turned off.
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
    });
  } catch (err) {
    throw micError(err);
  }

  let audioContext: AudioContext;
  try {
    // No sample rate is requested: the device's native rate avoids resampling the hiss band.
    audioContext = new AudioContext();
  } catch {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error('This browser cannot analyse audio. Try a current version of Chrome, Edge or Safari.');
  }
  // Safari can start the context suspended.
  if (audioContext.state === 'suspended') {
    await audioContext.resume().catch(() => undefined);
  }

  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = FFT_SIZE;
  analyser.smoothingTimeConstant = 0;
  // Not connected to the destination, so nothing is played back.
  source.connect(analyser);

  const buffer = new Float32Array(FFT_SIZE);
  const startedAt = performance.now();
  const sampleRate = audioContext.sampleRate;

  const timer = setInterval(() => {
    analyser.getFloatTimeDomainData(buffer);
    onFrame(featuresFromFrame(buffer, sampleRate, performance.now() - startedAt));
  }, FRAME_INTERVAL_MS);

  let stopped = false;
  return {
    sampleRate,
    stop() {
      if (stopped) return;
      stopped = true;
      clearInterval(timer);
      source.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      void audioContext.close().catch(() => undefined);
    },
  };
}
