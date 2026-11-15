import Image from 'next/image';
import { SECTION_TITLE } from '@/components/PageHeader';
import { LANDING } from '@/content/landing';

/*
 * "Who it is for" on the home screen: Holly's eight photos (public/photos, rules in public/photos/CREDITS.md) in a
 * slow strip that loops sideways. It pauses while a pointer is on it or it has keyboard focus, and with reduced
 * motion it is a still grid. The photos are from Pinterest (credited in public/photos/CREDITS.md and docs/HACKATHON.md, not on screen). These are not our users: never put this
 * next to quotes, test numbers or "people who tried it".
 */

const PHOTOS = [
  { n: 2, w: 1000, h: 563, alt: 'A teacher and a boy sign to each other across a classroom desk.' },
  { n: 3, w: 683, h: 1024, alt: 'A smiling woman and a little girl make the same hand sign together.' },
  { n: 5, w: 2048, h: 1117, alt: 'A girl with a hearing device behind her ear listens in a classroom.' },
  {
    n: 4,
    w: 736,
    h: 1164,
    alt: 'Children in a classroom sign with a teacher, one of them in a wheelchair.',
  },
  { n: 6, w: 1000, h: 1500, alt: 'A girl and a woman sign to each other over an open book.' },
  { n: 1, w: 1080, h: 1920, alt: 'A poster of the sign language alphabet, one hand shape for each letter.' },
  { n: 7, w: 2048, h: 1536, alt: 'A signing hand lit in warm orange and blue light.' },
  { n: 8, w: 516, h: 363, alt: 'Two hands signing against a dark background.' },
] as const;

const CSS = `
.wp { overflow: hidden; mask-image: linear-gradient(90deg, transparent 0, #000 5%, #000 95%, transparent 100%); }
.wp-track { display: flex; width: max-content; }
@media (prefers-reduced-motion: no-preference) {
  .wp-track { animation: wp-scroll 70s linear infinite; }
  .wp:hover .wp-track, .wp:focus-within .wp-track { animation-play-state: paused; }
}
@keyframes wp-scroll { to { transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) {
  .wp { overflow: visible; mask-image: none; }
  .wp-track { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; width: auto; }
  .wp-track > li { padding: 0; }
  .wp-track img { width: 100%; object-fit: cover; }
  .wp-dup { display: none; }
}
`;

function Photo({ p, copy }: { p: (typeof PHOTOS)[number]; copy: boolean }) {
  return (
    <li className={`shrink-0 pr-3 ${copy ? 'wp-dup' : ''}`} aria-hidden={copy || undefined}>
      <figure className="flex flex-col gap-1">
        <Image
          src={`/photos/photo-${p.n}.jpg`}
          alt={copy ? '' : p.alt}
          width={p.w}
          height={p.h}
          sizes="300px"
          loading="lazy"
          className="h-40 w-auto rounded-xl border border-line bg-surface object-cover"
        />
      </figure>
    </li>
  );
}

export function WhoPhotos() {
  return (
    <section aria-labelledby="who-photos-heading" className="flex flex-col gap-3">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <h2 id="who-photos-heading" className={SECTION_TITLE}>
        {LANDING.whoTitle}
      </h2>
      <p className="text-[15px] text-muted">{LANDING.who.map((w) => w.title).join(' · ')}</p>
      {/* Focusable so a keyboard user can pause it too. */}
      <div className="wp -mx-4 px-4" tabIndex={0} role="region" aria-label="Photos: who See Speak AI is for">
        <ul className="wp-track">
          {PHOTOS.map((p) => (
            <Photo key={p.n} p={p} copy={false} />
          ))}
          {PHOTOS.map((p) => (
            <Photo key={`copy-${p.n}`} p={p} copy />
          ))}
        </ul>
      </div>
    </section>
  );
}
