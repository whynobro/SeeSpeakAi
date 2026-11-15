'use client';

import { useEffect, useRef, useState } from 'react';
import { useLipTracker } from '@/hooks/useLipTracker';
import {
  MIN_SEPARATION,
  baselineFrom,
  leanOf,
  lipHint,
  lipSeparation,
  shapeAgainst,
  summarizeLips,
} from '@/lib/lips/features';
import type { LipSummary } from '@/lib/lips/types';
import { getLabel, isLabSharing, setLabSharing, shareLipCapture } from '@/lib/testlog';

/** How long each sound is held while the lips are measured. */
const CAPTURE_MS = 2000;

type Sound = 's' | 'sh';
type Saved = 'saved' | 'failed' | 'off';

const fmt = (n: number | undefined, digits = 2): string => (n === undefined ? '-' : n.toFixed(digits));

const SOUND_TEXT: Record<Sound, { button: string; hold: string }> = {
  s: { button: 'Hold sss (smile)', hold: 'Hold "sss" now, with a smile' },
  sh: { button: 'Hold shh (round lips)', hold: 'Hold "shh" now, with round lips' },
};

export default function LipLabPage() {
  const { videoRef, status, error, latest, start, stop } = useLipTracker();
  const [captures, setCaptures] = useState<Partial<Record<Sound, LipSummary>>>({});
  const [saved, setSaved] = useState<Partial<Record<Sound, Saved>>>({});
  const [active, setActive] = useState<Sound | null>(null);
  const [holding, setHolding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [labOn, setLabOn] = useState(true);
  const [label, setLabel] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Saved choices are read after the first paint, never during render.
  useEffect(() => {
    const t = setTimeout(() => {
      setLabOn(isLabSharing());
      setLabel(getLabel());
    }, 0);
    return () => {
      clearTimeout(t);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function onCapture(sound: Sound) {
    if (active) return;
    setActive(sound);
    setCopied(false);
    setCaptures((c) => ({ ...c, [sound]: undefined }));
    setSaved((s) => ({ ...s, [sound]: undefined }));
    const ok = await start();
    if (!ok) {
      setActive(null);
      return;
    }
    setHolding(true);
    timer.current = setTimeout(async () => {
      const summary = summarizeLips(stop());
      setHolding(false);
      setActive(null);
      setCaptures((c) => ({ ...c, [sound]: summary }));
      // Numbers only: the sound that was held and the lip numbers. Never a picture.
      if (!isLabSharing()) {
        setSaved((s) => ({ ...s, [sound]: 'off' }));
        return;
      }
      const stored = await shareLipCapture(sound, summary);
      setSaved((s) => ({ ...s, [sound]: stored ? 'saved' : 'failed' }));
    }, CAPTURE_MS);
  }

  const sCap = captures.s;
  const shCap = captures.sh;
  const separation = sCap && shCap ? lipSeparation(sCap, shCap) : null;
  const baseline = sCap ? baselineFrom(sCap) : null;

  async function onCopy() {
    const text = JSON.stringify(
      {
        captures,
        separation,
        minSeparation: MIN_SEPARATION,
        hintS: sCap ? lipHint('s', sCap) : null,
        hintSh: shCap ? lipHint('sh', shCap) : null,
      },
      null,
      2,
    );
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const rows: [string, string][] = [
    ['faceSeen', latest ? String(latest.faceSeen) : '-'],
    ['rounded', fmt(latest?.rounded)],
    ['spread', fmt(latest?.spread)],
    ['jawOpen', fmt(latest?.jawOpen)],
  ];

  const columns: { sound: Sound; cap: LipSummary | undefined }[] = [
    { sound: 's', cap: sCap },
    { sound: 'sh', cap: shCap },
  ];

  const compare: [string, (c: LipSummary, sound: Sound) => string][] = [
    ['frames', (c) => String(c.frames)],
    ['faceSeenShare', (c) => fmt(c.faceSeenShare)],
    ['rounded', (c) => fmt(c.rounded, 3)],
    ['spread', (c) => fmt(c.spread, 3)],
    ['lean (rounded - spread)', (c) => fmt(leanOf(c.rounded, c.spread), 3)],
    ['jawOpen', (c) => fmt(c.jawOpen, 3)],
    ['roundedEnd', (c) => fmt(c.roundedEnd, 3)],
    ['spreadEnd', (c) => fmt(c.spreadEnd, 3)],
    ['shape (fixed cutoffs)', (c) => c.shape],
    ['shapeEnd', (c) => c.shapeEnd],
    ['shape vs your own smile', (c) => (baseline ? shapeAgainst(c, baseline) : '-')],
    ['hint for this sound', (c, sound) => lipHint(sound, c) ?? 'none (lips match)'],
  ];

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 p-4">
      <p className="text-sm">
        Lip lab: for tuning. The camera picture stays on this device and is never saved or sent.
      </p>

      <section className="flex flex-col gap-3 rounded-xl border-2 border-current p-3">
        <p className="font-bold">Lip captures on this page are saved for the SeeSpeak team.</p>
        <p className="text-sm">
          Each time you hold a sound, the lip shape numbers from those 2 seconds (how rounded, how pulled
          back, how open) and which sound you were holding are saved so we can tune the lip tips. They are
          copied to our public project page on GitHub. Camera pictures are never saved or sent, and there is
          no name unless you type a nickname on the main lab page ({label ? `now: ${label}` : 'none set'}).
        </p>
        <label className="flex min-h-12 items-center gap-3 font-bold">
          <input
            type="checkbox"
            checked={labOn}
            onChange={(e) => {
              setLabOn(e.target.checked);
              setLabSharing(e.target.checked);
            }}
            className="h-6 w-6"
          />
          Save my lip captures (same switch as the main lab page)
        </label>
      </section>

      <p className="text-sm">
        Press a button, wait for the camera, then hold that sound for 2 seconds. Do both, then compare.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(['s', 'sh'] as const).map((sound) => (
          <button
            key={sound}
            type="button"
            onClick={() => onCapture(sound)}
            disabled={active !== null}
            className="min-h-16 rounded-2xl bg-blue-700 px-4 text-xl font-bold text-white disabled:opacity-60"
          >
            {active === sound && !holding ? 'Starting camera...' : SOUND_TEXT[sound].button}
          </button>
        ))}
      </div>

      <p role="status" className="min-h-8 text-xl font-bold">
        {holding && active ? SOUND_TEXT[active].hold : ''}
      </p>

      {error && (
        <p role="alert" className="rounded-xl bg-red-700 p-4 font-bold text-white">
          {error}
        </p>
      )}

      <video
        ref={videoRef}
        muted
        playsInline
        aria-label="Camera preview, mirrored"
        className={`aspect-[4/3] w-48 -scale-x-100 rounded-xl bg-black ${status === 'watching' ? '' : 'hidden'}`}
      />

      <table className="w-full font-mono text-sm">
        <tbody>
          {rows.map(([name, value]) => (
            <tr key={name} className="border-b border-current/20">
              <th scope="row" className="py-1 text-left font-normal">
                {name}
              </th>
              <td className="py-1 text-right">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {(sCap || shCap) && (
        <section className="flex flex-col gap-4">
          <table className="w-full font-mono text-sm">
            <thead>
              <tr className="border-b-2 border-current/40">
                <th className="py-1 text-left font-normal" />
                {columns.map(({ sound }) => (
                  <th key={sound} className="py-1 text-right">
                    {sound === 's' ? 'sss (smile)' : 'shh (round)'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compare.map(([name, get]) => (
                <tr key={name} className="border-b border-current/20">
                  <th scope="row" className="py-1 text-left font-normal">
                    {name}
                  </th>
                  {columns.map(({ sound, cap }) => (
                    <td key={sound} className="py-1 text-right">
                      {cap ? get(cap, sound) : '-'}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <th scope="row" className="py-1 text-left font-normal">
                  saved for the team
                </th>
                {columns.map(({ sound }) => (
                  <td key={sound} className="py-1 text-right">
                    {saved[sound] ?? '-'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          {separation !== null ? (
            <p className="font-bold">
              Separation (sh lean minus s lean): {fmt(separation, 3)}.{' '}
              {separation >= MIN_SEPARATION
                ? `At least ${MIN_SEPARATION}: the two sounds can be told apart on this face.`
                : `Under ${MIN_SEPARATION}: the lips barely differ on this face, so lip tips would be unreliable here.`}
            </p>
          ) : (
            <p className="text-sm">Capture both sounds to see how far apart they are.</p>
          )}
          <button
            type="button"
            onClick={onCopy}
            className="min-h-12 rounded-2xl border-2 border-current px-6 text-lg font-bold"
          >
            {copied ? 'Copied' : 'Copy results'}
          </button>
        </section>
      )}
    </main>
  );
}
