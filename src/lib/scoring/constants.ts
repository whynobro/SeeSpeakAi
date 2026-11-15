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
