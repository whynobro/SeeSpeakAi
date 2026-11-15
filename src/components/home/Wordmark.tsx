'use client';

import { useEffect, useRef, useState } from 'react';

/*
 * Michael's "See Speak AI" wordmark (public/brand/seespeak-wordmark.png), shown in kingfisher colors:
 * the teal bird and "See" become kingfisher blue, the yellow beak and notes become orange. "Speak AI" stays navy.
 * The recolor runs once in the browser on a copy of the picture. Until it is ready (or if it cannot run),
 * the original picture shows, so the logo is never missing.
 */

const SRC = '/brand/seespeak-wordmark.png';
/** The wordmark without the wide white border around it, as a share of the picture (measured on the file). */
const CROP = { x: 0.04, y: 0.12, w: 0.92, h: 0.68 };

function hsl(r: number, g: number, b: number): [number, number, number] {
  const mx = Math.max(r, g, b),
    mn = Math.min(r, g, b),
    l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn,
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function rgb(h: number, s: number, l: number): [number, number, number] {
  const k = (n: number) => (n + h / 30) % 12,
    a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

/** The logo. Screen readers hear `label` ("SeeSpeak", the product name used in all screen text). */
export function Wordmark({ className = '', label = 'See Speak AI' }: { className?: string; label?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = SRC;
    img.onload = () => {
      const c = ref.current;
      if (!c) return;
      try {
        const ctx = c.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(
          img,
          img.width * CROP.x,
          img.height * CROP.y,
          img.width * CROP.w,
          img.height * CROP.h,
          0,
          0,
          c.width,
          c.height,
        );
        const px = ctx.getImageData(0, 0, c.width, c.height);
        const d = px.data;
        for (let i = 0; i < d.length; i += 4) {
          // White becomes see-through, keeping the soft edges.
          const a = Math.max(255 - d[i], 255 - d[i + 1], 255 - d[i + 2]) / 255;
          if (a < 0.02) {
            d[i + 3] = 0;
            continue;
          }
          const un = (v: number) => (v - 255 * (1 - a)) / a / 255;
          let [h, s, l] = hsl(un(d[i]), un(d[i + 1]), un(d[i + 2]));
          if (h > 140 && h < 200 && s > 0.2) {
            h = 203;
            s = Math.min(1, s * 1.15);
            l *= 0.92;
          } // teal to kingfisher blue
          else if (h > 30 && h < 65 && s > 0.3) {
            h = 24;
            s = Math.min(1, s * 1.05);
            l *= 0.97;
          } // yellow to orange
          const [r, g, b] = rgb(h, s, l);
          d[i] = r * 255;
          d[i + 1] = g * 255;
          d[i + 2] = b * 255;
          d[i + 3] = a * 255;
        }
        ctx.putImageData(px, 0, 0);
        setReady(true);
      } catch {
        // Keep the original picture.
      }
    };
  }, []);

  return (
    <span role="img" aria-label={label} className={`relative block aspect-[1000/246] ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- the plain picture is only the fallback under the canvas */}
      <img
        src={SRC}
        alt={label}
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full object-cover mix-blend-multiply ${ready ? 'invisible' : ''}`}
        style={{ objectPosition: '50% 45%' }}
      />
      <canvas
        ref={ref}
        width={1000}
        height={246}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
      />
    </span>
  );
}
