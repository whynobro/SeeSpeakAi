# The hackathon: rules, deadlines and how we are scored

CPVC x OCOB x CPE AI Hackathon, Cal Poly, Nov 13 to 15, 2026. Every teammate and every AI agent should know this page.

Sources: the judging rubric (dated Nov 9) and judge roster in the Hackathon-Practice repo, and the AI-written notes from the Friday kickoff talk. Items marked **(check)** come only from those notes and may have been misheard. Confirm them in the portal or on Discord before relying on them.

## Deadlines

| When                        | What                                                                            |
| --------------------------- | ------------------------------------------------------------------------------- |
| Sat Nov 14, 2:00 PM         | Submit a working project link **(check: did we do this?)**                      |
| Sat Nov 14, 8:00 PM         | Fill out the 30-second form confirming we are still competing **(check)**       |
| Sun Nov 15, 11:00 AM        | Our own feature freeze. After this, only fixes for broken things.               |
| **Sun Nov 15, 12:00 PM**    | **Final submission closes. Building ends.**                                     |
| Sun Nov 15, 1:00 to 3:00 PM | Room judging **(check times)**                                                  |
| Sun Nov 15, about 3:30 PM   | Finalists announced, then finals on stage in Frost and awards **(check times)** |

Other Sunday times from the kickoff notes **(check)**: breakfast 7:45 AM, pitch workshop 8:30 AM, room slots posted 9:00 AM.

## What we submit

- A live link: https://seespeak.vercel.app
- Access to the repo: https://github.com/whynobro/SeeSpeakAi (public)
- A short description, plus the AI tools we used
- The challenge we chose
- A demo video under two minutes, only if we enter a challenge. A pitch deck is optional.

## Rules

- All project code is written this weekend (Fri 5:00 PM to Sun 12:00 PM). Judges are told to ask what was built this weekend.
- Open-source code, templates and API credits are fine **if disclosed**. Keep a list (see "AI and tools to disclose").
- **No made-up users or data.** Every user quote and every number in the pitch must be real. `docs/pitch/user-tests.md` is the record.
- AI must be used somewhere in the product.
- Teams of 2 to 4. Ours: Michael Fischbach, Holly Steen, Mason Di Leo.

## How we are scored (100 points)

Room judging is 9 minutes: **4 minutes demo, 3 minutes questions**, 2 minutes changeover. Two judges per room, one technical and one business. The same rubric is used at finals.

| Points | Category                | What a top score looks like                                                                  |
| ------ | ----------------------- | -------------------------------------------------------------------------------------------- |
| 25     | Execution and design    | Runs live, nothing faked. Easy to use cold. Looks like a real product.                       |
| 25     | Real problem, real user | A specific person with a painful problem. Real people used it this weekend, with proof.      |
| 20     | Path to customers       | Who pays, how much, why they would switch. Which groups or places the first users come from. |
| 15     | Pitch and demo          | You care within 30 seconds. The demo tells one user's story, live. Sharp, honest answers.    |
| 15     | Creative use of AI      | A use of AI the judges have not seen, and the product depends on it. We can show it.         |

Not scored: how hard the code is, how much AI was used, our majors. Ties go to the higher "Real problem" score, then "Execution and design".

A chatbot added for show scores about 3 of 15 on the AI row. See "What the AI does" in `docs/research.md` for our honest answer.

## Challenges and prizes (from the kickoff notes, check)

- $10,000 total: $4,000 first, $2,000 second, $1,000 third, and $1,000 for each challenge winner.
- OpenAI challenge: build with Codex to help someone.
- Startup launch award: validated demand.
- Best use of AI: the product breaks without the AI.

**Our choice (Saturday, not yet confirmed):** the team thinks we are entering the CPVC challenge. Its exact name is not confirmed: check the portal, then fix this line. Entering a challenge needs a **demo video under two minutes**. Nobody owns the video yet.

## AI and tools to disclose

- Claude Code (Anthropic) wrote most of the code and docs, directed by the team.
- Claude API (Anthropic): the plan and the coach feedback in the app.
- Next.js, React, Tailwind CSS, Vitest, Vercel (hosting and Blob storage).
- MediaPipe Face Landmarker (Google, Apache 2.0): on-device lip tracking
- CMU Pronouncing Dictionary (Carnegie Mellon, BSD-style licence, via the npm package `cmu-pronouncing-dictionary`, ISC): checks every AI-suggested practice word by its sounds
- ChatGPT image generation (OpenAI): the SeeSpeak logo and bird mascot (`public/brand/`). Earlier drafts were also tried in Google Gemini.
- Peachie Speechie "How to say the ... sound" videos (YouTube, by Meredith Avren, speech-language pathologist): embedded on the practice screen for "s", "sh", "z" and "ch". Free videos the owner invites people to share; embedding is allowed. They load only when the learner taps play, from youtube-nocookie.com. Their captions are YouTube's automatic ones.
- Refero Styles, "ORYZO AI" style reference (styles.refero.design): inspiration for theme v2 step 4 (pill buttons, hairline dividers, small capital labels). We kept our own colors and fonts.
- Photos of deaf and hard-of-hearing kids and adults collected from Pinterest by Holly (`public/photos/`, sources in `public/photos/CREDITS.md`). Not ours; shown with a caption, never as our users.
- Google Flow (Google, Omni video model): the kingfisher video on the home screen (`public/home/kingfisher.mp4`), generated by us from a text prompt on Nov 14.
- ChatGPT image generation (OpenAI): the leafy branch picture on the home screen (`public/home/branch.png`), generated by us on Nov 14.
- Branch and kingfisher reference photos from Wikimedia Commons, used only as references, not shown in the app (`docs/design/references/branches/`, authors and licenses in `CREDITS.md`).
- Add anything else you use here on the day you add it.

## What this means for our work

1. 45 of 100 points are about the user and the market. Real users with proof beat more features.
2. The demo runs live from the production link. Never show a faked flow.
3. One user, one story, in 4 minutes.
4. Be ready to show the AI doing something the product needs, live.
5. Have the pricing answer ready: who pays, how much, and the first 10 users by name or place.

## Team decisions so far (from Saturday's team meetings)

- The demo is shown live, not as a video. We demo from a laptop browser.
- Fingerspelling and sign pictures are dropped from the app for this weekend.
- The user is a college-age adult. First outside user: a Cal Poly ASL Club member, Saturday 6:00 PM video call.
- Framing: practice between speech therapy sessions. Never "replaces a speech therapist".
- The learner enters their age group at the start, and the plan and wording follow it.
- Ideas raised, not decided: a feedback prompt inside the app, and reading public forum posts for user needs.

## Help

Discord, the help desk outside the room (HQ is Business 0126), or anyone with an organizer badge.
