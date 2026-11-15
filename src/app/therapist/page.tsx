import type { Metadata } from 'next';
import { TherapistForm } from '@/components/TherapistForm';
import { THERAPIST } from '@/content/therapist';

export const metadata: Metadata = { title: 'For speech therapists · SeeSpeak' };

/** Where a speech therapist sets home practice and gets a link to send. Nothing here is saved or sent. */
export default function TherapistPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-8 pb-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] leading-tight font-extrabold tracking-tight">{THERAPIST.title}</h1>
        <p className="text-[17px] text-muted">{THERAPIST.intro}</p>
      </header>
      <TherapistForm />
    </main>
  );
}
