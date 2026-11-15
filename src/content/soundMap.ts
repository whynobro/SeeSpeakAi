/*
 * Wording for the sound map on the Progress screen: one color per sound, one blob per level.
 * A blob fills in when a level's tier is passed and grows with silver and gold. Plain words, no pressure.
 */

export const SOUND_MAP = {
  title: 'Your sound map',
  lede: 'Each color is a sound. Each blob is a level. Pass a level and its blob fills in. Silver and gold make it grow.',
  empty: 'Your map is empty for now. Pass your first level and the first blob fills in.',
  tapHint: 'Tap a blob to see the level.',
  /** Legend, so color and fill are never the only signal. */
  legendDone: 'Filled: passed',
  legendOpen: 'Dashed: not yet',
  passedCount: (done: number, all: number) => `${done} of ${all} levels passed`,
  soundName: (sound: string) => `The "${sound}" sound`,
  levelName: (n: number, title: string) => `Level ${n}: ${title}`,
  /** Screen reader label for one blob. */
  blobLabel: (sound: string, n: number, title: string, state: string) =>
    `"${sound}" sound, level ${n}, ${title}: ${state}`,
  notYet: 'Not passed yet',
  locked: 'Opens when the level before it is passed',
  tierPassed: (tier: string) => `${tier} passed`,
  best: (hits: number, items: number) => `Best run: ${hits} of ${items}`,
  on: (date: string) => `Last played ${date}`,
  play: 'Play this level',
  playAgain: 'Play it again',
  goFirst: 'Go to the level before it',
  close: 'Close',
} as const;
