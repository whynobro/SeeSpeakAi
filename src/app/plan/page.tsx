'use client';

import { useEffect, useState } from 'react';
import { PlanView } from '@/components/PlanView';
import { loadPlan } from '@/components/planStore';
import { Button, Card } from '@/components/ui';
import type { PracticePlan } from '@/lib/types';

/** The learner's saved practice plan. It survives a reload because it is kept on this device. */
export default function PlanPage() {
  // undefined: not read yet. null: no plan saved on this device.
  const [plan, setPlan] = useState<PracticePlan | null | undefined>(undefined);

  // Read storage after the page is on screen, never during render.
  useEffect(() => {
    queueMicrotask(() => setPlan(loadPlan()));
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-6 pb-10">
      <h1 className="text-[28px] leading-tight font-extrabold tracking-tight">Your practice plan</h1>

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
          <PlanView plan={plan} />
          <Button href="/" variant="ghost" block={false} className="self-start">
            Make a new plan
          </Button>
        </>
      )}
    </main>
  );
}
