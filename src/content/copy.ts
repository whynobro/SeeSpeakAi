export const COPY: { tagline: string; notTherapy: string; privacy: string; optIn: string } = {
  tagline: 'Practice the speech sounds your ears miss.',
  notTherapy:
    'SeeSpeak is extra practice that you choose, for the days between speech therapy sessions or when a therapist is hard to reach. It starts with a quick hearing check and a speaking check. It is not therapy, not a diagnosis and not a medical hearing test.',
  privacy:
    'Your voice is checked on this device. It is never uploaded or saved. Your hearing profile and practice history stay on this device too.',
  optIn: 'For people who choose to work on spoken English. Sign language is welcome here.',
};

/** Words for a lisped "s" or "z" (score.lisp). The badge shows title + detail; the coach says `message`. */
export const LISP_COPY = {
  title: 'Close: that sounded like a lisp',
  detail: 'Keep your tongue behind your teeth.',
  message: 'Close: that sounded like a lisp. Keep your tongue behind your teeth.',
  meter: 'sounds like a lisp',
} as const;
