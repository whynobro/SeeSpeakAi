# The plan: how SeeSpeak works, and who builds what

Decided Saturday Nov 14. Read this first. It replaces any older idea of the flow.

## The loop

```
1. REPORT                2. CURATED PLAN            3. TRAINING                4. GOAL
speech therapist   -->   the brain (Claude)   -->   mouth, graph,        -->   better
report, OR the           picks sounds, words        frequency                  pronunciation
test in the app          and steps                      |        ^
                               ^                        v        |
                               +---- scores from each try go back to the brain,
                                     which says what to change and what to do next
```

1. **Report.** The learner starts one of two ways:
   - **Speech therapist report:** type in (or later, photograph) what the therapist wants practiced: the sounds and the goals.
   - **Test in the app:** the hearing check plus a few starting words. The app makes the report itself.
2. **Curated plan.** The report goes to the brain: Claude (`claude-sonnet-5-5`), called from our server with our API key. It returns a plan: which sounds, in what order, which words, what the goal is for each. Claude also suggests words that fit the learner's interests, and a pronunciation dictionary checks every one before it is used.
3. **Training.** The learner works through the plan on the training screen. Three views of the same sound:
   - **Mouth:** pictures of where the tongue and lips go.
   - **Graph:** their sound drawn live next to the target.
   - **Frequency:** the meter that slides between "sh" and "s".
     After each try, the scores go back to the brain. It says, in plain words, what happened and what to change, and decides the next step: again, easier, next word, next stage.
4. **Goal.** Better pronunciation, shown as before and after numbers for each sound.

## Three things that keep this honest (read before you build or pitch)

- **The phone measures. The brain explains.** Claude cannot hear audio. The phone measures the sound (was the hiss there, which hiss, how long) and gives an instant verdict. Those numbers, never the audio, go to the brain, which turns them into feedback and plan changes. So the instant color and vibration come from the phone, and the brain's sentence arrives a moment later. The brain now also receives the shape of the sound over the word (a handful of numbers such as how the hiss drifted and how steady it was), still never the audio.
- **Only "s", "sh", "z" and "ch" get a verdict today.** A therapist report can name any sound. The plan includes it, but marks it "show how, no score" (`scored: false`) unless it is one of those four. Never show a verdict for a sound we cannot measure.
- **It works with no key.** Every brain call has a built-in fallback (`source: 'rules'`). No key or a failed call must never break the demo.

## Who builds what

| Step            | Michael (tech)                                      | Mason (screens)                                                  | Holly (content, users, pitch)                               |
| --------------- | --------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| 1. Report       | Report data, name removal, starting test scores     | "Therapist report" form and "Test in the app" flow               | What a real therapist report says. Which fields we ask for. |
| 2. Curated plan | `POST /api/plan`: Claude call, checks, fallback     | Plan screen: sounds, why, goal, a start button                   | Checks the plans read right for a real learner              |
| 3. Training     | Mic, scoring, `useSoundMeter`, `POST /api/feedback` | Training screen: mouth, graph and frequency views, feedback card | Mouth cue text, practice words, the tone of the feedback    |
| 4. Goal         | Progress numbers                                    | Progress screen                                                  | Real users, before and after numbers, the story, the pitch  |

## What is already built (on `main`)

- The shared contract in `src/lib/types.ts`: `AssessmentReport`, `PracticePlan`, `PlanStep`, `TrainingView`, `FeedbackRequest`, `CoachFeedback`.
- `POST /api/plan` and `POST /api/feedback`: both work today using built-in rules. The Claude calls slot into `src/lib/ai/plan.ts` and `src/lib/ai/feedback.ts`.
- The measuring: mic, s, sh, z and ch scoring, live meter, `/lab` tuning page.
- Plain versions of the profile, practice and progress screens.

## How the team and the AI agents work together

- **GitHub is the shared brain for the team.** Everything a teammate needs is in this repo. Nothing important lives only in one person's chat.
- **Each person runs their own AI agent in their own copy of the repo.** The agents do not talk to each other. They stay in sync because they all read the same files:
  1. `AGENTS.md`: the rules and each lane's folders (Claude Code reads it through `CLAUDE.md`).
  2. Your lane file in `docs/lanes/`.
  3. This file, and `docs/HACKATHON.md` (contest rules, deadlines, rubric).
  4. `src/lib/types.ts`: the contract every lane builds against.
- **Scope is by folder.** Michael: `src/lib/`, `src/hooks/`, `src/app/api/`, `src/app/lab/`. Mason: screens in `src/app/`, `src/components/`, `public/`. Holly: `src/content/`, `docs/pitch/`, `docs/research.md`. An agent that needs something outside its folders asks its person, who asks the owner.
- **Work flows through issues and pull requests.** Pick an issue with your lane label, branch, open a pull request, wait for the green check, squash merge. Then everyone runs `git pull origin main`.
- **To start:** "Read AGENTS.md, docs/HACKATHON.md, docs/PLAN.md and docs/lanes/<your file>, then do issue #N."
- **When the plan changes:** change this file and the contract in one pull request, and post the link in team chat.
