/** Shared contract between all lanes. Change only with team agreement. */

// ---------- Sounds ----------

/** Sounds the app can score today. Add one only when src/lib/scoring can really detect it. */
export type TargetSound = 's' | 'sh' | 'z' | 'ch';
/** The Ling Six sounds, lowest pitch to highest. */
export type LingSound = 'm' | 'oo' | 'ah' | 'ee' | 'sh' | 's';
/** Audiogram test frequencies in Hz. */
export type AudiogramHz = 250 | 500 | 1000 | 2000 | 4000 | 6000 | 8000;

// ---------- Hearing profile (step 1) ----------

/** What the learner can hear. Stays on the device. Never sent to a server with a name. */
export interface HearingProfile {
  source: 'ling6' | 'audiogram';
  /** Ling Six check: true means the learner heard that sound. */
  ling?: Record<LingSound, boolean>;
  /** Audiogram: hearing threshold in dB HL at each frequency, better ear. Bigger number = harder to hear. */
  thresholdsDb?: Partial<Record<AudiogramHz, number>>;
  createdAt: string; // ISO timestamp
}
/** One sound the profile says to practice, with a plain-English reason to show the learner. */
export interface TargetPick {
  sound: TargetSound;
  /** high: the profile says the learner likely cannot hear it. some: borderline. low: likely hears it. */
  risk: 'high' | 'some' | 'low';
  reason: string;
}

// ---------- Practice words (step 2) ----------

/** Where the target sound sits in the word. */
export type WordPosition = 'start' | 'middle' | 'end';
/** A sign shown next to a word. Optional feature, off unless the learner turns it on. */
export interface SignCard {
  gloss: string; // the ASL sign's name, e.g. "CAT"
  imageUrl: string | null;
  credit: string; // source and license
  reviewed: boolean; // true once an ASL signer has checked it
}
export interface PracticeWord {
  id: string; // lower-case word, e.g. "cats"
  text: string;
  target: TargetSound;
  position: WordPosition;
  /** For grammar endings: the word without the ending ("cat" for "cats"). */
  baseWord: string | null;
  /** The same word with the other hiss, when one exists ("ship" for "sip"). */
  contrastWord: string | null;
  sign: SignCard | null;
}

// ---------- Listening and scoring (step 3) ----------

/** One slice of sound (about 20 ms) boiled down to the numbers scoring needs. */
export interface FrameFeatures {
  tMs: number; // time since recording started
  level: number; // loudness of the whole frame, 0 to 1
  hissLevel: number; // loudness of the part above 2 kHz, 0 to 1
  hissRatio: number; // share of the frame's energy that is above 2 kHz, 0 to 1
  centroidHz: number | null; // "center of pitch" of the hiss band, null when there is no hiss
  /** Voicing, 0 to 1: energy under 500 Hz next to the hiss energy. About 0 for a plain hiss, higher with the voice on. Older saved frames lack it. */
  voicing?: number;
}
/** The shape of the hiss over one try, boiled down to a few numbers. Never audio. */
export interface TraceSummary {
  hissMs: number; // length of the scored hiss run
  heldMs: number; // how much of it held its level
  positionStart: number; // meter position (0 = "sh", 1 = "s") in the first third of the hiss
  positionMid: number;
  positionEnd: number; // last third
  drift: number; // positionEnd - positionStart. Negative = slid toward "sh"
  steadiness: number; // 0 (very wobbly loudness) to 1 (smooth)
  hissToVowel: number; // hiss loudness divided by vowel loudness
  gapMs: number | null; // silence between the vowel and the hiss, null if no vowel found
  vowelMs: number;
}
/** Live meter value for one frame. */
export interface SoundReading {
  hissing: boolean; // true while an "s" or "sh" type hiss is being made
  /** 0 = clear "sh", 1 = clear "s". null while not hissing. */
  position: number | null;
  level: number; // 0 to 1, for a loudness bar
}
/** hit: target sound was there. close: a hiss was there but it was the other one. miss: no hiss where it belongs. */
export type Verdict = 'hit' | 'close' | 'miss';
/** The score for one spoken word. */
export interface AttemptScore {
  target: TargetSound;
  verdict: Verdict;
  heard: TargetSound | null; // which sound was found, if any (a plain hiss reads as 's' or 'sh')
  meterPosition: number | null; // average meter position of the hiss, 0 ("sh") to 1 ("s")
  hissMs: number; // how long the hiss lasted
  confidence: number; // 0 to 1
  warnings: string[]; // plain English: "too quiet", "room too noisy", ...
}

