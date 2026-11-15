import { planFromRules } from '@/lib/ai/rulesPlan';
import type { AssessmentReport, PracticePlan } from '@/lib/types';

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

/*
 * A report waiting for Claude's plan. The built-in plan is saved and shown at once, and the plan page
 * asks the server for the personal one. It holds the same name-free report that would have been sent anyway.
 */
const PENDING_KEY = 'seespeak:plan-pending';

export interface PendingPlan {
  /** Id of the built-in plan on screen. Claude's plan replaces it only while that one is still saved. */
  planId: string;
  report: AssessmentReport;
}

export function savePending(pending: PendingPlan): void {
  try {
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    // Storage blocked: the built-in plan simply stays.
  }
}

export function loadPending(): PendingPlan | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PendingPlan;
    return typeof p?.planId === 'string' && p.report ? p : null;
  } catch {
    return null;
  }
}

/** Show the built-in plan at once and queue the request for Claude's plan. Call, then open /plan. */
export function showRulesPlanNow(report: AssessmentReport): void {
  const plan = planFromRules(report);
  savePlan(plan);
  savePending({ planId: plan.id, report });
}

export function clearPending(): void {
  try {
    window.sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // Nothing to clear.
  }
}
