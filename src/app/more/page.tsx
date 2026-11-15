import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { DingSwitch } from '@/components/DingSwitch';
import { HowItWorks } from '@/components/HomeStart';
import { ChevronRightIcon } from '@/components/Icons';
import { LandingSections } from '@/components/LandingSections';
import { COPY } from '@/content/copy';
import { THERAPIST } from '@/content/therapist';

export const metadata: Metadata = { title: 'More · SeeSpeak' };

/**
 * The More tab: what SeeSpeak is, who it is for, privacy, notes for parents and therapists, and questions.
 * This is the landing content that used to fill the home screen (theme v2: home opens on the next task).
 */
export default function MorePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-8 px-4 pt-8 pb-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-[28px] leading-tight font-extrabold tracking-tight">About SeeSpeak</h1>
        <Image
          src="/brand/seespeak-logo.png"
          alt="SeeSpeak logo: a teal bird singing"
          width={1200}
          height={400}
          className="h-auto w-44 mix-blend-multiply"
        />
        <p className="text-[20px] leading-snug font-bold">{COPY.tagline}</p>
      </header>
      <Link
        href="/therapist"
        className="group flex min-h-16 items-center gap-4 rounded-2xl border border-line bg-surface px-4 py-3 transition-colors duration-150 hover:bg-accent-soft/60 active:bg-accent-soft"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[17px] leading-snug font-bold">{THERAPIST.moreLink}</span>
          <span className="text-[15px] text-muted">{THERAPIST.moreDetail}</span>
        </span>
        <ChevronRightIcon className="h-5 w-5 shrink-0 text-muted transition-transform duration-150 group-hover:translate-x-0.5" />
      </Link>
      <HowItWorks />
      <LandingSections />
      <section aria-labelledby="settings-title" className="flex flex-col gap-2">
        <h2 id="settings-title" className="text-[20px] leading-snug font-bold">
          Settings
        </h2>
        <ul className="divide-y divide-line border-y border-line">
          <li>
            <DingSwitch />
          </li>
        </ul>
      </section>
      <footer className="flex flex-col gap-2 border-t border-line pt-6 text-[15px] leading-relaxed text-muted">
        <p>{COPY.optIn}</p>
        <p>{COPY.notTherapy}</p>
        <p>{COPY.privacy}</p>
      </footer>
    </main>
  );
}
