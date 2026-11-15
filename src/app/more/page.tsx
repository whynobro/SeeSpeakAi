import type { Metadata } from 'next';
import Link from 'next/link';
import { AdultCodeCard } from '@/components/AdultCodeCard';
import { BirdSwitch } from '@/components/bird/BirdSwitch';
import { DingSwitch } from '@/components/DingSwitch';
import { HowItWorks } from '@/components/HomeStart';
import { ChevronRightIcon } from '@/components/Icons';
import { LandingSections } from '@/components/LandingSections';
import { PageHeader, SECTION_TITLE, Screen } from '@/components/PageHeader';
import { Wordmark } from '@/components/home/Wordmark';
import { VoiceLoop } from '@/components/VoiceLoop';
import { COPY } from '@/content/copy';
import { LIMITATIONS } from '@/lib/scoring';
import { THERAPIST } from '@/content/therapist';

export const metadata: Metadata = { title: 'More · See Speak AI' };

/**
 * The More tab: what SeeSpeak is, who it is for, privacy, notes for parents and therapists, and questions.
 * This is the landing content that used to fill the home screen (theme v2: home opens on the next task).
 */
export default function MorePage() {
  return (
    <Screen className="gap-8">
      <PageHeader back={{ href: '/', label: 'Home' }} title="About See Speak AI">
        <Wordmark className="mt-1 w-44" />
        <p className={SECTION_TITLE}>{COPY.tagline}</p>
      </PageHeader>
      <VoiceLoop />
      <Link
        href="/therapist"
        className="group flex min-h-16 items-center gap-4 rounded-xl border border-line bg-surface px-4 py-3 transition-colors duration-150 hover:bg-accent-soft/60 active:bg-accent-soft"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[17px] leading-snug font-bold">{THERAPIST.moreLink}</span>
          <span className="text-[15px] text-muted">{THERAPIST.moreDetail}</span>
        </span>
        <ChevronRightIcon className="h-5 w-5 shrink-0 text-muted transition-transform duration-150 group-hover:translate-x-0.5" />
      </Link>
      <HowItWorks />
      <LandingSections />
      <AdultCodeCard />
      <section aria-labelledby="settings-title" className="flex flex-col gap-2">
        <h2 id="settings-title" className={SECTION_TITLE}>
          Settings
        </h2>
        <ul className="divide-y divide-line border-y border-line">
          <li>
            <DingSwitch />
          </li>
          <li>
            <BirdSwitch />
          </li>
        </ul>
      </section>
      <section
        aria-labelledby="limits-title"
        className="flex flex-col gap-2 text-[15px] leading-relaxed text-muted"
      >
        <h2 id="limits-title" className={`${SECTION_TITLE} text-foreground`}>
          What this cannot do
        </h2>
        <ul className="list-disc pl-5">
          {LIMITATIONS.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p>{COPY.notTherapy}</p>
        <p>{COPY.privacy}</p>
      </section>
      <footer className="flex flex-col gap-2 border-t border-line pt-6 text-[15px] leading-relaxed text-muted">
        <p>{COPY.optIn}</p>
      </footer>
    </Screen>
  );
}
