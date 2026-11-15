# Presentation plan: deck and demo video

The working file for the pitch deck and the under-2-minute video. Sources for every number are in
[`judge-answers.md`](judge-answers.md) and [`../research.md`](../research.md). Say only what is built.

## Footage and recordings (read first)

- **Never put audio or video files in this repo.** It is public. Raw files go in the team's shared OneDrive
  `Hackathon` folder. Only the finished video's link goes here.
- **The Zoom call with the ASL Club president:** before any clip of her goes in the deck or the video, get her
  OK in writing for that exact use (public video, judges, our site). Log it in `user-tests.md`. No OK, no clip:
  quote her words on a slide without her name, only if she agrees to that.
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
