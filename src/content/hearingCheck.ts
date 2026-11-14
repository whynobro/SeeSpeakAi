/*
 * Wording for the hearing check. For the content owner.
 *
 * Honest limit: no phone, speaker or earbud makes this a calibrated hearing test. Headphones and a fixed
 * setup make the result more repeatable from one day to the next, which is what practice needs. Only an
 * audiologist's test, or a test built for one exact device (for example Apple's hearing test with AirPods
 * Pro, which saves an audiogram to the Health app), gives real decibel numbers. Those numbers can be typed in.
 */

export const HEARING_CHECK = {
  title: 'Hearing check',
  intro:
    'A quick check of which speech sounds you can hear. It is not a medical hearing test. Use the same setup each time so your results can be compared.',
  setupHeadphones: [
    'Find a quiet room.',
    'Use headphones or earbuds if you have them. Use the same ones each time.',
    'Set the volume to half, and keep it there.',
    'To check one ear at a time, wear one earbud.',
  ],
  setupNoHeadphones: [
    'Find a quiet room.',
    'Put the phone on a table about an arm’s length away, screen facing you.',
    'Set the volume to half, and keep it there.',
  ],
  setupHelper:
    'If a helper says the sounds, they stand about 1 metre away, cover their mouth, and use a normal voice.',
  devicesQuestion: 'Do you use hearing aids or a cochlear implant?',
  withDevices: 'Check with my hearing aids or implant on',
  withoutDevices: 'Check with them off',
  bothExplain:
    'Doing both gives a fuller picture: "on" is what you hear when you practice, and "off" shows which sounds your devices help most.',
  realNumbers:
    'Have a hearing test from an audiologist, or from Apple’s hearing test with AirPods Pro? Type in those numbers instead. They are more exact than this check.',
};
