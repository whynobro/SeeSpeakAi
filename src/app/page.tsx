import Link from 'next/link';
import { COPY } from '@/content/copy';

const STEPS = [
  { href: '/profile', label: '1. Hearing profile' },
  { href: '/practice', label: '2. Practice' },
  { href: '/progress', label: '3. Progress' },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-4">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold">SeeSpeak</h1>
        <p className="text-xl">{COPY.tagline}</p>
      </header>
      <nav className="flex flex-col gap-3">
        {STEPS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="block rounded-lg border-2 border-current px-4 py-5 text-xl font-bold"
          >
            {s.label}
          </Link>
        ))}
      </nav>
      <div className="flex flex-col gap-2 text-sm">
        <p>{COPY.optIn}</p>
        <p>{COPY.notTherapy}</p>
        <p>{COPY.privacy}</p>
      </div>
    </main>
  );
}
