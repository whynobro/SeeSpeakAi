import type { AudiogramHz, HearingProfile, TargetPick, TargetSound } from '@/lib/types';

/**
 * Audiogram cut-offs in dB HL (bigger = worse hearing). A mean above HIGH means the sound is likely
 * hard to hear, from SOME up to HIGH is borderline, below SOME is likely heard. These are a starting
 * rule of thumb, NOT a clinical standard.
 */
export const AUDIOGRAM_HIGH_DB = 55;
export const AUDIOGRAM_SOME_DB = 35;

/** Which audiogram frequencies stand in for each sound. "s" lives higher than "sh". */
const AUDIOGRAM_HZ: Record<TargetSound, AudiogramHz[]> = {
  s: [4000, 6000, 8000],
  sh: [2000, 4000],
  z: [4000, 6000, 8000], // "z" follows "s": the same hiss, with the voice on
  ch: [2000, 4000], // "ch" follows "sh": it ends in the same hiss
};

/** Things the hearing profile cannot tell us. Show these on the profile screen. */
export const PROFILE_LIMITATIONS: string[] = [
  'A phone speaker is not calibrated, so the sound check is a quick screen and not a hearing test.',
  'Turning an audiogram into "which sounds are hard" is a rule of thumb, not a clinical standard.',
  'Hearing with hearing aids or a cochlear implant on can differ a lot from an audiogram taken without them.',
  'Ask an audiologist for a real hearing test.',
];

type Risk = TargetPick['risk'];
const RISK_RANK: Record<Risk, number> = { high: 0, some: 1, low: 2 };

function fromLing(ling: NonNullable<HearingProfile['ling']>): TargetPick[] {
  const heardS = ling.s;
  const heardSh = ling.sh;
  const s: TargetPick = heardS
    ? {
        sound: 's',
        risk: 'low',
        reason: 'You heard the "s" sound in the check, so you may hear it well enough to practice.',
      }
    : {
        sound: 's',
        risk: 'high',
        reason: heardSh
          ? 'You did not hear the "s" sound in the check, so you may not hear sounds at or above 4 kHz well.'
          : 'You did not hear the "s" or "sh" sounds in the check, so high sounds are likely hard for you to hear.',
      };
  const sh: TargetPick = heardSh
    ? {
        sound: 'sh',
        risk: 'low',
        reason: 'You heard the "sh" sound in the check, so you may hear it well enough to practice.',
      }
    : {
        sound: 'sh',
        risk: 'high',
        reason: 'You did not hear the "sh" sound in the check, so you may not hear sounds above 2 kHz well.',
      };
  return [s, sh];
}

function meanOf(values: number[]): number | null {
  return values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;
}

function fromAudiogram(thresholds: NonNullable<HearingProfile['thresholdsDb']>): TargetPick[] {
  return (['s', 'sh'] as const).map((sound): TargetPick => {
    const present: number[] = [];
    for (const hz of AUDIOGRAM_HZ[sound]) {
      const v = thresholds[hz];
      if (typeof v === 'number' && Number.isFinite(v)) present.push(v);
    }
    const mean = meanOf(present);
    if (mean === null) {
      return {
        sound,
        risk: 'some',
        reason: `Your audiogram has no numbers for the pitches the "${sound}" sound uses, so this one is a guess.`,
      };
    }
    const rounded = Math.round(mean);
    if (mean > AUDIOGRAM_HIGH_DB) {
      return {
        sound,
        risk: 'high',
        reason: `Your audiogram averages about ${rounded} dB at the pitches of the "${sound}" sound, so it is likely hard to hear.`,
      };
    }
    if (mean >= AUDIOGRAM_SOME_DB) {
      return {
        sound,
        risk: 'some',
        reason: `Your audiogram averages about ${rounded} dB at the pitches of the "${sound}" sound, so it may be hard to hear at times.`,
      };
    }
    return {
      sound,
      risk: 'low',
      reason: `Your audiogram averages about ${rounded} dB at the pitches of the "${sound}" sound, so you likely hear it.`,
    };
  });
}

/** Pick which sounds to practice from what the learner can hear. Always returns both sounds, riskiest first. */
export function pickTargets(profile: HearingProfile): TargetPick[] {
  const fromLingProfile = (): TargetPick[] | null => (profile.ling ? fromLing(profile.ling) : null);
  const fromAudiogramProfile = (): TargetPick[] | null =>
    profile.thresholdsDb ? fromAudiogram(profile.thresholdsDb) : null;

  // Use the source the profile says, and fall through to the other one if it is missing.
  const picks =
    (profile.source === 'audiogram'
      ? (fromAudiogramProfile() ?? fromLingProfile())
      : (fromLingProfile() ?? fromAudiogramProfile())) ??
    (['s', 'sh'] as const).map((sound): TargetPick => ({
      sound,
      risk: 'some',
      reason: `The hearing check has not been done yet, so I cannot say how well you hear the "${sound}" sound.`,
    }));

  // Riskiest first. Array sort is stable, so ties keep "s" before "sh".
  return [...picks].sort((a, b) => RISK_RANK[a.risk] - RISK_RANK[b.risk]);
}
