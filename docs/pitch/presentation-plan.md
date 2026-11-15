# Presentation plan: deck and demo video

The working file for the pitch deck and the under-2-minute video. Sources for every number are in
[`judge-answers.md`](judge-answers.md) and [`../research.md`](../research.md). Say only what is built.

## How we pitch it (the story, decided Sat Nov 14)

The order of the argument. The deck follows the rubric (Google Slides, "SeeSpeak Pitch (rubric order)"); this is
what we say over it.

1. **It is real.** One number, said plainly: "34 million children worldwide have disabling hearing loss" (WHO).
   Or for the US: "2 to 3 of every 1,000 babies are born with hearing loss" (NIDCD). Sources in
   `judge-answers.md`.
2. **Mason's story** (his own words, only what he is OK sharing in public): he had a speech impediment as a kid,
   and he could hear himself fix it.
3. **The turn** (Michael): "You and I have heard 'cats' thousands of times. Every time we said it wrong, we heard
   the difference and fixed it. A kid with a speech impediment practices the same way: say it, hear it, fix it.
   But if you're hard of hearing, the 's' is the part you can't hear. You can't hear what you're saying. So how
   are you supposed to fix it? SeeSpeak lets you see it."
4. **The gap:** school speech therapy averages 1.7 sessions a week, and 30% of hard-of-hearing kids get no school
   services (Page 2018). SeeSpeak is the practice in between.
5. **The demo, live:** one learner's path: plan, a level, a miss, then a hit, the coach's sentence, progress.
6. **Why it is not dictation:** "Speech recognition gets about 1 word in 5 wrong for deaf adults who use speech,
   against 1 in 20 for hearing adults, and it fills in a missing 's'. So we measure the hiss itself." Keep the
   52.6% figure for questions only: most of those speakers used sign.
7. **Who pays:** free for families, $120 a seat a year for therapists and districts. See `business-model.md`.
   Then the real customer conversations, in their words.
8. **Close:** the link and the QR code.

Do not say: a count of how many times people hear a word ("billions"), a percent of children with "s" errors,
or that the app improves speech. None of those has a source.

## Footage and recordings (read first)

- **Never commit audio or video files to this repo.** Big media goes in a GitHub release (see
  [user-call-nov14](https://github.com/whynobro/SeeSpeakAi/releases/tag/user-call-nov14)) or the team OneDrive.
- **The Zoom call with Yuka (former Cal Poly ASL Club member):** she gave permission to record and use it. Notes
  in `user-call-nov14.md`. Pull exact quotes from the recording, not from Zoom's summary.
- **Demo recording:** a real person on a real phone, from the production link, screen recorded. Never a faked
  try. If a try misses on camera, keep it or retake it; never edit a miss into a hit.

## What "the hiss" means (put this in the deck and the voiceover)

- "s", "sh", "z" and "ch" are hissing sounds: air pushed through a narrow gap makes a rush of noise, like a tire
  leaking.
- What tells them apart is pitch. "s" is a high hiss (about 4 to 8 kHz), "sh" a lower one (about 2 to 4 kHz).
  "z" is the "s" hiss with the voice on. "ch" is a short burst straight into a "sh".
- High pitches are usually the first hearing loss takes. So "cats" can sound like "cat" to the person saying it,
  and they cannot tell that their own "s" is missing.
- The app does not try to understand the word. It listens for the hiss: was it there, where in the word, and
  was it high ("s") or low ("sh")? It shows that on a meter at once.

Slide idea: two noise bands on one pitch line, "sh" lower, "s" higher, and a shaded part marked "often not
heard" over the high end. Words on the slide, so nobody has to hear anything.

## Why not voice dictation (one line for the deck)

"Speech recognition gets about 1 word in 5 wrong even for deaf adults who use speech, against 1 in 20 for
hearing adults, and it fills in a missing 's'. So we measure the hiss instead." (Zhao 2024: 19.7% vs 5.0%.)
The 52.6% figure is real, but most of those 24 speakers used sign, so a technical judge can push back on it.
Use 1 in 5 on the slide, keep 52.6% for questions.

## Pitch deck (backs the live 4-minute demo; optional for submission)

1. **Hook:** "cats" with the "s" fading out. (Holly's opening line in `demo-script.md`.)
2. **The problem:** what the hiss is (above), and why you can't copy a sound you can't hear.
3. **Who:** the user story from `story.md`. The ASL Club president's words, only with her OK.
4. **The gap:** 1.7 school sessions a week, 30% get no school services, 50 students per speech therapist.
5. **The product:** report, then plan, then practice, then levels, then progress. One phone screenshot each.
6. **Why it is honest:** the phone measures, Claude explains. No audio leaves the phone. Not dictation.
7. **Proof:** real numbers from `user-tests.md` this weekend. Blank until we have them.
8. **Who pays:** $120 a seat a year for speech therapists and schools, free for families.
9. **Ask and close:** name, link, QR code.

## Demo video (under 2 minutes, needed only if we enter a challenge)

| Time      | Picture                                                     | Voiceover (draft, record it, then time it)                                                                                                                                      |
| --------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00-0:15 | "cats" on screen, the "s" fades                             | "If you can't hear high sounds, 'cats' sounds like 'cat'. And if you can't hear a sound, you can't copy it."                                                                    |
| 0:15-0:35 | Clip from the ASL Club call (with her OK), or a quote slide | (Her words, unedited in meaning.)                                                                                                                                               |
| 0:35-0:50 | Pitch-line graphic                                          | "'s' is a high hiss. Hearing loss takes high pitches first. Speech therapy helps, but it's about two half-hour sessions a week."                                                |
| 0:50-1:30 | Phone screen recording: plan, a level, a try, the meter     | "SeeSpeak is practice between sessions. You say a word, and the phone shows your hiss at once: there or missing, high or low. Levels go from the sound alone to short phrases." |
| 1:30-1:45 | Coach sentence on screen                                    | "Only the numbers go to Claude, never your voice. It tells you one thing to change and what to try next."                                                                       |
| 1:45-2:00 | Logo, link                                                  | "SeeSpeak. See the sound you can't hear."                                                                                                                                       |

Check the tagline and every line against what is live on Sunday before recording.

## Who does what

| Piece                                 | Who                    |
| ------------------------------------- | ---------------------- |
| Zoom recording upload, her written OK | Michael                |
| Pick her clips, deck text, tagline    | Holly                  |
| Phone screen recording of the demo    | Mason or Michael       |
| Deck build                            | Claude, from this file |
| Voiceover, then edit the video        | Team, Sun morning      |
