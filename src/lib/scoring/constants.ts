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

/** Live meter only: the frame must be at least this loud (0 to 1) to count as hiss. Rejects silence. */
export const LIVE_MIN_LEVEL = 0.004;

/** Scoring: below this level the whole recording is treated as silence (absolute floor, not gain tuned). */
export const SILENCE_LEVEL = 0.001;

/** Scoring: warn "too quiet" when even the loudest frame is below this level. */
export const TOO_QUIET_LEVEL = 0.02;

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
 * Centroid (energy-weighted mean frequency, Hz) that maps to meter position 0 ("sh").
 * Source: Ling Six Sound literature puts "sh" energy at 2 to 4 kHz.
 */
export const SH_CENTROID_HZ = 3500;

/**
 * Centroid (Hz) that maps to meter position 1 ("s").
 * Source: Ling Six puts "s" at 4 to 8 kHz; Jongman, Wayland and Wong (2000) put /s/ peaks near 6 to 8 kHz.
 */
export const S_CENTROID_HZ = 6500;

/** Meter position at or above this reads as "s", below as "sh". */
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