// ---------- Feedback and progress (steps 4 and 5) ----------

/** Ways the app can tell the learner the result. Color always comes with a word or icon. */
export type FeedbackChannel = 'color' | 'vibration' | 'shifted-audio';
/** The four teaching steps: show how, find it, lock it in, use it in words. */
export type PracticeStage = 'show' | 'find' | 'lock' | 'use';
/** One try at one word, as saved on the device. */
export interface Attempt {
  id: string;
  wordId: string;
  target: TargetSound;
  stage: PracticeStage;
  createdAt: string; // ISO timestamp
  score: AttemptScore;
  channels: FeedbackChannel[]; // feedback that was switched on for this try
}
/** Learner settings, saved on the device. */
export interface LearnerSettings {
  nickname: string; // never a full name
  showSigns: boolean; // sign cards on or off
  channels: FeedbackChannel[];
}
/** Before and after numbers for one sound. */
export interface SoundProgress {
  sound: TargetSound;
  attempts: number;
  firstAccuracy: number | null; // share of hits in the first 10 tries, 0 to 1
  latestAccuracy: number | null; // share of hits in the latest 10 tries, 0 to 1
}

// ---------- Server ----------

/** Body of POST /api/practice-list. No name, no audio, no raw hearing data beyond the target sounds. */
export interface PracticeListRequest {
  targets: TargetSound[];
  interests: string[]; // optional topics the learner likes, e.g. "soccer"
  count: number;
}
export interface PracticeListResponse {
  words: PracticeWord[];
  source: 'ai' | 'word-bank'; // word-bank = built-in fallback when no key or the call fails
}

// ---------- The loop: report -> plan -> training -> feedback -> goal ----------

/** Step 1. The starting information: a speech therapist's report, or the test taken in the app. */
export interface AssessmentReport {
  source: 'therapist' | 'in-app-test';
  /** Therapist route: the sounds the therapist wants practiced, as written. May include sounds we cannot score yet. */
  therapistSounds: string[];
  /** Therapist route: goals or notes, with every name removed before it leaves the device. */
  therapistNotes: string;
  /** In-app route: the hearing check. */
  profile: HearingProfile | null;
  /** In-app route: starting accuracy per scored sound, 0 to 1, from the first practice words. */
  baseline: Partial<Record<TargetSound, number>>;
  ageGroup: 'child' | 'teen' | 'adult';
  interests: string[];
  createdAt: string; // ISO timestamp
}
/** Step 3. The three ways the training screen can show a sound. */
export type TrainingView = 'mouth' | 'graph' | 'frequency';
/** One sound in the plan. */
export interface PlanStep {
  sound: string; // "s", "sh", or another sound named in a therapist report
  /** true only when the app can check this sound (it is a TargetSound). false = show how, no verdict. */
  scored: boolean;
  why: string; // one plain sentence for the learner
  stages: PracticeStage[];
  views: TrainingView[];
  words: PracticeWord[]; // empty when not scored
  goal: string; // e.g. "Say the s sound in 8 of 10 words"
}
/** Step 2. The curated plan the brain makes from the report. */
export interface PracticePlan {
  id: string;
  createdAt: string; // ISO timestamp
  source: 'ai' | 'rules'; // rules = built-in fallback when there is no key or the call fails
  summary: string; // two or three plain sentences
  steps: PlanStep[];
}
/** Body of POST /api/plan. Returns a PracticePlan. */
export interface PlanRequest {
  report: AssessmentReport;
}
/** Body of POST /api/feedback. Numbers only: the brain never receives audio. Returns a CoachFeedback. */
export interface FeedbackRequest {
  target: TargetSound;
  word: string;
  recent: AttemptScore[]; // oldest first, newest last, at most 10
  trace?: TraceSummary | null; // the shape of the latest try only
}
/** Steps 3 to 4. What the brain says after a try. */
export interface CoachFeedback {
  source: 'ai' | 'rules';
  message: string; // one or two plain sentences
  cue: string | null; // one thing to change with the mouth, if any
  nextAction: 'repeat' | 'easier' | 'next-word' | 'next-stage';
}
