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
  z: {
    sound: 'z',
    nickname: 'the buzzy snake',
    steps: [
      'Make your mouth just like for "s": teeth almost together, a little smile, tongue tip near the bumpy spot.',
      'Blow a thin line of air down the middle of your tongue.',
      'Now turn your voice on, so it buzzes.',
      'Put a hand on your throat. You should feel it buzz.',
    ],
    shaping: 'Say "sss", then turn your voice on in the middle: "sss-zzz". Keep the mouth the same.',
    touch: 'Put a hand on your throat. For "z" it buzzes. For "s" it stays still.',
  },
  ch: {
    sound: 'ch',
    nickname: 'the sneeze sound',
    steps: [
      'Start with your tongue up, like you are about to say "t".',
      'Let the tongue go with a little pop of air.',
      'Right away, round your lips and let it turn into a short "sh".',
      'Keep it short and quick, like a sneeze: "ch".',
    ],
    shaping: 'Say "t" and then "sh" fast: "t-sh, t-sh, ch". Squeeze them closer together each time.',
    touch: 'Hold your hand in front of your lips. You feel a small pop, then a short, soft puff of air.',
  },
};
