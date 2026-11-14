import { COPY } from '@/content/copy';
import { HomeStart } from '@/components/HomeStart';

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-8 pb-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-5xl font-bold tracking-tight">SeeSpeak</h1>
        <p className="text-xl text-muted">{COPY.tagline}</p>
      </header>
      <HomeStart />
      <footer className="flex flex-col gap-2 border-t border-line pt-4 text-sm text-muted">
        <p>{COPY.optIn}</p>
        <p>{COPY.notTherapy}</p>
        <p>{COPY.privacy}</p>
      </footer>
    </main>
  );
}
