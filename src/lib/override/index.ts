import {
  clearAdultCodeHash,
  loadAdultCodeHash,
  loadAdultOverrides,
  saveAdultCodeHash,
  saveAdultOverride,
  type AdultOverride,
} from '@/lib/store';

/*
 * The adult override: a parent or speech therapist sitting with the learner can mark one try "right" when the
 * phone's scoring got it wrong. A short code keeps the learner from tapping it alone.
 *
 * The code is a speed bump, not security. It is 4 to 6 digits, kept as a scrambled number (a hash) on this
 * device only, so it is not sitting there as plain text. Anyone with the device and some time could get past it.
 *
 * Overrides are saved on their own. They never change a saved try and never feed the before-and-after numbers,
 * so progress stays honest.
 */

export type { AdultOverride };

export const CODE_MIN_DIGITS = 4;
export const CODE_MAX_DIGITS = 6;

/** True for 4 to 6 digits and nothing else. */
export function isValidAdultCode(code: string): boolean {
  return /^\d{4,6}$/.test(code);
}

/** A 53-bit string hash (cyrb53) with a fixed app salt. Same input, same output. Not reversible in practice. */
function hashCode(code: string): string {
  const input = `seespeak-adult:${code}`;
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

export function hasAdultCode(): boolean {
  return loadAdultCodeHash() !== null;
}

/** Saves a new code, replacing any old one. Returns false (and saves nothing) unless it is 4 to 6 digits. */
export function setAdultCode(code: string): boolean {
  if (!isValidAdultCode(code)) return false;
  saveAdultCodeHash(hashCode(code));
  return true;
}

/** True only when a code is set and this is it. */
export function checkAdultCode(code: string): boolean {
  const saved = loadAdultCodeHash();
  return saved !== null && isValidAdultCode(code) && hashCode(code) === saved;
}

export function clearAdultCode(): void {
  clearAdultCodeHash();
}

export function saveOverride(o: AdultOverride): void {
  saveAdultOverride(o);
}

export function loadOverrides(): AdultOverride[] {
  return loadAdultOverrides();
}
