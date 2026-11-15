'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftIcon } from '@/components/Icons';
import { PlanView } from '@/components/PlanView';
import { clearPending, loadPending, loadPlan, savePlan } from '@/components/planStore';
import { Button, Card } from '@/components/ui';
import type { PracticePlan } from '@/lib/types';

/** The learner's saved practice plan. It survives a reload because it is kept on this device. */
export default function PlanPage() {
  // undefined: not read yet. null: no plan saved on this device.
  const [personalizing, setPersonalizing] = useState(false);
  const [plan, setPlan] = useState<PracticePlan | null | undefined>(undefined);

  // Read storage after the page is on screen, never during render.
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!active) return;
      setPlan(loadPlan());
      // A built-in plan is on screen already. Ask for Claude's plan without blocking anything.
      const pending = loadPending();
      if (!pending) return;
      setPersonalizing(true);
      const timer = setTimeout(() => controller.abort(), 20000);
      fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report: pending.report }),
        signal: controller.signal,
      })
        .then((res) => (res.ok ? (res.json() as Promise<PracticePlan>) : null))
        .then((next) => {
          // Replace only if the learner still has the built-in plan from this request.
          if (next && loadPlan()?.id === pending.planId) {
            savePlan(next);
            if (active) setPlan(next);
          }
        })
        .catch(() => {
          // The built-in plan stays. Nothing to show.
        })
        .finally(() => {
          clearTimeout(timer);
          if (active) clearPending();
          if (active) setPersonalizing(false);
        });
    });
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-6 pb-10">
      <Button href="/" variant="ghost" block={false} className="self-start">
        <ArrowLeftIcon className="h-5 w-5" />
        Home
      </Button>
      <h1 className="text-3xl font-extrabold tracking-tight">Your practice plan</h1>

      {plan === undefined && (
        <div aria-hidden="true" className="flex flex-col gap-4">
          <div className="h-28 rounded-3xl bg-line motion-safe:animate-pulse" />
          <div className="h-64 rounded-3xl bg-line/70 motion-safe:animate-pulse" />
        </div>
      )}

      {plan === null && (
        <Card className="flex flex-col gap-4">
          <p className="text-lg leading-relaxed">
            No plan yet. Start with a hearing check, a speech check or a previous report, and SeeSpeak makes
            one for you.
          </p>
          <Button href="/">Choose how to start</Button>
        </Card>
      )}

      {plan && (
        <>
          <PlanView plan={plan} personalizing={personalizing} />
          <Button href="/" variant="ghost" block={false} className="self-start">
            Make a new plan
          </Button>
        </>
      )}
    </main>
  );
}
