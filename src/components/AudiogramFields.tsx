import type { AudiogramHz } from '@/lib/types';

/** The four pitches where the hiss sounds live. Lowest to highest. */
export const AUDIOGRAM_FIELDS: AudiogramHz[] = [2000, 4000, 6000, 8000];

/** Hearing levels an audiogram can show, in dB HL. Outside this, the number is almost certainly a typo. */
export const AUDIOGRAM_MIN_DB = -10;
export const AUDIOGRAM_MAX_DB = 120;

export type AudiogramDraft = Partial<Record<AudiogramHz, string>>;

/**
 * Turns the typed boxes into numbers. Blank boxes are skipped.
 * `thresholds` holds the sensible numbers (null when there are none). `error` names the first box that is not
 * a sensible number; the form must not send while there is an error.
 */
export function readAudiogram(draft: AudiogramDraft): {
  thresholds: Partial<Record<AudiogramHz, number>> | null;
  error: string | null;
} {
  const thresholds: Partial<Record<AudiogramHz, number>> = {};
  let error: string | null = null;
  for (const hz of AUDIOGRAM_FIELDS) {
    const raw = draft[hz]?.trim();
    if (!raw) continue;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < AUDIOGRAM_MIN_DB || value > AUDIOGRAM_MAX_DB) {
      error ??= `Check the ${hz} Hz number. Audiogram numbers are between ${AUDIOGRAM_MIN_DB} and ${AUDIOGRAM_MAX_DB}.`;
      continue;
    }
    thresholds[hz] = Math.round(value);
  }
  return { thresholds: Object.keys(thresholds).length > 0 ? thresholds : null, error };
}

/** Four number boxes for the better ear, one per pitch. All optional. */
export function AudiogramFields({
  draft,
  onChange,
}: {
  draft: AudiogramDraft;
  onChange: (draft: AudiogramDraft) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="pb-1 text-xl font-bold">Audiogram (optional)</legend>
      <p className="text-base text-muted">
        From the hearing test chart: your better ear, in dB HL. Leave any box blank to skip it.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {AUDIOGRAM_FIELDS.map((hz) => (
          <label key={hz} className="flex flex-col gap-1.5">
            <span className="text-base font-bold">{hz.toLocaleString('en-US')} Hz</span>
            <span className="flex items-center rounded-2xl border-2 border-line bg-surface focus-within:border-accent">
              <input
                type="text"
                inputMode="numeric"
                pattern="-?[0-9]*"
                maxLength={4}
                value={draft[hz] ?? ''}
                onChange={(e) => onChange({ ...draft, [hz]: e.target.value.replace(/[^0-9-]/g, '') })}
                placeholder="40"
                aria-label={`${hz} hertz, in decibels hearing level`}
                className="w-full min-w-0 rounded-2xl bg-transparent px-4 py-3 text-lg outline-none placeholder:text-muted/70"
              />
              <span className="pr-4 text-base text-muted" aria-hidden="true">
                dB
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
