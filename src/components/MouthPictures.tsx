import type { TargetSound } from '@/lib/types';

interface MouthPicture {
  src: string;
  alt: string;
  caption: string;
}

/** Our own drawings in public/mouth/. Captions follow the cue steps in src/content/cues.ts. */
const PICTURES: Record<TargetSound, { side: MouthPicture; front: MouthPicture }> = {
  s: {
    side: {
      src: '/mouth/s-side.svg',
      alt: 'Drawing of a head from the side making "s". The teeth are close together, the lips are pulled back, and the tip of the tongue is raised just behind the top teeth without touching them. A thin line of air comes out between the teeth.',
      caption: 'Side view: tongue tip just behind the top teeth',
    },
    front: {
      src: '/mouth/s-front.svg',
      alt: 'Drawing of a mouth from the front making "s". The lips are pulled back in a smile and the top and bottom teeth are close together, with a small gap in the middle for the air.',
      caption: 'Front view: smile, teeth close together',
    },
  },
  sh: {
    side: {
      src: '/mouth/sh-side.svg',
      alt: 'Drawing of a head from the side making "sh". The lips are rounded and pushed forward, and the tongue is pulled back with its middle raised toward the roof of the mouth. A wider stream of air comes out through the lips.',
      caption: 'Side view: tongue pulled back, lips forward',
    },
    front: {
      src: '/mouth/sh-front.svg',
      alt: 'Drawing of a mouth from the front making "sh". The lips are rounded and pushed forward into a round opening. Only the edges of the teeth show, and the opening for the air is wider.',
      caption: 'Front view: lips rounded',
    },
  },
};

export function MouthPictures({ sound }: { sound: TargetSound }) {
  const { side, front } = PICTURES[sound];

  return (
    <div className="grid grid-cols-2 gap-3">
      {[side, front].map((picture) => (
        <figure key={picture.src} className="bg-surface border-line rounded-2xl border p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={picture.src} alt={picture.alt} width={240} height={240} className="h-auto w-full" />
          <figcaption className="text-foreground mt-2 text-sm leading-snug">{picture.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}
