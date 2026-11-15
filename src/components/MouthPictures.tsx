import type { TargetSound } from '@/lib/types';

interface MouthPicture {
  src: string;
  alt: string;
  caption: string;
}

/** Our own drawings in public/mouth/. Captions follow the cue steps in src/content/cues.ts. */
const BASE_PICTURES = {
  s: {
    side: {
      src: '/mouth/s-side.svg',
      alt: 'Drawing of a head from the side making "s". The teeth are close together, the lips are pulled back, and the tip of the tongue is raised just behind the top teeth without touching them. A thin arrow shows the air that comes out between the teeth.',
      caption: 'Side view: tongue tip just behind the top teeth',
    },
    front: {
      src: '/mouth/s-front.svg',
      alt: 'Drawing of a mouth from the front making "s". The lips are pulled back in a smile and the top and bottom teeth are almost touching.',
      caption: 'Front view: smile, teeth close together',
    },
  },
  sh: {
    side: {
      src: '/mouth/sh-side.svg',
      alt: 'Drawing of a head from the side making "sh". The lips are rounded and pushed forward, and the tongue is pulled back, with its tip lower than for "s". A thicker arrow shows a wider stream of air coming out through the lips.',
      caption: 'Side view: tongue pulled back, lips forward',
    },
    front: {
      src: '/mouth/sh-front.svg',
      alt: 'Drawing of a mouth from the front making "sh". The lips are rounded and pushed forward into a small round opening. Only the edge of the top teeth shows.',
      caption: 'Front view: lips rounded',
    },
  },
};

/** No separate drawings yet: "z" has the same mouth as "s", and "ch" ends in the "sh" mouth. */
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

export function MouthPictures({ sound }: { sound: TargetSound }) {
  const { side, front } = PICTURES[sound];

  return (
    <div className="grid grid-cols-2 gap-2">
      {[side, front].map((picture) => (
        <figure key={picture.src} className="rounded-2xl border-2 border-line bg-surface p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={picture.src} alt={picture.alt} width={240} height={240} className="h-auto w-full" />
          <figcaption className="mt-2 text-sm leading-snug font-semibold text-foreground">
            {picture.caption}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
