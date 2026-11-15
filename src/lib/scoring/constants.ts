/**
 * Every tunable number for scoring lives here. All of these are STARTING VALUES set on synthetic
 * test sounds. They need tuning on real voices before anyone relies on them. Children's and women's
 * voices sit higher in pitch, so the "s" and "sh" centroids below will likely shift up for them.
 *
 * Design rule: the mic gain is unknown, so decisions use ratios and levels RELATIVE to the loudest
 * frame of the same recording. The only absolute numbers are small floors that reject pure silence.
 */

/** A frame counts as hiss when at least this share of its energy is above 2 kHz. Vowels sit near 0. */
export const HISS_RATIO_MIN = 0.6;

/** Scoring: below this level the whole recording is treated as silence (absolute floor, not gain tuned). */
export const SILENCE_LEVEL = 0.001;

/**
 * Scoring: warn "too quiet" when even the loudest frame is below this level. Only a warning: the verdict
 * uses levels relative to the loudest frame. Was 0.02, which warned on normal speech: Michael's Windows
 * laptop mic at normal distance peaks at 0.015 to 0.05 with room noise near 0.001 (9 logged tries,
 * test log, 2026-11-14), and those quiet tries still scored on relative levels.
 */
export const TOO_QUIET_LEVEL = 0.01;

/** Scoring: a hiss frame must be at least this fraction of the loudest frame's level. */
export const HISS_REL_LEVEL = 0.05;

/** Scoring: a voiced (vowel) frame must be at least this fraction of the loudest frame's level. */
export const VOICED_REL_LEVEL = 0.15;

/** A voiced frame has at most this hiss ratio. A vowel has most of its energy below 2 kHz. */
export const VOICED_RATIO_MAX = 0.35;

/** Fewer voiced milliseconds than this means "no vowel found". */
export const MIN_VOICED_MS = 40;

/**
 * A hiss run shorter than this is ignored, so the short burst when a /t/ or /k/ is released
 * (the end of "cat") is not counted as an /s/.
 */
export const MIN_HISS_MS = 70;

/**
 * Stop-release check, part 1: skip this many ms at the start of a hiss run before judging how steady it is.
 * The click of a "t" or "k" burst (and a stop burst glued to a real "s") sits there. Starting value from
 * synthetic sounds, to be tuned on real voices.
 */
export const ONSET_SKIP_MS = 30;

/**
 * Stop-release check, part 2: after the onset, a frame counts as "held" when its level is at least this
 * fraction of the loudest frame in the same run. A real "s" holds its level; a stop release fades away.
 * Starting value from synthetic sounds, to be tuned on real voices.
 */
export const SUSTAIN_REL_LEVEL = 0.5;

/**
 * Stop-release check, part 3: a hiss run needs at least this many ms of held frames to count as a held
 * hiss and not a release. Starting value from synthetic sounds, to be tuned on real voices.
 */
export const MIN_SUSTAINED_MS = 60;

/** A hiss run may bridge this many non-hiss frames (real "s" sounds flicker a little). */
export const MAX_GAP_FRAMES = 1;

/**
 * Placement: a vowel must start within this many ms after a "start" hiss, or end within this many ms
 * before an "end" hiss. Judging by the nearest vowel (not the first or last voiced frame of the whole
 * recording) keeps the click of the Start or Stop button on a laptop from pushing every hiss out of place.
 * Measured: in 3 logged "ship" tries (Windows laptop, 2026-11-14) the vowel began 20 to 40 ms after the
 * "sh". 250 also covers the closure and "t" release between vowel and "s" in "cats".
 */
export const MAX_VOWEL_GAP_MS = 250;

/**
 * Centroid (energy-weighted mean frequency, Hz) that maps to meter position 0 ("sh").
 * Measured, 2026-11-14, shared test log, Michael (adult man), Windows laptop mic, Chrome: a held "sh"
 * he marked as said with the sound (1 try, 5 hiss runs) had run means 3240 to 3670 Hz, median 3440.
 * Was 3500 (Ling Six: "sh" energy at 2 to 4 kHz), so the measurement agrees with the literature.
 * Note: "sh" inside a word reads higher. His "sh" in "ship" (3 practice tries) read 4430 to 5810 Hz,
 * median about 5170, because the lips spread for the vowel.
 */
export const SH_CENTROID_HZ = 3400;

/**
 * Centroid (Hz) that maps to meter position 1 ("s").
 * Measured, same source: a held "s" marked as said with the sound (1 try, 3 runs) had run means 7220
 * to 7540 Hz, median 7360. "s" in words read 5990 to 7600 (2 practice "cats" tries). Was 6500 (Ling
 * Six: 4 to 8 kHz; Jongman, Wayland and Wong 2000: /s/ peaks near 6 to 8 kHz). With 3500 and 6500 the
 * "s"/"sh" line sat at 5000 Hz, right on his in-word "sh", so "ship" read as "s". Now it sits at 5400.
 * One speaker on one mic: re-measure with more voices (a lower "s" would now read "sh" sooner).
 */
export const S_CENTROID_HZ = 7400;

/** Meter position at or above this reads as "s", below as "sh". With the anchors above: 5400 Hz. */
export const BOUNDARY = 0.5;

/** Confidence: distance from the boundary that already counts as fully sure. */
export const CONFIDENCE_FULL_DISTANCE = 0.3;

/** Confidence: a hiss this long (ms) counts as fully sure on the length side. */
export const CONFIDENCE_FULL_HISS_MS = 210;

/** Confidence: weight of the boundary distance (the rest is the length). */
export const CONFIDENCE_DISTANCE_WEIGHT = 0.6;

