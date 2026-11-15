'use client';

import { useState } from 'react';
import type { TargetSound } from '@/lib/types';

/*
 * A short "how to say it" video from a speech-language pathologist, one per scored sound.
 * Videos: Peachie Speechie (Meredith Avren, SLP), free on YouTube, embedding allowed by the owner.
 * Listed in the tools and content disclosure in docs/HACKATHON.md.
 *
 * Privacy: nothing loads from YouTube until the learner taps play (no thumbnail either, since that would
 * also contact Google). Then it plays from youtube-nocookie.com, YouTube's privacy-enhanced embed.
 * Captions: these videos only have YouTube's automatic captions, so they are switched on by default and
 * the screen says they may have mistakes. The checked steps from src/content/cues.ts sit under the video.
 */
const VIDEOS: Record<TargetSound, { id: string; title: string; minutes: string }> = {
  s: { id: '_K_-9P3aKsE', title: 'How to say the S sound', minutes: '3 min' },
  sh: { id: 'ZM_eLOVlIA8', title: 'How to say the SH sound', minutes: '3 min' },
  z: { id: '1tfDIQCYOkc', title: 'How to say the Z sound', minutes: '3 min' },
  ch: { id: 'wTdQzljjsf0', title: 'How to say the CH sound', minutes: '3 min' },
};

const CREDIT = 'Peachie Speechie (Meredith Avren, speech-language pathologist)';

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width={28} height={28} aria-hidden="true">
      <path d="M8 5.5v13l10.5-6.5L8 5.5Z" fill="currentColor" />
    </svg>
  );
}

export function SoundVideo({ sound }: { sound: TargetSound }) {
  const video = VIDEOS[sound];
  // Remember which sound's video was opened, so switching sound shows the play card again.
  const [playing, setPlaying] = useState<TargetSound | null>(null);
  const open = playing === sound;

  const src =
    `https://www.youtube-nocookie.com/embed/${video.id}` +
    '?autoplay=1&cc_load_policy=1&cc_lang_pref=en&hl=en&rel=0&playsinline=1';

  return (
    <figure className="flex flex-col gap-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-foreground">
        {open ? (
          <iframe
            src={src}
            title={`${video.title}, by ${CREDIT}. Captions on.`}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(sound)}
            className="group absolute inset-0 flex flex-col items-center justify-center gap-3 bg-accent-edge p-4 text-center text-accent-ink"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-ink text-accent-edge transition-transform duration-150 group-hover:scale-105 group-active:scale-95">
              <PlayIcon />
            </span>
            <span className="text-lg leading-snug font-bold">Watch a speech therapist show it</span>
            <span className="text-sm opacity-90">{video.minutes} · captions on · plays from YouTube</span>
          </button>
        )}
      </div>
      <figcaption className="text-sm leading-relaxed text-muted">
        Video: {CREDIT}. The captions are made by YouTube automatically and may have mistakes. The steps below
        are checked.
      </figcaption>
    </figure>
  );
}
