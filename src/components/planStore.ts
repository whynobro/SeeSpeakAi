import type { PracticePlan } from '@/lib/types';

/*
 * TODO: replace with savePlan / loadPlan from @/lib/store once Michael's #50 lands.
 * A stand-in so the plan survives a reload: the latest plan is kept in this browser only.
 * A plan holds no name and no voice: sounds, plain sentences and practice words.
 */

const KEY = 'seespeak:plan';

export function savePlan(plan: PracticePlan): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(plan));
  } catch {
    // Storage blocked (private mode): the plan still shows for this visit.
  }
}

export function loadPlan(): PracticePlan | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const plan = JSON.parse(raw) as PracticePlan;
    // A quick shape check, so an old or broken value never crashes a screen.
    if (typeof plan?.id !== 'string' || !Array.isArray(plan.steps)) return null;
    return plan;
  } catch {
    return null;
  }
}
