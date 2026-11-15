# The demo: what the judges see, step by step

Owner: Michael (flow and tech), Mason (screens), Holly (story, wording, script). Written Sat Nov 14 night. Feature freeze is Sun Nov 15, 11:00 AM. Submission closes 12:00 PM.

This is the app part of the room demo. Holly's `docs/pitch/demo-script.md` is the full 4-minute script and wins if the two disagree. Update both together.

## The flow in one line

The learner brings a speech therapist report and an audiogram (or the app checks them and asks a few questions) -> Claude makes a personal plan -> training with the live sound meter, optional lip camera and a coach sentence after each try -> points, a shop and a streak keep them practicing -> before and after numbers.

## Rules this demo must keep (do not trade these for a better show)

- **Privacy.** Audio and video never leave the device. Claude receives only: the report text with names removed, the audiogram numbers, age group, interests, score numbers and lip numbers (`LipSummary`). The screen says what will be sent before it is sent, and it is sent once.
- **The phone measures, Claude explains.** Claude never decides a verdict. Only "s", "sh", "z" and "ch" are scored. Any other sound in a report shows "show how, no score".
- **No made-up users or data.** The report and audiogram typed in during the demo must be real, from a person who agreed, with names removed. If we have none by Sunday 9 AM, the demo uses the "check me in the app" route with the presenter's own real results. Never type a made-up report and present it as a person.
- **Age changes how it explains, not what it trains.** Same sounds, same scoring and same practice words for every age. The speaking and listening checks use harder words for teens and adults (agreed by Michael, Nov 14). Otherwise only the wording of the plan, the coach sentence and the look change.
- **It works with no key.** If Claude fails, the built-in rules answer (`source: 'rules'`) and the demo goes on.

## Who the demo user is (proposal, Holly decides)

Today the recorded demo user is a **college-age adult** (`docs/pitch/story.md`), and the first real user (Saturday 6 PM call) is a college student. Scoring has only been tested on Michael's adult voice. Children's voices are higher, so the "s" may land differently on the meter.

**Proposal:** aim the look and the rewards at learners about **9 to 14**, where the research and the payer (school districts) are. This is a proposal for Holly to confirm. It needs all three by Sunday 9 AM:

1. A real tester aged 9 to 14, with a parent present who agrees to quotes and numbers (`docs/pitch/user-tests.md` rules).
2. Their voice measured in `/lab`, so Michael can say if "s", "sh", "z" and "ch" score right on a child voice.
3. Holly's OK on the child and teen wording.

If any is missing, the demo user stays the college student and we say: "it adapts its explanations by age group; this weekend we tested on adults." Age-adjusted wording works for every age group either way, because `ageGroup` (`child`, `teen`, `adult`) is already in the report and the plan prompt.

## Step by step

