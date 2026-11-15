/*
 * Wording for the quick start, the waiting line on the plan page, and the example report.
 * Plain words. The example is made up and must always say so.
 */

export const TRY_IT = {
  button: 'Try it now',
  detail: 'Practice "s" and "sh" words right away. No check first.',
  personalTitle: 'Make it personal',
} as const;

export const PLAN_WAIT = {
  personalizing: 'Claude is personalizing your plan...',
  personalizingDetail: 'This plan is ready to use now. It will be replaced when the personal one arrives.',
} as const;

/** A made up report for trying the form. Never a real person. */
export const EXAMPLE_REPORT = {
  button: 'Example report',
  badge: 'Example',
  banner: 'This is an example, not a real person. Change it or clear it.',
  clear: 'Clear the example',
  sounds: ['s', 'sh'],
  otherSounds: '',
  notes: 'EXAMPLE ONLY, not a real person. Work on s at the end of words and sh at the start.',
  ageGroup: 'teen' as const,
  interests: 'soccer, cooking',
} as const;
