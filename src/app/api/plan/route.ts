import { buildPlan } from '@/lib/ai/plan';
import { removeNames } from '@/lib/privacy';
import type { AssessmentReport, LearnerGoals } from '@/lib/types';

function strings(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((x): x is string => typeof x === 'string')
    .slice(0, max)
    .map((x) => x.slice(0, 40));
}

/** Learner goals: a generous limit only, so one request cannot be huge. Names were removed on the device. */
export const GOALS_TEXT_MAX = 6000;

function cleanGoals(value: unknown): LearnerGoals | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const g = value as Partial<LearnerGoals>;
  const text = typeof g.text === 'string' ? g.text.slice(0, GOALS_TEXT_MAX) : '';
  const chips = strings(g.chips, 12);
  return text || chips.length > 0 ? { chips, text } : undefined;
}

// The Claude call can take up to 20 seconds, so give the function room before the host cuts it off.
export const maxDuration = 30;

// Server only: the key must never reach the browser. The report must arrive with names already removed.
// Nothing sent here is stored. Names are removed from the notes a second time here, in case the device missed one.
export async function POST(request: Request) {
  let body: { report?: Partial<AssessmentReport> };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON.' }, { status: 400 });
  }
  const r = body.report;
  if (!r || (r.source !== 'therapist' && r.source !== 'in-app-test')) {
    return Response.json(
      { error: 'Expected { report } with source "therapist" or "in-app-test".' },
      { status: 400 },
    );
  }
  const report: AssessmentReport = {
    source: r.source,
    therapistSounds: strings(r.therapistSounds, 10),
    therapistNotes:
      typeof r.therapistNotes === 'string' ? removeNames(r.therapistNotes.slice(0, 6000)).slice(0, 2000) : '',
    profile: r.profile ?? null,
    baseline: r.baseline ?? {},
    ageGroup: r.ageGroup === 'child' || r.ageGroup === 'teen' ? r.ageGroup : 'adult',
    interests: strings(r.interests, 5),
    learnerGoals: cleanGoals(r.learnerGoals),
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
  };
  return Response.json(await buildPlan(report));
}