/** Confidence for a clean recording where no qualifying hiss was found. */
export const MISS_CONFIDENCE = 0.6;

/** Recordings shorter than this (ms) get a warning. */
export const MIN_RECORDING_MS = 200;

/** Room-noise check: look at this share of the quietest frames. */
export const NOISE_QUIET_SHARE = 0.2;

/** Room-noise check: the quiet frames must still be at least this fraction of the loudest, and hiss-like. */
export const NOISE_REL_LEVEL = 0.3;

/** Room-noise check needs at least this many frames to say anything. */
export const NOISE_MIN_FRAMES = 8;

// ---------- "z" and "ch" ----------
// Both are STARTING VALUES set on synthetic sounds only. They need tuning on real voices (see /lab).

/** Every sound the app scores. Add one only when src/lib/scoring has tests for it. */
export const TARGET_SOUNDS = ['s', 'sh', 'z', 'ch'] as const;

/** True when `value` is one of the scored sounds. Use it to check data from outside (API bodies, storage). */
export function isTargetSound(value: unknown): value is (typeof TARGET_SOUNDS)[number] {
  return typeof value === 'string' && (TARGET_SOUNDS as readonly string[]).includes(value);
}

/** The plain hiss each sound is built on: "z" is a voiced "s", "ch" is a burst plus a short "sh". */
export const BASE_HISS = { s: 's', sh: 'sh', z: 's', ch: 'sh' } as const;

/**
 * "z" only: a frame counts as hiss when at least this share of its energy is above 2 kHz. Lower than
 * HISS_RATIO_MIN because the buzz of the voice puts real energy under 500 Hz. A vowel is still far below
 * VOICED_RATIO_MAX, so the two stay apart.
 */
export const Z_HISS_RATIO_MIN = 0.45;

/**
 * "z" only: a hiss frame counts as voiced when its voicing (energy under 500 Hz next to the hiss energy,
 * 0 to 1) is at least this. A plain "s" sits near 0; the synthetic "z" sits near 0.2.
 */
export const VOICING_FRAME_MIN = 0.08;

/**
 * "z" only: the share of the hiss frames that must be voiced for the hiss to count as a "z".
 * Deliberately low: a word-final "z" ("dogs", "bees") is often partly devoiced in natural English, so the
 * buzz may only last for the first part of the hiss. Voicing in about a third of it is enough.
 * The first and last hiss frame are ignored: they overlap the neighbouring vowel and would look voiced.
 */
export const Z_VOICED_SHARE_MIN = 0.3;

/** "ch" only: the first this many ms of the hiss run are the burst; the short "sh" after it is the body. */
export const CH_ONSET_MS = 30;

/**
 * "ch" only: the burst counts when the loudest onset frame is at least this many times the typical
 * (median) loudness of the body. A plain "sh" fades in, so its ratio sits under 1.
 */
export const CH_BURST_RATIO = 1.5;

/** "ch" only: confidence from the burst is full when the ratio is this many times CH_BURST_RATIO. */
export const CH_BURST_FULL_FACTOR = 2;

/** "ch" only: the "sh" after the burst must be at least this long (ms), held at its level. About 40 ms. */
export const CH_MIN_HISS_MS = 40;

/** "ch" only: a body longer than this (ms) is a long "sh", not the short hiss of a "ch". About 150 ms. */
export const CH_MAX_HISS_MS = 150;

// ---------- Lisp ("s" or "z" said with the tongue between the teeth, or with air over the sides) ----------
// STARTING VALUES from synthetic sounds and a few real voices (Michael on a Windows laptop, one iPhone tester,
// shared test log, 2026-11-14). The logged tries carry no flatness yet, so the flatness bar is set from
// synthetic noise only and kept strict on purpose. Re-tune with the lisp steps in /lab/guided.
// Why these two numbers: a clear "s" is loud next to the vowel and has one strong peak (about 4 to 9 kHz).
// A lisp ("th"-like or lateral) is much weaker next to the vowel and its noise is spread out evenly
// (Behrens and Blumstein 1988; Jongman, Wayland and Wong 2000: "s" and "sh" are far louder than "f" and
// "th" next to the vowel, and "f" and "th" have flat, diffuse spectra). Both must be true to call a lisp.

/**
 * Lisp, part 1: the hiss is "weak" when its typical loudness is under this share of the vowel's typical
 * loudness (the trace's hissToVowel). Every "s" try in the test log that scores a hit today sits at 0.27 or
 * more (11 tries, Windows laptop and one iPhone), so 0.2 (about -14 dB) leaves a margin. The live meter uses
 * the same number against the loudest frame heard so far.
 */
export const LISP_HISS_TO_VOWEL_MAX = 0.2;

/**
 * Lisp, part 2: the hiss is "flat" when the typical spectral flatness of its frames (2 to 10 kHz, see
 * features.ts) is at least this. Measured on synthetic sounds: flat noise reads about 0.56, a noise with a
 * 15 dB peak (a soft, real-ish "s") about 0.42 to 0.44, a 25 dB peak about 0.33, the synthetic "s" near 0.
 * 0.47 only calls a lisp on near-flat noise. Strict on purpose until real lisp tries are logged.
 */
export const LISP_FLATNESS_MIN = 0.47;

/**
 * Lisp: where a lisp shows on the meter (0 = "sh", 1 = "s"), and the meterPosition a lisp result gets.
 * Just on the "sh" side of the middle, so a lisp never lands in the "s" zone and the meter and verdict agree.
 */
export const LISP_METER_POSITION = 0.45;
