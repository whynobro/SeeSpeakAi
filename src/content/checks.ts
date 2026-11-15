import type { AssessmentReport, PracticeWord, WordPosition } from '@/lib/types';

/*
 * Word lists and wording for the speaking check and the listening check (issue #39). For the content owner.
 *
 * The speaking check uses 3 words for each spot (start, middle, end) for "s" and "sh": 18 words, about
 * 2 to 3 minutes. Older learners get harder words. The words follow the word bank rules in words.ts:
 *  - exactly one target hiss and no other hiss-like sound ("f", "z", "ch", "j", a second "s" or "sh"),
 *  - every "sh" word is spelled with "sh", no "s" word contains "sh",
 *  - no "s" clusters at the start (stop, sky), no plurals.
 * Reviewed on Nov 14 against these rules and the scorer. Not yet played into the scorer on real voices.
 * These words are only for the check. Practice words still come from WORD_BANK.
 */

export type CheckAge = AssessmentReport['ageGroup'];
export type CheckSound = 's' | 'sh';

function c(text: string, target: CheckSound, position: WordPosition): PracticeWord {
  return { id: text.toLowerCase(), text, target, position, baseWord: null, contrastWord: null, sign: null };
}

type Cells = Record<CheckSound, Record<WordPosition, [string, string, string]>>;

const CELLS: Record<CheckAge, Cells> = {
  child: {
    s: {
      start: ['sun', 'sock', 'sip'],
      middle: ['pencil', 'dinosaur', 'icing'],
      end: ['bus', 'house', 'mouse'],
    },
    sh: {
      start: ['shoe', 'ship', 'sheep'],
      middle: ['cushion', 'washing', 'mushroom'],
      end: ['fish', 'brush', 'wash'],
    },
  },
  teen: {
    s: {
      start: ['secret', 'signal', 'soccer'],
      middle: ['recipe', 'concert', 'lesson'],
      end: ['chorus', 'bonus', 'plus'],
    },
    sh: {
      start: ['shadow', 'shelter', 'shampoo'],
      middle: ['cashew', 'mushroom', 'pushing'],
      end: ['polish', 'punish', 'crash'],
    },
  },
  adult: {
    s: {
      start: ['cereal', 'cinema', 'salary'],
      middle: ['classic', 'dancer', 'basic'],
      end: ['practice', 'nervous', 'notice'],
    },
    sh: {
      start: ['shortcut', 'shoulder', 'shampoo'],
      middle: ['cashier', 'ashamed', 'usher'],
      end: ['cash', 'rubbish', 'publish'],
    },
  },
};

export const CHECK_POSITIONS: WordPosition[] = ['start', 'middle', 'end'];
export const CHECK_SOUNDS: CheckSound[] = ['s', 'sh'];

/** All 18 words for one age group, grouped by sound then position (the check reorders them). */
export function checkWordsFor(age: CheckAge): PracticeWord[] {
  const cells = CELLS[age];
  return CHECK_SOUNDS.flatMap((sound) =>
    CHECK_POSITIONS.flatMap((position) => cells[sound][position].map((text) => c(text, sound, position))),
  );
}

/**
 * Short syllables for the "try it alone" step, by spot. Asked only when all 3 words in a spot missed.
 * They tell the plan "can do it alone, not yet in words" apart from "not yet".
 */
export const TRY_ALONE: Record<CheckSound, Record<WordPosition, string>> = {
  s: { start: 'sa', middle: 'asa', end: 'as' },
  sh: { start: 'sha', middle: 'asha', end: 'ash' },
};

/** A listening pair: one "s" word and one "sh" word, or a control pair with no hiss (cat / hat). */
export interface ListenPair {
  s: string;
  sh: string;
  control: boolean;
}

/** 4 pairs per age group, each played 3 times in the check. The last is the no-hiss control. */
export const LISTEN_PAIRS: Record<CheckAge, ListenPair[]> = {
  child: [
    { s: 'sip', sh: 'ship', control: false },
    { s: 'sue', sh: 'shoe', control: false },
    { s: 'see', sh: 'she', control: false },
    { s: 'cat', sh: 'hat', control: true },
  ],
  teen: [
    { s: 'sip', sh: 'ship', control: false },
    { s: 'save', sh: 'shave', control: false },
    { s: 'class', sh: 'clash', control: false },
    { s: 'cat', sh: 'hat', control: true },
  ],
  adult: [
    { s: 'sea', sh: 'she', control: false },
    { s: 'sort', sh: 'short', control: false },
    { s: 'lease', sh: 'leash', control: false },
    { s: 'cat', sh: 'hat', control: true },
  ],
};

