import type { TargetSound } from '@/lib/types';

export interface SoundCue {
  sound: TargetSound;
  nickname: string;
  steps: string[];
  shaping: string;
  touch: string;
}

/** Plain, standard speech-practice cues for each sound. */
export const CUES: Record<TargetSound, SoundCue> = {
  s: {
    sound: 's',
    nickname: 'the snake sound',
    steps: [
      'Close your teeth so they are close together.',
      'Smile so your lips pull back.',
      'Put the tip of your tongue just behind your top teeth, not touching them.',
      'Push a thin stream of air down the middle of your tongue.',
    ],
    shaping: 'Say "t, t, t" fast, then "ts", then hold the hiss: "tsssss".',
    touch: 'Hold a hand in front of your mouth. The air is a thin, cool stream in the center.',
  },
  sh: {
    sound: 'sh',
    nickname: 'the quiet sound',
    steps: [
      'Round your lips and push them forward.',
      'Pull your tongue back a little.',
      'Let a wider stream of air out.',
    ],
    shaping:
      'Start from "s", then slowly round your lips and pull the tongue back until the hiss gets lower.',
    touch: 'Hold a hand in front of your mouth. The air is wider and warmer.',
  },
};
