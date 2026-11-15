/*
 * Removes things that look like names and contact details from text the learner types, ON THE DEVICE,
 * before it is sent to the server. A best effort, not a guarantee: the screen always shows the cleaned
 * text before sending, so the learner can check it and edit it.
 */

/** Capitalised words that are usually not names. */
const NOT_NAMES = new Set([
  'I',
  'OK',
  'ASL',
  'English',
  'Spanish',
  'French',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]);

const EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g;
const PHONE = /\+?\d[\d\s().-]{6,}\d/g;
/** A capitalised word, with an optional "'s" or "'m". */
const WORD = /\b([A-Z][a-zA-Z]+|I)('[a-z]+)?\b/g;

export function removeNames(text: string): string {
  const noContacts = text.replace(EMAIL, '[email]').replace(PHONE, '[number]');
  return noContacts.replace(WORD, (match, word: string, suffix: string | undefined, offset: number) => {
    if (NOT_NAMES.has(word)) return match;
    // The first word of a sentence is capitalised anyway: keep it.
    const before = noContacts.slice(0, offset).trimEnd();
    if (before === '' || /[.!?:\n"“(]$/.test(before)) return match;
    return `[name]${suffix ?? ''}`;
  });
}
