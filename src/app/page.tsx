import { COPY } from '@/content/copy';
import { HomeStart } from '@/components/HomeStart';
import { SavedPlanLink } from '@/components/SavedPlanLink';
import Image from 'next/image';
import { LANDING } from '@/content/landing';

/** A small padlock, so the privacy line is not color alone. */
function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-6 pb-6">
      <header className="flex items-center justify-between gap-3">
        {/* The brand wordmark (public/brand). Its background is solid white, so multiply blends it into the page. */}
        <h1>
          <Image
            src="/brand/seespeak-logo.png"
            alt="SeeSpeak"
            width={1200}
            height={400}
            priority
            className="h-auto w-40 mix-blend-multiply"
          />
        </h1>
        <p className="flex items-center gap-1.5 text-[13px] font-bold text-accent-edge">
          <LockIcon />
          {LANDING.privacyTitle}
        </p>
      </header>
      <p className="text-[28px] leading-tight font-extrabold tracking-tight text-balance">{COPY.tagline}</p>
      {/* Theme v2: home opens on the next task. What SeeSpeak is, privacy details and questions live in More. */}
      <SavedPlanLink />
      <HomeStart />
    </main>
  );
}
