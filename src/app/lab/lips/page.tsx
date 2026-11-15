'use client';

import { useState } from 'react';
import { useLipTracker } from '@/hooks/useLipTracker';
import { lipHint, summarizeLips } from '@/lib/lips/features';
import type { LipSummary } from '@/lib/lips/types';

const fmt = (n: number | undefined, digits = 2): string => (n === undefined ? '-' : n.toFixed(digits));

export default function LipLabPage() {
  const { videoRef, status, error, latest, start, stop } = useLipTracker();
  const [summary, setSummary] = useState<LipSummary | null>(null);
  const [copied, setCopied] = useState(false);

  const watching = status === 'watching';
  const busy = status === 'starting';

  const onToggle = () => {
    if (watching) {
      setSummary(summarizeLips(stop()));
    } else {
      setSummary(null);
      setCopied(false);
      void start();
    }
  };

  const hintS = summary ? lipHint('s', summary) : null;
  const hintSh = summary ? lipHint('sh', summary) : null;

  const onCopy = async () => {
    if (!summary) return;
    const text = JSON.stringify({ summary, hintS, hintSh }, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const rows: [string, string][] = [
    ['faceSeen', latest ? String(latest.faceSeen) : '-'],
    ['rounded', fmt(latest?.rounded)],
    ['spread', fmt(latest?.spread)],
    ['jawOpen', fmt(latest?.jawOpen)],
  ];

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 p-4">
      <p className="text-sm">
        Lip lab: for tuning. The camera picture stays on this device and is never saved.
      </p>

      <button
        type="button"
        onClick={onToggle}
        disabled={busy}
        className="min-h-16 rounded-2xl bg-blue-700 px-6 text-2xl font-bold text-white disabled:opacity-60"
      >
        {busy ? 'Starting...' : watching ? 'Stop' : 'Start'}
      </button>

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
        className={`aspect-[4/3] w-48 -scale-x-100 rounded-xl bg-black ${watching ? '' : 'hidden'}`}
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

      {summary && (
        <section className="flex flex-col gap-4">
          <pre className="overflow-x-auto rounded-xl border border-current/20 p-3 font-mono text-sm">
            {JSON.stringify(summary, null, 2)}
          </pre>
          <p className="text-sm">
            Hint for &quot;s&quot;: {hintS ?? 'none'}
            <br />
            Hint for &quot;sh&quot;: {hintSh ?? 'none'}
          </p>
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
