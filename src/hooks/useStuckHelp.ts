'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getLastRecording } from '@/lib/audio/lastRecording';
import type { StuckHelp, StuckRequest, StuckTry } from '@/lib/ai/stuck';
import { summarizeTrace } from '@/lib/scoring/trace';
import { loadGoals } from '@/lib/store';
import type { LipSummary } from '@/lib/lips/types';
import type { AttemptScore, PracticeWord } from '@/lib/types';

/** Tries in a row on one word that did not count before the bird offers "Stuck? Tap me". */
const STUCK_AFTER = 3;
/** The last tries kept and sent. */
const MAX_TRIES = 6;

/**
 * "Stuck? Ask Claude for a closer look", started by tapping the bird. The screen calls `record` right after each
 * scored try (right after the mic stops, so the last recording is that try). `hasTries` is true once a try on
 * this word did not count (the bird can ask). After three in a row, `canAsk` turns true (the bird shows
 * its "Stuck? Tap me" bubble). `ask` sends ONE request per streak: numbers only (scores, the shape of
 * each sound, lip numbers), never audio or a picture. A try that counts, or a new word, starts a new streak.
 */
export function useStuckHelp() {
  const tries = useRef<{ wordId: string; list: StuckTry[] }>({ wordId: '', list: [] });
  const [streak, setStreak] = useState(0);
  const [help, setHelp] = useState<StuckHelp | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const sent = useRef(false);
  const request = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    request.current?.abort();
    request.current = null;
    tries.current = { wordId: '', list: [] };
    sent.current = false;
    setStreak(0);
    setHelp(null);
    setLoading(false);
    setFailed(false);
  }, []);

  /** `counted`: did this try count (a hit, or in level mode counting for the tier)? */
  const record = useCallback(
    (word: PracticeWord, score: AttemptScore, counted: boolean, lips: LipSummary | null) => {
      if (counted) {
        reset();
        return;
      }
      if (tries.current.wordId !== word.id) {
        tries.current = { wordId: word.id, list: [] };
        sent.current = false;
        setHelp(null);
        setStreak(0);
      }
      // The shape of the sound for this try, taken now like the coach does: numbers only.
      const trace = summarizeTrace(getLastRecording().frames, word);
      tries.current.list = [...tries.current.list, { score, trace, lips }].slice(-MAX_TRIES);
      setStreak((n) => n + 1);
    },
    [reset],
  );

  const ask = useCallback(async (word: PracticeWord): Promise<void> => {
    if (sent.current || tries.current.list.length === 0) return;
    sent.current = true; // once per streak, even if the button is tapped twice
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setFailed(false);
    setLoading(true);
    try {
      const body: StuckRequest = {
        target: word.target,
        word: word.text,
        position: word.position,
        tries: tries.current.list,
        learnerGoals: loadGoals(),
      };
      const response = await fetch('/api/stuck-help', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Stuck help failed with ${response.status}`);
      const result = (await response.json()) as StuckHelp;
      if (!controller.signal.aborted) setHelp(result);
    } catch {
      // Let the learner tap again: nothing was shown, so this streak has not used its one look yet.
      if (!controller.signal.aborted) {
        sent.current = false;
        setFailed(true);
      }
    } finally {
      if (request.current === controller) {
        request.current = null;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => () => request.current?.abort(), []);

  return {
    hasTries: streak > 0,
    canAsk: streak >= STUCK_AFTER && !help && !loading,
    loading,
    help,
    failed,
    record,
    ask,
    reset,
  };
}
