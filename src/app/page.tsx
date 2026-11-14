import { COPY } from '@/content/copy';
import { HomeStart } from '@/components/HomeStart';
import { LogoTile } from '@/components/ui';

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-8 px-4 pt-8 pb-10">
      <header className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <LogoTile size={48} />
          <h1 className="text-3xl font-extrabold tracking-tight">
            See<span className="text-violet">Speak</span>
          </h1>
        </div>
        <p className="text-3xl leading-tight font-bold text-balance">{COPY.tagline}</p>
      </header>
      <HomeStart />
      <footer className="flex flex-col gap-2 border-t-2 border-line pt-6 text-sm leading-relaxed text-muted">
        <p>{COPY.optIn}</p>
        <p>{COPY.notTherapy}</p>
        <p>{COPY.privacy}</p>
      </footer>
    </main>
  );
}
