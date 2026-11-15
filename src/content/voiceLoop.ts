/*
 * Wording for the "voice that comes back different" picture on the More tab.
 * A bird sings "sip". The sound loops back to its own ear, and on the way the high "s" drifts toward "sh",
 * so what it may hear is "ship" (docs/lanes/screens.md: the sip and ship example, never "lisp").
 * Plain words, no numbers. It is about why you cannot check a sound you cannot hear, never about
 * a person being wrong.
 */

export const VOICE_LOOP = {
  /** The sound the bird says. */
  sound: 's',
  /** What that sound may turn into on the way back to the ear. */
  heardSound: 'sh',
  /** The rest of the word, the same both ways. */
  rest: 'ip',
  sayLabel: 'What you say:',
  hearLabel: 'What you may hear:',
  /** The one line under the picture. */
  caption: 'With high-pitch hearing loss, your "s" can drift toward "sh".',
  /** Read aloud by screen readers in place of the picture. */
  alt: 'A bird sings the word "sip". The sound loops around and comes back to its own ear, where the high "s" has turned into a lower "sh", so what it may hear is "ship".',
} as const;