/** Quick-tap goals on the goals screen. The learner can also write their own. */
export const GOAL_CHIPS: Record<CheckAge, string[]> = {
  child: ['Talking at school', 'Reading out loud', 'Playing with friends', 'Talking with family'],
  teen: [
    'Class presentations',
    'Talking with friends',
    'Sports and team talk',
    'Phone and video calls',
    'Noisy places',
    'Job interviews',
  ],
  adult: [
    'Phone and video calls',
    'Meetings and presentations',
    'Restaurants and noisy rooms',
    'Talking with my kids',
    'Ordering and shopping',
    'Job interviews',
  ],
};

export const AGE_LABELS: Record<CheckAge, { title: string; detail: string }> = {
  child: { title: 'Child', detail: 'Ages 5 to 11. A grown-up can help.' },
  teen: { title: 'Teen', detail: 'Ages 12 to 17' },
  adult: { title: 'Adult', detail: '18 and up' },
};

/** Wording for both checks. Plain, kind, never "wrong". */
export const CHECK_COPY = {
  speakingTitle: 'Speaking check',
  speakingIntro:
    'Say 18 words out loud, one at a time. There is no right or wrong while you go. It finds where your practice starts.',
  speakingTime: 'About 2 to 3 minutes',
  whoTitle: 'Who is practicing?',
  sayWord: 'Say this word',
  gotIt: 'Got it',
  skip: 'Skip this word',
  breakTitle: 'Halfway there',
  breakBody: 'Take a breath, stretch, have a sip of water. Tap Go when you are ready.',
  tryAloneTitle: 'Try it on its own',
  tryAloneBody: (sound: string, syllable: string) =>
    `Now just the sound: say "${syllable}", with a long "${sound}". Two tries.`,
  resultsTitle: 'Here is where you are starting',
  resultsNote: 'A practice check, not a speech evaluation. Three words per spot is a small sample.',
  levelLabels: { got: 'Got it', almost: 'Almost', 'not-yet': 'Not yet' },
  startHere: 'Our starting spot',
  aloneYes: 'You can say it on its own. Next is getting it into words.',
  goalsTitle: 'What do you want to work on?',
  goalsIntro: 'Your plan picks words that fit. You can skip this.',
  goalsLabel: 'In your own words',
  goalsPlaceholder: 'For example: "people ask me to repeat myself on the phone".',
  goalsNoNames: 'Please leave out names. Any that look like names are taken out before sending.',
  sendTitle: 'Before you send',
  sendBody:
    'Tapping the button sends this once to the SeeSpeak server and its AI to make your plan: the text below, your check numbers, your hearing check answers and your age group. Never your voice. Nothing is saved there.',
  makePlan: 'Send once and make my plan',
  listeningNext: 'Next: listening check',

  listeningTitle: 'Listening check',
  listeningIntro:
    'Listen and tap what you hear. About 2 minutes. This is a listening check, not a hearing test.',
  listeningSetup: [
    'Find a quiet room.',
    'Wear your hearing aids or implant the way you usually do.',
    'Play the sample and set a comfortable volume. Then keep it there.',
  ],
  playSample: 'Play a sample',
  heardTitle: 'Did you hear something?',
  heardYes: 'Yes',
  heardNo: 'Nothing',
  silentNote: 'Some tries are silent on purpose.',
  pairTitle: 'Which one did you hear?',
  playAgain: 'Play again',
  tired: "I'm tired, stop here",
  computerVoice: 'The words use your device’s built-in voice for now. Real recorded voices will replace it.',
  noVoice: 'This browser cannot speak words out loud, so the word part is skipped.',
  stoppedEarly: 'We stopped early. That is fine. Try again another time.',
  listenResultTitle: 'What we found',
  listenLevels: { easy: 'Easy to tell apart', harder: 'Harder to tell apart', 'not-sure': 'Not sure yet' },
  listenNote:
    'Compared only with your own earlier runs. A phone or laptop speaker is not calibrated, so this is never a hearing test.',
};
