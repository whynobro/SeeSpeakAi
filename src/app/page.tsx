import { COPY } from '@/content/copy';
import { HomeStart } from '@/components/HomeStart';
import { LandingSections } from '@/components/LandingSections';
import { LogoTile } from '@/components/ui';
import { LANDING } from '@/content/landing';

/** A small padlock, so the privacy line is not color alone. */
function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={22}
      height={22}
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
    <main className="mx-auto flex w-full max-w-md flex-col gap-8 px-4 pt-8 pb-10">
      <header className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <LogoTile size={48} />
          <h1 className="text-3xl font-extrabold tracking-tight">
            See<span className="text-accent-edge">Speak</span>
          </h1>
        </div>
        <p className="text-3xl leading-tight font-bold text-balance">{COPY.tagline}</p>
        <p className="flex items-center gap-2 text-lg font-bold text-accent-edge">
          <LockIcon />
          {LANDING.privacyTitle}
        </p>
      </header>
      <HomeStart />
      <LandingSections />
      <footer className="flex flex-col gap-2 border-t-2 border-line pt-6 text-sm leading-relaxed text-muted">
        <p>{COPY.optIn}</p>
        <p>{COPY.notTherapy}</p>
        <p>{COPY.privacy}</p>
      </footer>
    </main>
  );
}
