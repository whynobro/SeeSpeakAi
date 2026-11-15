'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { StarIcon } from './Icons';

/** How long the pieces fly, in milliseconds. After that they are removed from the page. */
const LENGTH_MS = 1700;
const BLOBS = 16;
const SPARKLES = 10;
/** The sound map's colors (see SoundMap): soft two-tone blobs. */
const BLOB_FILLS = [
  'radial-gradient(circle at 35% 30%, #7cc4ff, #3b7de0)',
  'radial-gradient(circle at 35% 30%, #ffc39a, #f4728a)',
  'radial-gradient(circle at 35% 30%, #a8ecc4, #22a99a)',
  'radial-gradient(circle at 35% 30%, #f3bdf6, #9b7bf0)',
];
const SPARKLE_COLORS = ['text-close', 'text-violet', 'text-accent'];

/** Each piece gets a fixed direction and distance from its number, so every render draws the same burst. */
const BURST = Array.from({ length: BLOBS }, (_, i) => {
  const angle = (i * 137.5 * Math.PI) / 180; // the golden angle spreads the pieces evenly
  const reach = 60 + ((i * 37) % 100);
  const size = 10 + ((i * 7) % 18);
  return {
    style: {
      width: size,
      height: size,
      background: BLOB_FILLS[i % BLOB_FILLS.length],
      '--dx': `${Math.round(Math.cos(angle) * reach)}px`,
      '--dy': `${Math.round(Math.sin(angle) * reach * 0.6 - 24)}px`,
      animationDelay: `${(i % 6) * 35}ms`,
    } as CSSProperties,
  };
});

/** Four-point sparkles that blink on around the burst. */
const TWINKLES = Array.from({ length: SPARKLES }, (_, i) => {
  const angle = ((i * 97 + 20) * Math.PI) / 180;
  const reach = 50 + ((i * 53) % 110);
  const size = 10 + ((i * 5) % 12);
  return {
    color: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
    style: {
      width: size,
      height: size,
      marginLeft: Math.round(Math.cos(angle) * reach),
      marginTop: Math.round(Math.sin(angle) * reach * 0.55 - 10),
      animationDelay: `${150 + i * 90}ms`,
    } as CSSProperties,
  };
});

/** The still burst for people who asked for less motion: a few stars in the top right corner. */
const STARS = [
  { place: 'top-1 right-9', size: 'h-7 w-7', color: 'text-accent' },
  { place: 'top-9 right-1', size: 'h-5 w-5', color: 'text-violet-edge' },
  { place: 'top-12 right-11', size: 'h-4 w-4', color: 'text-hit' },
  { place: 'top-0 right-1', size: 'h-3 w-3', color: 'text-accent-edge' },
];

/**
 * A short burst of soft color blobs and sparkles for a passed level (the sound map's colors). Decorative only: the "Level passed" words and star carry the news.
 * It fills its nearest `relative` parent and is clipped to it, so it never covers the buttons below.
 * It never takes a tap. With "reduce motion" on, a still group of stars shows instead.
 */
export function Confetti() {
  const [flying, setFlying] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setFlying(false), LENGTH_MS + 250);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes ss-confetti-fly {
          0% { transform: translate(0, 0) scale(0.3); opacity: 0; }
          15% { opacity: 1; }
          55% { transform: translate(var(--dx), var(--dy)) scale(1); opacity: 1; }
          100% { transform: translate(calc(var(--dx) * 1.15), calc(var(--dy) + 70px)) scale(0.85); opacity: 0; }
        }
        @keyframes ss-sparkle {
          0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; }
          45% { transform: scale(1) rotate(45deg); opacity: 1; }
        }
        .ss-confetti-piece { animation: ss-confetti-fly ${LENGTH_MS}ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        .ss-sparkle { animation: ss-sparkle 800ms ease-in-out both; }
        .ss-confetti-still { display: none; }
        @media (prefers-reduced-motion: reduce) {
          .ss-confetti-piece, .ss-sparkle { display: none; animation: none; }
          .ss-confetti-still { display: block; }
        }
      `}</style>
      {flying &&
        BURST.map((piece, i) => (
          <span
            key={i}
            style={piece.style}
            className="ss-confetti-piece absolute top-14 left-1/2 rounded-full"
          />
        ))}
      {flying &&
        TWINKLES.map((t, i) => (
          <svg
            key={`s${i}`}
            viewBox="0 0 24 24"
            style={t.style}
            className={`ss-sparkle absolute top-14 left-1/2 ${t.color}`}
          >
            <path
              fill="currentColor"
              d="M12 0c1 7 4 10 12 12-8 2-11 5-12 12-1-7-4-10-12-12 8-2 11-5 12-12z"
            />
          </svg>
        ))}
      <div className="ss-confetti-still">
        {STARS.map((star) => (
          <span key={star.place} className={`absolute ${star.place} ${star.color}`}>
            <StarIcon className={star.size} />
          </span>
        ))}
      </div>
    </div>
  );
}
