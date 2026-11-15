import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { POST } from '@/app/api/stuck-help/route';
import {
  buildStuckHelp,
  buildStuckPrompt,
  cleanStuckRequest,
  mergeStuck,
  stuckFromRules,
  type StuckHelp,
  type StuckRequest,
  type StuckTry,
} from '@/lib/ai/stuck';
import { TECHNICAL_TEXT } from '@/lib/ai/validate';
import type { AttemptScore, TargetSound, TraceSummary } from '@/lib/types';

const EM_DASH = String.fromCharCode(0x2014);

const trace = (over: Partial<TraceSummary> = {}): TraceSummary => ({
  hissMs: 300,
  heldMs: 260,
  positionStart: 0.8,
  positionMid: 0.8,
  positionEnd: 0.8,
  drift: 0,
  steadiness: 0.8,
  hissToVowel: 0.4,
  gapMs: null,
  vowelMs: 200,
  ...over,
});

const score = (over: Partial<AttemptScore> = {}): AttemptScore => ({
  target: 's',
  verdict: 'close',
  heard: 'sh',
  meterPosition: 0.3,
  hissMs: 300,
  confidence: 0.7,
  warnings: [],
  ...over,
});

const tryOf = (s: Partial<AttemptScore> = {}, t: Partial<TraceSummary> | null = {}): StuckTry => ({
  score: score(s),
  trace: t === null ? null : trace(t),
  lips: null,
});

function req(tries: StuckTry[], target: TargetSound = 's'): StuckRequest {
  return { target, word: 'sun', position: 'start', tries };
}

describe('stuckFromRules', () => {
  it('names the wrong side when the hiss keeps landing near "sh" for an "s"', () => {
    const help = stuckFromRules(
      req([tryOf(), tryOf({ meterPosition: 0.2 }), tryOf({ meterPosition: 0.35 })]),
    );
    expect(help.source).toBe('rules');
    expect(help.pattern).toContain('"sh"');
    expect(help.pattern).toContain('"s"');
    expect(help.steps.length).toBeGreaterThan(0);
    expect(help.steps.length).toBeLessThanOrEqual(3);
  });

  it('names the other side for an "sh" that lands near "s"', () => {
    const tries = [0.8, 0.9, 0.7].map((p) =>
      tryOf({ target: 'sh', meterPosition: p, heard: 's' }, { positionStart: p, positionEnd: p }),
    );
    expect(stuckFromRules(req(tries, 'sh')).pattern).toContain('near "s"');
  });

  it('says "z" is made like "s" when the "z" hiss lands on the wrong side', () => {
    const help = stuckFromRules(req([tryOf({ target: 'z' }), tryOf({ target: 'z' })], 'z'));
    expect(help.pattern).toContain('"z" is made like "s"');
  });

  it('says the sound was too short', () => {
    const short = { meterPosition: 0.8, heard: 's' as const, hissMs: 70 };
    const help = stuckFromRules(
      req([tryOf(short, { heldMs: 40 }), tryOf(short, { heldMs: 50 }), tryOf(short, { heldMs: 60 })]),
    );
    expect(help.pattern).toMatch(/ending very quickly/);
  });

  it('says nothing was heard when there was no hiss', () => {
    const none = { verdict: 'miss' as const, heard: null, meterPosition: null, hissMs: 0, confidence: 0.2 };
    const help = stuckFromRules(req([tryOf(none, null), tryOf(none, null), tryOf(none, null)]));
    expect(help.pattern).toMatch(/could not pick up a hiss/);
  });

  it('spots a hiss that slides away from "s"', () => {
    const slide = { meterPosition: 0.6, heard: 's' as const };
    const t = { positionStart: 0.9, positionEnd: 0.4, drift: -0.5 };
    const help = stuckFromRules(req([tryOf(slide, t), tryOf(slide, t), tryOf(slide, t)]));
    expect(help.pattern).toMatch(/slides toward "sh"/);
  });

  it('spots a "z" with no buzz', () => {
    const noBuzz = { target: 'z' as const, heard: 's' as const, meterPosition: 0.8 };
    const help = stuckFromRules(req([tryOf(noBuzz), tryOf(noBuzz), tryOf(noBuzz)], 'z'));
    expect(help.pattern).toMatch(/buzz/);
  });

  it('describes a soft flat hiss without the word lisp', () => {
    const flat = { lisp: true, heard: 's' as const, meterPosition: 0.55 };
    const help = stuckFromRules(req([tryOf(flat), tryOf(flat), tryOf(flat)]));
    expect(help.pattern).toMatch(/soft and flat/);
  });

  it('always gives clean, plain text with a closing line and an honest source', () => {
    const cases: StuckTry[][] = [
      [tryOf(), tryOf(), tryOf()],
      [tryOf({ meterPosition: 0.8, heard: 's' }, { heldMs: 30 })],
      [tryOf({ meterPosition: 0.8, heard: 's' }), tryOf({ meterPosition: 0.7, heard: 's' })],
      [tryOf({ meterPosition: 0.8, heard: 's' }, { hissToVowel: 0.01 })],
      [tryOf({ meterPosition: 0.8, heard: 's' }, { steadiness: 0.1 })],
    ];
    for (const tries of cases) {
      const help = stuckFromRules(req(tries));
      const text = [help.pattern, ...help.steps, help.closing].join(' ');
      expect(help.source).toBe('rules');
      expect(help.closing.length).toBeGreaterThan(0);
      expect(TECHNICAL_TEXT.test(text)).toBe(false);
      expect(/\d|lisp|diagnos/i.test(text)).toBe(false);
      expect(text.includes(EM_DASH)).toBe(false);
    }
  });
});

