/*
 * Wording for the "voice that comes back different" picture on the home screen and the More tab.
 * A bird sings "cats". The sound loops back to its own ear and the high "s" is gone on the way.
 * Plain words, no numbers. It is about why you cannot check a sound you cannot hear, never about
 * a person being wrong.
 */

export const VOICE_LOOP = {
  /** The part of the word that still arrives. */
  word: 'cat',
  /** The high sound that can go missing. Shown struck out on the way back. */
  ending: 's',
  sayLabel: 'What you say:',
  hearLabel: 'What you may hear:',
  /** The one line under the picture. */
  caption: 'With high-pitch hearing loss, the "s" can go missing from your own voice.',
  /** Read aloud by screen readers in place of the picture. */
  alt: 'A bird sings the word "cats". The sound loops around and comes back to its own ear without the high "s", so what it may hear is "cat".',
} as const;
