'use client';

import { useMemo, useState } from 'react';
import { SoundMeter } from '@/components/SoundMeter';
import { WORD_BANK } from '@/content/words';
import { useSoundMeter } from '@/hooks/useSoundMeter';
import { describeRuns, scoreAttempt } from '@/lib/scoring';
import { ShareTests } from './ShareTests';
import type { AttemptScore, FrameFeatures, PracticeWord, TargetSound, WordPosition } from '@/lib/types';

const YES = (b: boolean | null) => (b === null ? 'n/a' : b ? 'pass' : 'FAIL');

function fmt(n: number | null | undefined, digits = 3): string {
  return n === null || n === undefined ? '-' : n.toFixed(digits);
}

export default function LabPage() {
  const meter = useSoundMeter();
  const [frames, setFrames] = useState<FrameFeatures[] | null>(null);
  const [target, setTarget] = useState<TargetSound>('s');
  const [position, setPosition] = useState<WordPosition>('end');
  // The practice word being tested, or '' for "just the sound".
  const [picked, setPicked] = useState('');
  const [score, setScore] = useState<AttemptScore | null>(null);
  const [copied, setCopied] = useState(false);
  const [sampleRate, setSampleRate] = useState<number | null>(null);

  const listening = meter.status === 'listening';
  const busy = meter.status === 'starting';

  async function onToggle() {
    if (listening) {
      setSampleRate(meter.sampleRate);
      setFrames(meter.stop());
      setScore(null);
    } else {
      setFrames(null);
      setScore(null);
      await meter.start();
    }
  }

  const word = useMemo<PracticeWord>(
    () => ({
      id: picked || 'lab-word',
      text: picked || (target === 's' ? 'sip' : 'ship'),
      target,
      position,
      baseWord: null,
      contrastWord: null,
      sign: null,
    }),
    [target, position, picked],
  );

  // Picking a practice word sets the sound and where it sits, so the try is scored the right way.
  function onPick(id: string) {
    setPicked(id);
    const known = WORD_BANK.find((w) => w.id === id);
    if (known) {
      setTarget(known.target);
      setPosition(known.position);
    }
    setScore(null);
  }

  function onScore() {
    if (!frames) return;
    setScore(scoreAttempt(frames, word));
    setCopied(false);
  }

  // Short plain text a person can read aloud or paste into a chat.
  const summary = useMemo(() => {
    if (!frames) return '';
    const runs = describeRuns(frames, word);
    const lines = [
      `sampleRate: ${sampleRate ?? '-'} Hz, frames: ${frames.length}, scored as: ${target} at ${position}`,
      runs.length === 0 ? 'no hiss runs found' : `hiss runs found: ${runs.length}`,
      ...runs.map(
        (r, i) =>
          `run ${i + 1}: start ${fmt(r.startMs, 0)} ms, length ${fmt(r.lengthMs, 0)} ms, ` +
          `centroid ${fmt(r.meanCentroidHz, 0)} Hz, position ${fmt(r.meanPosition, 2)}, ` +
          `peak level ${fmt(r.peakLevel, 3)}, held ${fmt(r.sustainedMs, 0)} ms; ` +
          `long enough ${YES(r.passed.longEnough)}, held ${YES(r.passed.held)}, ` +
          `in place ${YES(r.passed.inPlace)}`,
      ),
    ];
    return lines.join('\n');
  }, [frames, word, sampleRate, target, position]);

  async function onCopy() {
    const text = `${summary}\n\n${JSON.stringify(score ?? scoreAttempt(frames ?? [], word), null, 2)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const rows: [string, string][] = [
    ['sampleRate', meter.sampleRate === null ? '-' : `${meter.sampleRate} Hz`],
    ['level', fmt(meter.latest?.level)],
    ['hissLevel', fmt(meter.latest?.hissLevel)],
    ['hissRatio', fmt(meter.latest?.hissRatio)],
    ['centroidHz', fmt(meter.latest?.centroidHz, 0)],
    ['hissing', meter.reading ? String(meter.reading.hissing) : '-'],
    ['position', fmt(meter.reading?.position)],
  ];

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 p-4">
      <p className="text-sm">Lab: for tuning. Audio stays on this device.</p>

      <label className="flex flex-col gap-1 font-bold">
        Word to test
        <select
          value={picked}
          onChange={(e) => onPick(e.target.value)}
          className="min-h-12 rounded-lg border-2 border-current bg-transparent px-2"
        >
          <option value="">Just a sound (set &quot;Score as&quot; after Stop)</option>
          {(
            [
              ['s', 'end'],
              ['s', 'start'],
              ['s', 'middle'],
              ['sh', 'start'],
              ['sh', 'end'],
              ['sh', 'middle'],
            ] as const
          ).map(([sound, where]) => {
            const words = WORD_BANK.filter((w) => w.target === sound && w.position === where);
            if (words.length === 0) return null;
            return (
              <optgroup key={`${sound}-${where}`} label={`"${sound}" at the ${where}`}>
                {words.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.baseWord ? `${w.text} (try it as "${w.baseWord}" too)` : w.text}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </label>

      <button
        type="button"
        onClick={onToggle}
        disabled={busy}
        className="min-h-16 rounded-2xl bg-blue-700 px-6 text-2xl font-bold text-white disabled:opacity-60"
      >
        {busy ? 'Starting...' : listening ? 'Stop' : 'Start'}
      </button>

      {meter.error && (
        <p role="alert" className="rounded-xl bg-red-700 p-4 font-bold text-white">
          {meter.error}
        </p>
      )}

      <SoundMeter reading={meter.reading} />

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

      {frames && (
        <section className="flex flex-col gap-4">
          <p className="font-mono text-sm">Frames captured: {frames.length}</p>
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1 text-sm font-bold">
              Score as
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as TargetSound)}
                className="min-h-12 rounded-lg border-2 border-current bg-transparent px-2"
              >
                <option value="s">s</option>
                <option value="sh">sh</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-bold">
              Position
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as WordPosition)}
                className="min-h-12 rounded-lg border-2 border-current bg-transparent px-2"
              >
                <option value="start">start</option>
                <option value="middle">middle</option>
                <option value="end">end</option>
              </select>
            </label>
            <button
              type="button"
              onClick={onScore}
              className="min-h-12 rounded-xl bg-blue-700 px-5 font-bold text-white"
            >
              Score
            </button>
          </div>
          <pre className="overflow-x-auto rounded-xl bg-black/10 p-3 text-xs dark:bg-white/10">{summary}</pre>
          {score && (
            <pre className="overflow-x-auto rounded-xl bg-black/10 p-3 text-xs dark:bg-white/10">
              {JSON.stringify(score, null, 2)}
            </pre>
          )}
          <button
            type="button"
            onClick={onCopy}
            className="min-h-12 rounded-xl border-2 border-current px-5 font-bold"
          >
            {copied ? 'Copied' : 'Copy results'}
          </button>
        </section>
      )}

      <ShareTests word={word} frames={frames} sampleRate={sampleRate} />
    </main>
  );
}
