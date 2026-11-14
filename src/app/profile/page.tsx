'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { COPY } from '@/content/copy';
import { PROFILE_LIMITATIONS, pickTargets } from '@/lib/profile';
import { loadProfile, loadSettings, saveProfile, saveSettings } from '@/lib/store';
import type { HearingProfile, LingSound, TargetPick } from '@/lib/types';

const LING: LingSound[] = ['m', 'oo', 'ah', 'ee', 'sh', 's'];

const RISK_LABEL: Record<TargetPick['risk'], string> = {
  high: 'Practice this first',
  some: 'Worth practicing',
  low: 'You likely hear this one',
};

export default function ProfilePage() {
  const [answers, setAnswers] = useState<Partial<Record<LingSound, boolean>>>({});
  const [picks, setPicks] = useState<TargetPick[] | null>(null);
  const [showSigns, setShowSigns] = useState(false);

  // Browser storage is read only here, after the page is on screen.
  useEffect(() => {
    const id = setTimeout(() => {
      const saved = loadProfile();
      if (saved?.source === 'ling6' && saved.ling) {
        setAnswers(saved.ling);
        setPicks(pickTargets(saved));
      }
      setShowSigns(loadSettings().showSigns);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const complete = LING.every((s) => typeof answers[s] === 'boolean');

  function save() {
    if (!complete) return;
    const profile: HearingProfile = {
      source: 'ling6',
      ling: answers as Record<LingSound, boolean>,
      createdAt: new Date().toISOString(),
    };
    saveProfile(profile);
    setPicks(pickTargets(profile));
  }

  function toggleSigns(on: boolean) {
    setShowSigns(on);
    saveSettings({ ...loadSettings(), showSigns: on });
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-4">
      <header className="flex flex-col gap-2">
        <Link href="/" className="underline">
          Home
        </Link>
        <h1 className="text-3xl font-bold">Hearing profile</h1>
        <p>
          Have someone say each sound in a normal voice from about 1 metre away, with their mouth covered.
        </p>
        {/* TODO(ui lane): play the six sounds from the phone as an alternative to a helper. */}
        {/* TODO(tech lane): typed audiogram entry and audiogram photo reading go here. */}
      </header>

      <ul className="flex flex-col gap-4">
        {LING.map((sound) => (
          <li key={sound} className="flex flex-col gap-2 rounded-lg border-2 border-current p-3">
            <span className="text-2xl font-bold">&ldquo;{sound}&rdquo;</span>
            <div className="grid grid-cols-2 gap-2">
              {[true, false].map((heard) => {
                const selected = answers[sound] === heard;
                return (
                  <button
                    key={String(heard)}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setAnswers((a) => ({ ...a, [sound]: heard }))}
                    className={`min-h-14 rounded-lg border-2 border-current px-2 text-lg ${
                      selected ? 'font-bold underline' : ''
                    }`}
                  >
                    {selected ? '✓ ' : ''}
                    {heard ? 'Heard it' : 'Did not hear it'}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={save}
        disabled={!complete}
        className="min-h-14 rounded-lg border-2 border-current px-4 text-xl font-bold disabled:opacity-40"
      >
        Save profile
      </button>

      {picks && (
        <section className="flex flex-col gap-3" aria-label="Sounds to practice">
          <h2 className="text-2xl font-bold">Your sounds</h2>
          {picks.map((p) => (
            <div key={p.sound} className="flex flex-col gap-2 rounded-lg border-2 border-current p-3">
              <p className="text-xl font-bold">
                &ldquo;{p.sound}&rdquo;: {RISK_LABEL[p.risk]}
              </p>
              <p>{p.reason}</p>
              <Link
                href={`/practice?sound=${p.sound}`}
                className="block min-h-14 rounded-lg border-2 border-current px-4 py-3 text-center text-lg font-bold"
              >
                Practice this sound
              </Link>
            </div>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-2">
        <label className="flex min-h-14 items-center gap-3 text-lg">
          <input
            type="checkbox"
            className="h-6 w-6"
            checked={showSigns}
            onChange={(e) => toggleSigns(e.target.checked)}
          />
          Show sign cards
        </label>
        <p className="text-sm">{COPY.optIn}</p>
      </section>

      {PROFILE_LIMITATIONS.length > 0 && (
        <section className="flex flex-col gap-2 text-sm">
          <h2 className="text-lg font-bold">What this check cannot tell us</h2>
          <ul className="list-disc pl-5">
            {PROFILE_LIMITATIONS.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
