import type { Metadata } from 'next';
import { PageHeader, Screen } from '@/components/PageHeader';
import { TherapistForm } from '@/components/TherapistForm';
import { THERAPIST } from '@/content/therapist';

export const metadata: Metadata = { title: 'For speech therapists · See Speak AI' };

/** Where a speech therapist sets home practice and gets a link to send. Nothing here is saved or sent. */
export default function TherapistPage() {
  return (
    <Screen>
      <PageHeader title={THERAPIST.title} lede={THERAPIST.intro} />
      <TherapistForm />
    </Screen>
  );
}
