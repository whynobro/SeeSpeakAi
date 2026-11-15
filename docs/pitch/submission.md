# Submission: what we paste into the form

Owner: Holly. Status: DRAFT for the team to check on Sunday morning. The form closes **Sunday Nov 15 at 12:00 PM**.
Check every line against what is live before pasting. Sources: `docs/HACKATHON.md` and the participant guide
(cpvc-ai-hackathon-guide.vercel.app). If the guide and Discord differ, Discord wins.

## Sunday times (from the participant guide)

| Time            | What                                                          |
| --------------- | ------------------------------------------------------------- |
| 7:45 AM         | Breakfast                                                     |
| 8:30 AM         | Pitch workshop                                                |
| **By 10:00 AM** | **Check in at our judging room**                              |
| 11:00 AM        | Our own feature freeze                                        |
| **12:00 PM**    | **Submissions close**                                         |
| **By 12:55 PM** | **Back in our judging room**                                  |
| 1:00 to 3:00 PM | Room judging in Cotchett: 4 minutes demo, 3 minutes questions |
| 3:00 PM         | Challenge shortlists                                          |
| 3:30 PM         | Finalists announced                                           |
| 4:10 PM         | Finals in Frost 181-0103                                      |
| 5:30 PM         | Awards                                                        |

## What the form asks for

1. **Live link:** https://seespeak.vercel.app
2. **Project link:** https://github.com/whynobro/SeeSpeakAi
3. **Short description** (below)
4. **AI tools used** (below)
5. **Challenge pick** (below). A challenge entry also needs a **demo video under 2 minutes**.
6. **Demo video:** https://github.com/whynobro/SeeSpeakAi/releases/tag/demo-video (2:13, no music).
7. **Pitch deck (optional):** https://github.com/whynobro/SeeSpeakAi/releases/tag/pitch-deck (PDF, 7 slides).

[check with Michael: were the Saturday 2 PM project link and the Saturday 8 PM "Sunday commit" form sent? The
guide says no Sunday commit means no judging slot. The repo has no record of either.]

## Short description (about 90 words)

> SeeSpeak AI is speech practice for kids who are hard of hearing, for the days between speech therapy sessions.
> High sounds like "s" are often the ones a child cannot hear, so "sip" can drift toward "ship" and they cannot
> tell. SeeSpeak shows the sound on screen while they talk: the phone measures the hiss itself, and Claude turns a
> hearing check or a therapist's report into a personal practice plan and one plain tip after each try. A speech
> therapist can send practice by link and get a summary back. The voice never leaves the phone.

Shorter, if the box is small:

> See the speech sounds you cannot hear. SeeSpeak AI measures the "s" and "sh" hiss on your phone, shows it live,
> and uses Claude to build a personal practice plan between speech therapy sessions. Your voice never leaves
> the phone.

## AI tools used (paste this list)

- Claude Code (Anthropic): wrote most of the code and docs, directed by the team.
- Claude API (Anthropic), inside the app: builds the practice plan from a hearing check or a therapist's report,
  writes the one-sentence tip after each try, and gives a closer look when a learner is stuck.
- ChatGPT image generation (OpenAI): the logo, the bird mascot and the leafy branch picture.
- Google Flow: the kingfisher video on the home screen.
- MediaPipe Face Landmarker (Google, open source): lip tracking on the device.
- faster-whisper (open source): the text transcript of our own user call, to find exact quotes.

The full list with licenses, including the open-source libraries and the photo credits, is in `docs/HACKATHON.md`.

## Challenge pick: a decision for Michael

One challenge per team, and it is optional. Each winner gets $1,000.

| Challenge                                     | What it asks                             | Fit                                                                                                                                                                                                                                           |
| --------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Best Use of AI (Cal Poly Vibe Coding)         | "Build something that breaks without AI" | **Weak.** Our honest answer in `demo-script.md` is that the app still runs on the built-in word bank without Claude, and the scoring is plain signal measuring on purpose. A judge for this challenge will ask exactly that.                  |
| Startup Launch Award (Cal Poly Entrepreneurs) | Test real demand for a solution          | **Better, with one gap.** We have a recorded user call, a feature built from it the same night (the therapist link), a price with two comparables, and a clear payer. The gap: no speech therapist or school program has said they would pay. |
| OpenAI challenge                              | Must be built with Codex                 | Not open to us: we built with Claude Code.                                                                                                                                                                                                    |

Holly's suggestion: **Startup Launch Award**, or no challenge. Entering none costs nothing in the main judging.
If we enter one, someone must own the video by 10 AM: the shot list is in `presentation-plan.md` and Yuka's clips
with times are in `user-call-nov14.md`.

## Before pasting, check

- [ ] The live link opens on a phone and on the demo laptop, and "Try it now" works with the microphone.
- [ ] No API key or Vercel settings page is visible in the video.
- [ ] Every number and quote in the description, the deck and the video is in `docs/research.md` or `user-tests.md`.
- [ ] The commit history is left as it is (the rules ask us to keep it until prizes are paid).
