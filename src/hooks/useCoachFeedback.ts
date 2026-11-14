'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getLastRecording } from '@/lib/audio/lastRecording';
import { summarizeTrace } from '@/lib/scoring/trace';
import type { AttemptScore, CoachFeedback, FeedbackRequest, PracticeWord } from '@/lib/types';

/** How many past tries on the same word are sent to the brain. */
const MAX_RECENT = 10;

/**
 * The brain's sentence after a try. Screens call `ask(word, score)` right after `scoreAttempt`, show
 * `feedback.message` and `feedback.cue` when they arrive, and follow `feedback.nextAction`.
 * Only numbers (the scores and the shape of the sound) are sent to the server, never audio. If the call fails, `feedback` stays null and
 * the screen simply shows the verdict without a sentence.
 */
export function useCoachFeedback() {
  const [feedback, setFeedback] = useState<CoachFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const recent = useRef<{ wordId: string; scores: AttemptScore[] }>({ wordId: '', scores: [] });
  const request = useRef<AbortController | null>(null);

  const clear = useCallback(() => {
    request.current?.abort();
    request.current = null;
    setFeedback(null);
    setLoading(false);
  }, []);

  const ask = useCallback(async (word: PracticeWord, score: AttemptScore): Promise<void> => {
    // Tries are remembered per word, so "three in a row" means three on this word.
    if (recent.current.wordId !== word.id) recent.current = { wordId: word.id, scores: [] };
    recent.current.scores = [...recent.current.scores, score].slice(-MAX_RECENT);

    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setFeedback(null);
    setLoading(true);
    try {
      // The shape of the sound over the last recording: numbers only, never audio.
      const trace = summarizeTrace(getLastRecording().frames, word);
      const body: FeedbackRequest = {
        target: word.target,
        word: word.text,
        recent: recent.current.scores,
        trace,
      };
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Feedback call failed with ${response.status}`);
      const result = (await response.json()) as CoachFeedback;
      if (!controller.signal.aborted) setFeedback(result);
    } catch {
      // No sentence is better than a wrong or broken one. The verdict is already on screen.
    } finally {
      if (request.current === controller) {
        request.current = null;
        setLoading(false);
      }
    }
  }, []);

  // Stop any call still in flight when the screen goes away.
  useEffect(() => () => request.current?.abort(), []);

  return { feedback, loading, ask, clear };
}
