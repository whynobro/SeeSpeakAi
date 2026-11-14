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
