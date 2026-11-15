/*
 * Wording for the home page sections below the start choices (design direction, issue #59).
 * For the content owner. Plain words, no claims beyond docs/research.md.
 */

export const LANDING = {
  whoTitle: 'Who it is for',
  who: [
    { title: 'Kids, 5 to 11', body: 'Short words with pictures and a grown-up close by.' },
    {
      title: 'Teens, 12 to 17',
      body: 'Harder words, real numbers, and the camera stays off unless you want it.',
    },
    {
      title: 'Adults, 18 and up',
      body: 'Everyday words for calls and meetings. You can type in hearing test numbers.',
    },
  ],
  privacyTitle: 'Your voice stays on your phone',
  privacy: [
    'Sound is measured on this device. It is never uploaded or saved.',
    'The camera is optional and never records.',
    'Only numbers and your goals, with names taken out, go to our AI, and only when you tap Send.',
  ],
  proTitle: 'For parents and speech therapists',
  pro: [
    'Targets come from the learner’s own hearing check or a therapist report.',
    'The app only scores sounds it can measure: "s", "sh", "z" and "ch". Anything else is shown, not scored.',
    'It is extra practice between sessions. It is not therapy, not a diagnosis and not a hearing test.',
  ],
  faqTitle: 'Questions',
  faq: [
    {
      q: 'How does it know if I said the sound?',
      a: 'The phone measures the hiss of the sound itself: whether it is there, where in the word, and which hiss it is. It does not use speech recognition.',
    },
    {
      q: 'What does the AI do?',
      a: 'It turns your check results and goals into a plan and writes a short tip after each try. It never hears your voice and never decides if a try was right.',
    },
    {
      q: 'Do I need hearing aids or an implant?',
      a: 'No. Use the app the way you usually listen. The listening check asks so it can compare runs fairly.',
    },
    {
      q: 'Is sign language welcome?',
      a: 'Yes. See Speak AI is for people who choose to practice spoken English. It does not replace sign language.',
    },
  ],
};