| #   | What the judge sees                                                                                                                                                                                                    | Presenter says (short)                                                                                                                  | Code it uses                                                                                                    | Status                                                                                                            | Owner          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------- |
| 1   | Home: "start with a report" or "check me in the app"                                                                                                                                                                   | "You start one of two ways."                                                                                                            | `HomeStart`                                                                                                     | Built in PR #45 (open)                                                                                            | Mason          |
| 2a  | Report form: paste the therapist's goals, tap the age group, type 4 audiogram numbers (2000, 4000, 6000, 8000 Hz). A "Before you send" box lists exactly what leaves the phone, with names already removed. Send once. | "This is a real report, with the names taken out on the phone. Only this text and these numbers go to Claude."                          | `/report` page, `POST /api/plan` with `AssessmentReport` (`source: 'therapist'`, `profile.source: 'audiogram'`) | Form built in #45. Audiogram fields and name removal to build                                                     | Mason, Michael |
| 2b  | (No report) Hearing check, then the 6-word speaking check, then age group and interests                                                                                                                                | "No report? The app checks you in about two minutes." Tap it to show, do not run it in the room.                                        | `/profile`, `/speech-check`, `POST /api/plan` (`source: 'in-app-test'`, `baseline`)                             | Built (`/profile` on main, `/speech-check` in #45)                                                                | Mason          |
| 3   | Plan: a short summary in age-right words, one card per sound with why and goal, "Made by Claude" or "Built-in plan" label, a start button                                                                              | "Claude turned that into a plan for this person. It can reword and reorder. It cannot invent words or score a sound we cannot measure." | `PlanView`, `PracticePlan.source`, saved plan (`savePlan`, `loadPlan`)                                          | Plan screen built in #45. Source label, saving the plan and "start" opening the plan's words to build             | Mason, Michael |
| 4   | Training: big word, live meter sliding between "sh" and "s", mouth pictures. Say "cat" (missing), "cats" (hit), "ship" for "sip" (close). Result in color, word and icon                                               | "The phone measures the hiss itself, at once. This is not speech recognition."                                                          | `useSoundMeter`, `scoreAttempt`, `VerdictBadge`, `buzz`                                                         | Built on main                                                                                                     | Mason          |
| 5   | A coach sentence under the result a moment later, worded for the age group                                                                                                                                             | "Only the numbers went to Claude. It says what to change, in words for this age."                                                       | `useCoachFeedback().ask(word, score)`, `POST /api/feedback` with `ageGroup`                                     | Hook and route built. Not on the practice screen yet. `ageGroup` in feedback to build                             | Mason, Michael |
| 6   | (Optional) Camera on: a small mirror, and a lip tip such as "round your lips for sh"                                                                                                                                   | "The camera stays on the phone. Only lip numbers, like 'lips rounded', go out."                                                         | `useLipTracker`, `summarizeLips`, `lipHint`, `FeedbackRequest.lips`                                             | Works on `/lab/lips`, thresholds untuned. Practice screen and feedback to build. **Cut if not solid by Sun 9 AM** | Mason, Michael |
| 7   | Points pop up after the try (+3), streak count. Open the shop, buy a meter skin, the meter changes                                                                                                                     | "Points come from practicing, misses too. The shop only sells looks. Nothing is for sale with money."                                   | `@/lib/rewards` (`pointsFor`, `streakFor`, `loadWallet`, `buy`, `equip`), `/shop`                               | To build. **Cut if not solid by Sun 9 AM** (points first, shop second)                                            | Mason, Michael |
| 8   | Progress: before and after per sound                                                                                                                                                                                   | Hand to Holly for the real user's numbers.                                                                                              | `progressFor`, `BeforeAfterBars`                                                                                | Built on main                                                                                                     | Mason, Holly   |

## 3-minute timing (the app part)

Holly's opening (the problem) comes before this and her price and close come after. Times are from the moment the phone frame is on screen.

| Time         | Step                                       | Who     |
| ------------ | ------------------------------------------ | ------- |
| 0:00 to 0:15 | 1. Two ways to start                       | Mason   |
| 0:15 to 0:45 | 2a. Paste report and audiogram, send once  | Mason   |
| 0:45 to 1:10 | 3. The plan from Claude                    | Mason   |
| 1:10 to 2:05 | 4 and 5. Three words, verdicts, coach line | Michael |
| 2:05 to 2:20 | 6. Camera lip tip (skip if cut)            | Michael |
| 2:20 to 2:40 | 7. Points and one shop buy (skip if cut)   | Mason   |
| 2:40 to 3:00 | 8. Progress, hand over to Holly            | Holly   |

If 6 or 7 are cut, give the time to step 4: one more try, so the judge sees the coach sentence change.

## Before walking into the room (Sunday, 15 minutes before)

- Production link open on the demo laptop, phone frame on. Mic and camera already allowed for the site.
- `/lab`: say "sss" and "shh". Both must move the meter the right way on this laptop (issue #29: some laptop mics fail on "s").
- Send one plan on production. It must say "Made by Claude" (`source: 'ai'`). If not, check the key in Vercel.
- The real report text and audiogram numbers ready in a note to paste, names already removed.
- Clear on-device data first (or use a fresh browser profile) so points and progress start from what we show.
- A screen recording of the full flow, made Sunday morning, on the laptop as the last fallback.

## Fallbacks for each risky step

| What fails                    | What we do on stage                                                                                                                                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mic blocked or not picking up | Say so plainly. Reload and allow the mic. Cup a hand around the mic in a noisy room. Switch to the phone (Vercel link). Last resort: play the Sunday recording and say it is a recording.                  |
| "s" never scores on this mic  | Known for some laptop mics (#29). Use the phone or the laptop that passed the `/lab` check. Do not keep retrying on stage.                                                                                 |
| Camera denied or no face seen | The camera is optional. Say "the camera is optional, voice is the main signal" and carry on. The screen must show "camera off" and never an error that blocks practice.                                    |
| Claude slow or down           | Nothing to do: the built-in rules answer in its place. The plan says "Built-in plan". Say: "this one came from our built-in rules; with Claude it is personal to the report." Never pretend it was Claude. |
| Wi-Fi down                    | Phone hotspot for the laptop. The meter and verdicts run on the device, so practice still works. Plan and coach fall back to rules.                                                                        |
| Points or shop broken         | Skip step 7. Go straight to progress.                                                                                                                                                                      |
| A verdict looks wrong         | Say "the phone got that one wrong; we only claim s, sh, z and ch, tested on a few voices." Honest answers score in the pitch row.                                                                          |

## What to build first (rubric points per hour)

| Rank | Task                                                        | Rubric rows it moves           | Hours   | Owner          | Risk                           |
| ---- | ----------------------------------------------------------- | ------------------------------ | ------- | -------------- | ------------------------------ |
| 1    | Real users and their numbers (Holly's lane, not code)       | Real user 25, Path 20          | ongoing | Holly          | Not code, highest value        |
| 2    | Merge #45, then "start" opens the plan's words, plan saved  | Execution 25, AI 15            | 1.5     | Mason, Michael | Low                            |
| 3    | Coach sentence on the practice screen                       | AI 15, Execution 25            | 1       | Mason          | Low                            |
| 4    | Production check: key set, plan says "Made by Claude"       | AI 15, Execution 25            | 0.25    | Michael        | Low                            |
| 5    | Age group in feedback wording                               | AI 15, Pitch 15                | 0.5     | Michael        | Low                            |
| 6    | Name removal on the device, and audiogram numbers to Claude | Execution 25 (judge questions) | 1.5     | Michael        | Low                            |
| 7    | Audiogram fields on the report form                         | Execution 25, Real user 25     | 1       | Mason          | Low                            |
| 8    | Demo-ready pass and two timed run-throughs                  | Pitch 15, Execution 25         | 1.5     | Everyone       | Low                            |
| 9    | Points and a forgiving streak                               | Execution 25                   | 2       | Mason, Michael | Medium: cut by Sun 9 AM        |
| 10   | Shop with cosmetic items                                    | Execution 25                   | 2.5     | Mason          | Medium: cut by Sun 9 AM        |
| 11   | Camera lip tip on practice, lip numbers to Claude           | AI 15                          | 2       | Michael, Mason | High: cut by Sun 9 AM          |
| 12   | Hiss rocket game (#34)                                      | Execution 25                   | 3       | Mason          | High: only if 1 to 10 are done |

## Issues

In order, Mason (`lane:ui`): #51 plan start, #52 coach sentence, #53 audiogram and "Before you send", #35 points and streak, #54 shop, #36 age look, #55 camera lip tip, #56 demo-ready pass. Hiss rocket #34 only after all of those.

Michael (`lane:tech`): #50, the tech gaps in build order. Holly (`lane:content`): #57, the age group, wording per age and whose report we show.
