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

/** Label lines in a therapist report: "Name: ...", "Patient: ...". The value is replaced, the label stays. */
const NAME_LINE =
  /^([ \t]*(?:full[ \t]+name|name|patient|student|client|child|learner|parent|guardian|therapist|slp|clinician)[ \t]*:)[ \t]*[^\n]*/gim;
const DOB_LINE =
  /^([ \t]*(?:dob|d\.o\.b\.|date[ \t]+of[ \t]+birth|birth[ \t]*date|birthday)[ \t]*:?)[ \t]*[^\n]*/gim;
/** A date in numbers or words, for "born on ..." and inline "DOB ...". */
const DATE_PART =
  /(?:\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d{4}-\d{2}-\d{2}|[A-Z][a-z]+\.?[ \t]+\d{1,2}(?:st|nd|rd|th)?,?[ \t]+\d{4}|\d{1,2}(?:st|nd|rd|th)?[ \t]+[A-Z][a-z]+,?[ \t]+\d{4})/
    .source;
const INLINE_DOB = new RegExp(
  String.raw`\b(?:dob|d\.o\.b\.|date of birth|born(?: on)?)[ \t]*:?[ \t]*` + DATE_PART,
  'gi',
);
/** Two or more capitalised words straight after "patient", "student", "client", "child" or "for". */
const NAME_PAIR =
  /\b([Pp]atient|[Ss]tudent|[Cc]lient|[Cc]hild|[Ll]earner|[Ff]or)([ \t]+)[A-Z][a-z]+(?:[ \t]+[A-Z][a-z]+)+/g;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Removes likely personal names and identifiers from text before it leaves the device.
 * `extraNames` are names the caller knows (the learner's nickname, a clinic name): each is removed wherever it appears.
 */
export function removeNames(text: string, extraNames: string[] = []): string {
  let out = text
    .replace(DOB_LINE, '$1 [date of birth]')
    .replace(NAME_LINE, '$1 [name]')
    .replace(INLINE_DOB, '[date of birth]')
    .replace(NAME_PAIR, (_m, word: string, space: string) => `${word}${space}[name]`);
  for (const raw of extraNames) {
    const name = raw.trim();
    if (name.length < 2) continue;
    out = out.replace(
      new RegExp(String.raw`(?<![\w])` + escapeRegExp(name) + String.raw`(?![\w])`, 'gi'),
      '[name]',
    );
  }
  const noContacts = out.replace(EMAIL, '[email]').replace(PHONE, '[number]');
  return noContacts.replace(WORD, (match, word: string, suffix: string | undefined, offset: number) => {
    if (NOT_NAMES.has(word)) return match;
    // The first word of a sentence is capitalised anyway: keep it.
    const raw = noContacts.slice(0, offset);
    const before = raw.trimEnd();
    // A new line also starts a new sentence ("DOB:" after a "Name:" line).
    if (before === '' || /\n[ \t]*$/.test(raw) || /[.!?:\n"“(]$/.test(before)) return match;
    return `[name]${suffix ?? ''}`;
  });
}
