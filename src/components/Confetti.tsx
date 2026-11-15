'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { StarIcon } from './Icons';

/** How long the pieces fly, in milliseconds. After that they are removed from the page. */
const LENGTH_MS = 1500;
const PIECES = 30;
const COLORS = ['bg-accent', 'bg-violet', 'bg-hit', 'bg-close'];

/** Each piece gets a fixed direction and distance from its number, so every render draws the same burst. */
const BURST = Array.from({ length: PIECES }, (_, i) => {
  const angle = (i * 137.5 * Math.PI) / 180; // the golden angle spreads the pieces evenly
  const reach = 70 + ((i * 37) % 90);
  return {
    color: COLORS[i % COLORS.length],
    wide: i % 3 === 0,
    style: {
      '--dx': `${Math.round(Math.cos(angle) * reach)}px`,
      '--dy': `${Math.round(Math.sin(angle) * reach * 0.6 - 24)}px`,
      '--turn': `${(i % 2 === 0 ? 1 : -1) * (180 + ((i * 53) % 360))}deg`,
      animationDelay: `${(i % 6) * 30}ms`,
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
 * A short burst of confetti for a passed level. Decorative only: the "Level passed" words and star carry the news.
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
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          55% { transform: translate(var(--dx), var(--dy)) rotate(var(--turn)); opacity: 1; }
          100% { transform: translate(calc(var(--dx) * 1.15), calc(var(--dy) + 90px)) rotate(calc(var(--turn) * 1.5)); opacity: 0; }
        }
        .ss-confetti-piece { animation: ss-confetti-fly ${LENGTH_MS}ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        .ss-confetti-still { display: none; }
        @media (prefers-reduced-motion: reduce) {
          .ss-confetti-piece { display: none; animation: none; }
          .ss-confetti-still { display: block; }
        }
      `}</style>
      {flying &&
        BURST.map((piece, i) => (
          <span
            key={i}
            style={piece.style}
            className={`ss-confetti-piece absolute top-14 left-1/2 rounded-[2px] ${piece.wide ? 'h-1.5 w-3' : 'h-2 w-2'} ${piece.color}`}
          />
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
