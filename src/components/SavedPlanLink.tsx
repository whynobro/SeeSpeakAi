'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ClipboardIcon } from './Icons';
import { loadPlan } from './planStore';

/** A way back to the saved practice plan. Shows only once a plan is saved on this device. */
export function SavedPlanLink() {
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      const plan = loadPlan();
      if (!plan) return;
      const sounds = plan.steps.map((s) => `"${s.sound}"`).join(', ');
      setSummary(sounds ? `Sounds: ${sounds}` : 'Open your plan');
    });
  }, []);

  if (summary === null) return null;
  return (
    <Link
      href="/plan"
      className="flex min-h-16 items-center gap-4 rounded-xl border-2 border-accent bg-accent-soft px-4 py-3 transition-colors hover:bg-accent-soft/70"
    >
      <ClipboardIcon className="h-6 w-6 shrink-0 text-accent-edge" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-lg font-bold">Your practice plan</span>
        <span className="truncate text-base text-muted">{summary}</span>
      </span>
    </Link>
  );
}
