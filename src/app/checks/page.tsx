import type { Metadata } from 'next';
import { CheckList } from '@/components/CheckList';

export const metadata: Metadata = { title: 'Checks · SeeSpeak' };

/** The Checks tab: every way to find where practice should start, in one grouped list. */
export default function ChecksPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 pt-8 pb-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] leading-tight font-extrabold tracking-tight">Checks</h1>
        <p className="text-[17px] text-muted">
          Short checks that set where your practice starts. Do any of them, any time.
        </p>
      </header>
      <CheckList />
      <p className="text-[15px] text-muted">
        Results stay on this phone. They are practice checks, not medical tests.
      </p>
    </main>
  );
}