describe('mergeStuck', () => {
  const rules = stuckFromRules(req([tryOf(), tryOf(), tryOf()]));
  const good = {
    pattern: 'Your hiss keeps landing near "sh" when you aim for "s".',
    steps: ['Smile a little.', 'Move your tongue tip forward.', 'Blow a thin line of air.'],
    closing: 'You are getting closer each time.',
  };

  it('accepts a clean answer and marks it as ai', () => {
    const help = mergeStuck(rules, good);
    expect(help.source).toBe('ai');
    expect(help.steps).toHaveLength(3);
  });

  it('keeps at most three steps and drops a leading list number', () => {
    const help = mergeStuck(rules, { ...good, steps: ['1. Smile a little.', 'Two.', 'Three.', 'Four.'] });
    expect(help.steps).toEqual(['Smile a little.', 'Two.', 'Three.']);
  });

  it('turns em dashes into commas', () => {
    const help = mergeStuck(rules, { ...good, closing: `Nice work ${EM_DASH} keep going.` });
    expect(help.closing).toBe('Nice work, keep going.');
  });

  it('rejects bad JSON shapes', () => {
    const bad: unknown[] = [
      null,
      'text',
      [],
      {},
      { ...good, pattern: '' },
      { ...good, pattern: 5 },
      { ...good, steps: 'Smile.' },
      { ...good, steps: [] },
      { ...good, steps: ['Smile.', 7] },
      { ...good, closing: undefined },
      { ...good, pattern: 'x'.repeat(201) },
      { ...good, steps: ['x'.repeat(161)] },
    ];
    for (const json of bad) expect(mergeStuck(rules, json)).toBe(rules);
  });

  it('rejects technical text, numbers, lisp and diagnosis words', () => {
    const lines = [
      'Your hiss lasted 120 ms.',
      'It sat near 4 kHz.',
      'The pitch was low.',
      'The centroid moved.',
      'Wrong frequency.',
      'Say it 3 times.',
      'That sounds like a lisp.',
      'This could be a speech disorder.',
      'I cannot diagnose this.',
    ];
    for (const line of lines) {
      expect(mergeStuck(rules, { ...good, pattern: line })).toBe(rules);
      expect(mergeStuck(rules, { ...good, steps: [line] })).toBe(rules);
      expect(mergeStuck(rules, { ...good, closing: line })).toBe(rules);
    }
  });
});

describe('cleanStuckRequest', () => {
  const body = {
    target: 's',
    word: 'sun',
    position: 'start',
    tries: [{ score: score(), trace: trace(), lips: null }],
  };

  it('keeps a valid request and clamps numbers', () => {
    const wild = { ...body, tries: [{ score: score({ hissMs: 99999, confidence: 4 }), trace: trace() }] };
    const out = cleanStuckRequest(wild);
    expect(out?.tries[0].score.hissMs).toBe(10000);
    expect(out?.tries[0].score.confidence).toBe(1);
  });

  it('keeps only the last six tries', () => {
    const many = { ...body, tries: Array.from({ length: 9 }, () => body.tries[0]) };
    expect(cleanStuckRequest(many)?.tries).toHaveLength(6);
  });

  it('drops a broken trace and broken tries, rejects when none are left', () => {
    const out = cleanStuckRequest({ ...body, tries: [{ score: score(), trace: { hissMs: 'x' } }] });
    expect(out?.tries[0].trace).toBeNull();
    expect(cleanStuckRequest({ ...body, tries: [{ score: { verdict: 'great' } }, 5, null] })).toBeNull();
    expect(cleanStuckRequest({ ...body, tries: [] })).toBeNull();
    expect(cleanStuckRequest({ ...body, target: 'th' })).toBeNull();
    expect(cleanStuckRequest({ ...body, word: 5 })).toBeNull();
    expect(cleanStuckRequest(null)).toBeNull();
  });

  it('never lets extra fields through to the prompt', () => {
    const sneaky = {
      ...body,
      name: 'Alex Smith',
      audio: 'AAAA',
      tries: [{ score: { ...score(), nickname: 'Alex' }, trace: trace(), picture: 'data:image/png' }],
    };
    const out = cleanStuckRequest(sneaky) as StuckRequest;
    const { user } = buildStuckPrompt(out, stuckFromRules(out));
    expect(user).not.toMatch(/Alex|AAAA|data:image/);
  });
});

describe('no API key', () => {
  let saved: string | undefined;
  beforeEach(() => {
    saved = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });
  afterEach(() => {
    if (saved !== undefined) process.env.ANTHROPIC_API_KEY = saved;
  });

  it('buildStuckHelp returns the rules answer', async () => {
    const help: StuckHelp = await buildStuckHelp(req([tryOf(), tryOf(), tryOf()]));
    expect(help.source).toBe('rules');
  });

  it('POST /api/stuck-help returns a rules answer', async () => {
    const response = await POST(
      new Request('http://localhost/api/stuck-help', {
        method: 'POST',
        body: JSON.stringify({ target: 's', word: 'sun', position: 'start', tries: [{ score: score() }] }),
      }),
    );
    expect(response.status).toBe(200);
    const help = (await response.json()) as StuckHelp;
    expect(help.source).toBe('rules');
    expect(help.steps.length).toBeGreaterThan(0);
  });

  it('POST rejects bad bodies with 400', async () => {
    for (const body of ['not json', JSON.stringify({ target: 's', word: 'sun', tries: [] })]) {
      const response = await POST(new Request('http://localhost/api/stuck-help', { method: 'POST', body }));
      expect(response.status).toBe(400);
    }
  });
});
