import { wordsFor } from '@/content/words';
import type { PracticeListRequest, PracticeListResponse, PracticeWord } from '@/lib/types';

/** Server side only. */
export async function getPracticeList(req: PracticeListRequest): Promise<PracticeListResponse> {
  // TODO(tech lane): when ANTHROPIC_API_KEY is set, ask Claude to pick and order words around req.interests, validate every word against the rules in src/content/words.ts, and fall back to the word bank on any error. Server side only.
  const targets = [...new Set(req.targets)];
  const words: PracticeWord[] = [];
  targets.forEach((target, i) => {
    const share = Math.floor(req.count / targets.length) + (i < req.count % targets.length ? 1 : 0);
    words.push(...wordsFor(target, share));
  });
  return { words, source: 'word-bank' };
}
