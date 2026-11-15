import type { TargetSound } from '@/lib/types';

interface MouthPicture {
  src: string;
  alt: string;
  caption: string;
}

/** Realistic pictures in public/mouth/ (made with ChatGPT image generation, Nov 14). Captions follow the cue steps in src/content/cues.ts. */
const BASE_PICTURES = {
  s: {
    side: {
      src: '/mouth/s-side.jpg',
      alt: 'Realistic cut-away illustration of a head from the side, making "s". The teeth are close together, the lips are pulled back, and the tip of the tongue is raised just behind the top teeth without touching them. A thin blue arrow shows the air that comes out between the teeth.',
      caption: 'Side view: tongue tip just behind the top teeth',
    },
    front: {
      src: '/mouth/s-front.jpg',
      alt: 'Photo-style picture of a mouth from the front, making "s". The lips are pulled back in a smile and the top and bottom teeth are almost touching.',
      caption: 'Front view: smile, teeth close together',
    },
  },
  sh: {
    side: {
      src: '/mouth/sh-side.jpg',
      alt: 'Realistic cut-away illustration of a head from the side, making "sh". The lips are rounded and pushed forward, and the tongue is pulled back, with its tip lower than for "s". A wider blue arrow shows a wider stream of air coming out through the lips.',
      caption: 'Side view: tongue pulled back, lips forward',
    },
    front: {
      src: '/mouth/sh-front.jpg',
      alt: 'Photo-style picture of a mouth from the front, making "sh". The lips are rounded and pushed forward into a small round opening. Only the edge of the top teeth shows.',
      caption: 'Front view: lips rounded',
    },
  },
};

/** No separate pictures yet: "z" has the same mouth as "s", and "ch" ends in the "sh" mouth. */
const PICTURES: Record<TargetSound, { side: MouthPicture; front: MouthPicture }> = {
  ...BASE_PICTURES,
  z: {
    side: {
      ...BASE_PICTURES.s.side,
      alt: `${BASE_PICTURES.s.side.alt} The "z" uses the same mouth as "s", with the voice turned on.`,
      caption: 'Side view: same as "s", voice on',
    },
    front: {
      ...BASE_PICTURES.s.front,
      alt: `${BASE_PICTURES.s.front.alt} The "z" uses the same mouth as "s", with the voice turned on.`,
      caption: 'Front view: same as "s", voice on',
    },
  },
  ch: {
    side: {
      ...BASE_PICTURES.sh.side,
      alt: `${BASE_PICTURES.sh.side.alt} The "ch" starts with the tongue up like "t", then lets go into this "sh" shape.`,
      caption: 'Side view: starts like "t", ends like "sh"',
    },
    front: {
      ...BASE_PICTURES.sh.front,
      alt: `${BASE_PICTURES.sh.front.alt} The "ch" ends in this shape, after a quick "t".`,
      caption: 'Front view: ends with lips rounded',
    },
  },
};

/**
 * `only` shows one view (used next to the lip camera). Without it, both views show.
 * `label` (with `only`) lays the one picture out as a compact row: a small picture, then the label and caption.
 */
export function MouthPictures({
  sound,
  only,
  label,
}: {
  sound: TargetSound;
  only?: 'front' | 'side';
  label?: string;
}) {
  const { side, front } = PICTURES[sound];
  const shown = only === 'front' ? [front] : only === 'side' ? [side] : [side, front];

  if (only && label) {
    const picture = shown[0];
    return (
      <figure className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2 pr-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={picture.src} alt={picture.alt} width={240} height={240} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
        <figcaption className="flex min-w-0 flex-col gap-0.5">
          <span className="text-base font-bold">{label}</span>
          <span className="text-sm leading-snug text-muted">{picture.caption}</span>
        </figcaption>
      </figure>
    );
  }

  return (
    <div className={`grid gap-2 ${only ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {shown.map((picture) => (
        <figure key={picture.src} className="rounded-xl border border-line bg-surface p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={picture.src} alt={picture.alt} width={240} height={240} className="aspect-square h-auto w-full rounded-lg object-cover" />
          <figcaption className="mt-2 text-sm leading-snug font-semibold text-foreground">
            {picture.caption}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
