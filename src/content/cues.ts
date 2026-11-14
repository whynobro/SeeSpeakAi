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
    nickname: 'the thin air sound',
    steps: [
      'Bring your teeth almost together.',
      'Smile a little.',
      'Lift the tip of your tongue to the bumpy spot behind your top front teeth. Get near it. Do not press.',
      'Rest the sides of your tongue on your top back teeth.',
      'Blow a thin line of air down the middle of your tongue.',
    ],
    shaping:
      'Say "t, t, t" fast. On the last one, keep the air going: "t, t, t, tsss". Watch the meter stay on "s".',
    touch: 'Hold a finger just in front of your lips. You feel a thin line of air in the middle.',
  },
  sh: {
    sound: 'sh',
    nickname: 'the wide air sound',
    steps: [
      'Bring your teeth almost together.',
      'Round your lips and push them forward.',
      'Pull your tongue back a little from the "s" spot.',
      'Blow a wide, soft stream of air.',
    ],
    shaping:
      'Start with a long "s". Slowly round your lips and slide your tongue back. Watch the meter move from "s" to "sh".',
    touch: 'Hold your hand just in front of your lips. The air feels wide and soft, not a thin line.',
  },
};
