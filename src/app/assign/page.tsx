import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AssignView } from '@/components/AssignView';

export const metadata: Metadata = { title: 'Practice from your speech therapist · SeeSpeak' };

/** The page a practice link opens. The link's values are read in the browser, so it sits in Suspense. */
export default function AssignPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-8 pb-10">
      <Suspense fallback={<p className="text-[17px] text-muted">Loading...</p>}>
        <AssignView />
      </Suspense>
    </main>
  );
}
