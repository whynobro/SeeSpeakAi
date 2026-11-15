import type { AudiogramHz } from '@/lib/types';
import { AUDIOGRAM_FIELDS } from './AudiogramFields';
import { CheckCircleIcon, LockIcon } from './Icons';

/*
 * "Before you send": exactly what leaves the phone, shown live while the form is filled in.
 * TODO: when Michael's removeNames (#50) lands, show the cleaned notes here and send those.
 * Until then the notes are shown and sent exactly as typed, with a reminder to leave names out.
 */
export function SendSummary({
  sounds,
  notes,
  thresholds,
  ageGroup,
  interests,
}: {
  sounds: string[];
  notes: string;
  thresholds: Partial<Record<AudiogramHz, number>> | null;
  ageGroup: string | null;
  interests: string[];
}) {
  const audiogram = thresholds
    ? AUDIOGRAM_FIELDS.filter((hz) => thresholds[hz] !== undefined)
        .map((hz) => `${hz.toLocaleString('en-US')} Hz: ${thresholds[hz]} dB`)
        .join(', ')
    : null;

  const rows: { label: string; value: string | null }[] = [
    { label: 'Sounds', value: sounds.length > 0 ? sounds.map((s) => `"${s}"`).join(', ') : null },
    { label: 'Notes', value: notes.trim() || null },
    { label: 'Audiogram', value: audiogram },
    { label: 'Age group', value: ageGroup },
    { label: 'Things you like', value: interests.length > 0 ? interests.join(', ') : null },
  ];

  return (
    <section
      aria-labelledby="send-heading"
      className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
    >
      <h2 id="send-heading" className="flex items-center gap-2 text-lg font-bold">
        <LockIcon className="h-5 w-5 text-accent-edge" />
        Before you send
      </h2>
      <p className="text-base leading-relaxed">
        The button sends only this to the See Speak AI server, once, to make your plan. Nothing is saved
        there.
      </p>
      <dl className="flex flex-col divide-y divide-line rounded-lg bg-accent-soft/50">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-0.5 px-3 py-2.5">
            <dt className="text-sm font-bold text-muted">{row.label}</dt>
            <dd className={`text-base break-words ${row.value ? '' : 'text-muted italic'}`}>
              {row.value ?? 'Not added'}
            </dd>
          </div>
        ))}
      </dl>
      {notes.trim() && (
        <p className="text-base text-muted">
          Check the notes above for names, yours or your therapist&rsquo;s.
        </p>
      )}
      <p className="flex items-center gap-2 text-base font-bold">
        <CheckCircleIcon className="h-5 w-5 shrink-0 text-hit-strong" />
        Never your voice or video.
      </p>
    </section>
  );
}
