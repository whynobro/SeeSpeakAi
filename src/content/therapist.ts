/*
 * Wording for the speech therapist loop: the therapist makes a practice link, the learner opens it,
 * and a summary goes back. Plain words. No names anywhere: the link and the summary never hold one.
 * Only "s", "sh", "z" and "ch" are scored. "r" and "th" are shown, never scored, and the wording says so.
 */

export const THERAPIST = {
  moreLink: 'For speech therapists',
  moreDetail: 'Set home practice and send it as a link',

  title: 'For speech therapists',
  intro: 'Set home practice for the days between sessions. You get a link to send.',

  soundsTitle: 'Sounds to practice',
  scoredLabel: 'The app checks these',
  showOnlyLabel: 'Shows how, no score',
  showOnlyNote: 'The app cannot measure these yet. They go in the plan with no score.',
  levelTitle: 'Start at',
  daysTitle: 'How often',
  daysOption: (n: number) => `${n} days`,
  daysUnit: 'a week',

  linkHolds: 'The link holds the sounds, the level and the days. No name, and nothing about the learner.',
  make: 'Make practice link',
  needSound: 'Pick at least one sound first.',

  linkTitle: 'Practice link',
  copy: 'Copy link',
  copied: 'Copied',
  copyFailed: 'Could not copy. Press and hold the link to copy it.',
  share: 'Share',
  shareTitle: 'See Speak AI home practice',
  openAsLearner: 'Open it as the learner',
} as const;

export const ASSIGN = {
  title: 'Your speech therapist set this up',
  soundsLabel: 'Sounds',
  levelLabel: 'Start at',
  daysLabel: 'How often',
  level: (n: number, title: string) => `Level ${n}: ${title}`,
  days: (n: number) => (n === 7 ? 'Every day' : `${n} days a week`),
  noScore: 'shows how, no score',
  start: 'Start practice',
  stays: 'Starting saves this practice on this device. Nothing is sent.',
  notTherapy: 'This is practice between sessions. It is not therapy.',

  badTitle: 'This link did not work',
  badBody: 'It has no sounds in it. Ask your speech therapist to send a new one.',
  badHome: 'Go to home',

  cardTitle: 'From your speech therapist',
  cardStart: 'Start',
  cardOpenPlan: 'Open the plan',
} as const;

export const THERAPIST_SUMMARY = {
  title: 'Share with your speech therapist',
  exact: 'This is the exact text that is shared. It has no name.',
  empty: 'Nothing to share yet. It fills in after your first try.',
  share: 'Share',
  copy: 'Copy',
  copied: 'Copied',
  copyFailed: 'Could not copy. Press and hold the text to copy it.',

  heading: (date: string) => `See Speak AI practice summary${date ? `, ${date}` : ''}`,
  assigned: (sounds: string, level: string, days: string) =>
    `Set by the speech therapist: ${[sounds, `from ${level}`, days].filter(Boolean).join(', ')}`,
  daysPracticed: (n: number) => `Practiced on ${n} of the last 7 days`,
  triesHeading: 'Tries where the sound was there:',
  levelsHeading: 'Levels passed:',
  noLevels: 'Levels passed: none yet',
  levelPassed: (n: number, title: string) => `level ${n} (${title})`,
} as const;
