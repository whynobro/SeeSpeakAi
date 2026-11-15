import type { Metadata } from 'next';
import { CheckList } from '@/components/CheckList';
import { PageHeader, Screen } from '@/components/PageHeader';

export const metadata: Metadata = { title: 'Checks · See Speak AI' };

/** The Checks tab: every way to find where practice should start, in one grouped list. */
export default function ChecksPage() {
  return (
    <Screen>
      <PageHeader
        back={{ href: '/', label: 'Home' }}
        title="Checks"
        lede="Short checks that set where your practice starts. Do any of them, any time."
      />
      <CheckList />
      <p className="text-[15px] text-muted">
        Results stay on this phone. They are practice checks, not medical tests.
      </p>
    </Screen>
  );
}
