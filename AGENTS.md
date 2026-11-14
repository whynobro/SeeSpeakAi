# AGENTS.md

Rules for AI coding agents working in this repo. Your user is one of three teammates. Each owns one lane.

## Before you start (every session)

Read [docs/HACKATHON.md](docs/HACKATHON.md) and [docs/PLAN.md](docs/PLAN.md) before you plan or write anything. This is a contest entry. Work that breaks a contest rule or misses a deadline is worth nothing. The short version:

- **Final submission closes Sunday Nov 15, 12:00 PM Pacific.** Our own feature freeze is 11:00 AM. If a task cannot be finished and merged before then, tell your user and cut it down.
- **Never make up users, quotes, test results or numbers.** Not in the app, not in docs, not in the pitch, not as sample data that could be mistaken for real. If you do not have a real one, leave a clearly marked blank and tell your user.
- **Everything is built this weekend.** Do not copy in older project code. Open-source libraries are fine: add any new one to the disclosure list in `docs/HACKATHON.md`.
- **Weigh every task against the rubric** in `docs/HACKATHON.md`. 45 of 100 points are for real users and a path to customers, 25 for a live, working, easy product. Tell your user when a task does not help any row.
- **The demo is live, from the production link.** Never fake a flow. Never leave `main` broken.

## Safety rules (read first)

1. **Stay in your user's lane folders.** Ask your user which lane they own. Lanes:
   - Michael (`whynobro`), tech: `src/lib/`, `src/hooks/`, `src/app/api/`, `src/app/lab/`, env and keys
   - Mason (`dileomason-stack`), screens: `src/app/` pages (all but `api/` and `lab/`), `src/components/`, `public/`, styling
   - Holly (`steenholly12`), content and pitch: `src/content/`, `docs/pitch/`, `docs/research.md`
2. **Hot files** are shared: `src/lib/types.ts`, `package.json`, `src/app/layout.tsx`, `src/app/globals.css`. Tell your user to announce in team chat before you edit one. Keep the change tiny.
3. **Do not change `src/lib/types.ts` without your user's OK.** It is the contract between all three lanes.
4. **Never commit to `main`.** Work on a branch named `<lane>/<task>` (`tech`, `ui`, `content`). Open a pull request. Never force-push.
5. **No secrets.** Never write keys, tokens or `.env*` files (except `.env.example`) into the repo. The repo is public. `ANTHROPIC_API_KEY` is server-side only and must never reach browser code.
6. **Do not reformat or "clean up" files outside the task.** No drive-by renames, no mass formatting, no dependency upgrades.
7. **Privacy:** never upload or store audio. Sound analysis stays in the browser. Settings and practice history stay on the device (`localStorage`). The server (and the AI behind it) may receive the report with every name removed, target sounds, interest topics and score numbers. Never a name, never a voice. Tell the learner on screen before a report or photo is sent. Send it once. Store nothing on the server. One exception: the shared test log (`src/lib/testlog/`), which is off unless a tester switches it on at `/lab` on their own device. It stores score numbers and sound measurements, never audio and never a full name. Do not switch it on by default and do not add it to learner screens.
8. **Honest scoring.** The phone measures, the brain explains: Claude never receives audio and never decides a verdict. The app scores only the sounds in `TargetSound`; any other sound in a plan is `scored: false` and gets no verdict. Do not add whole-word speech recognition to judge pronunciation (it fails on deaf speech and "autocorrects" missing sounds). Do not claim a sound is scored until `src/lib/scoring` has tests for it.
9. **Respect.** Never write text that frames a learner as broken or as someone to "fix". This is opt-in practice between speech therapy sessions. It is not therapy, not a diagnosis and not a hearing test. Sign language is welcome and sign cards are optional.
10. Do not add dependencies without telling your user (`package.json` is a hot file).

## Next.js 16 warning

This is Next.js 16 (App Router). It has breaking changes versus older versions you may know. Before writing framework code (routes, layouts, caching, params, metadata), read the docs shipped with the installed version in `node_modules/next/dist/docs/` (start at `index.md`, then `01-app/`). If that folder is missing, check the current Next.js docs online. Do not guess from memory.

Tailwind is v4 and React is 19. Check their docs when unsure.

## Code map

| Path                | Purpose                                                                      | Lane    |
| ------------------- | ---------------------------------------------------------------------------- | ------- |
| `src/lib/types.ts`  | Shared contract (hot file)                                                   | all     |
| `src/lib/audio/`    | Mic capture (`mic.ts`), FFT, sound features per frame                        | tech    |
| `src/lib/scoring/`  | `readFrame`, `scoreAttempt`, `summarizeTrace`, thresholds, test sounds       | tech    |
| `src/lib/profile/`  | `pickTargets(profile)`: hearing profile to sounds to practice                | tech    |
| `src/lib/store/`    | On-device storage and `progressFor`                                          | tech    |
| `src/lib/testlog/`  | Opt-in shared test log (`/lab` switch), sends try numbers to `/api/attempts` | tech    |
| `src/lib/feedback/` | Vibration patterns                                                           | tech    |
| `src/lib/ai/`       | The brain: `buildPlan`, `buildFeedback` (server only), rule fallbacks        | tech    |
| `src/hooks/`        | `useSoundMeter` (listen), `useCoachFeedback` (the brain's sentence)          | tech    |
| `src/app/api/`      | `POST /api/plan`, `POST /api/feedback`, `POST /api/practice-list`            | tech    |
| `src/app/lab/`      | Debug page for tuning on real voices                                         | tech    |
| `src/app/page.tsx`  | Landing page                                                                 | screens |
| `src/app/profile/`  | Hearing profile (Ling Six check, settings)                                   | screens |
| `src/app/practice/` | Practice loop: word, live meter, verdict                                     | screens |
| `src/app/progress/` | Before and after numbers                                                     | screens |
| `src/components/`   | Shared UI: `SoundMeter`, `VerdictBadge`, `WordCard`                          | screens |
| `src/content/`      | Word bank, how-to cues, interface wording                                    | content |
| `docs/PLAN.md`      | The loop and who builds what. Read it first.                                 | all     |
| `docs/HACKATHON.md` | Contest rules, deadlines, rubric, what we submit. No made-up users or data.  | all     |
| `docs/lanes/`       | One build file per lane                                                      | all     |
| `docs/research.md`  | Facts, sources and what we must not claim                                    | content |
| `docs/pitch/`       | Demo script, rubric tracking, user test log                                  | content |

## Data flow

The loop is in [docs/PLAN.md](docs/PLAN.md): report -> plan -> training -> feedback -> goal.

`AssessmentReport` (therapist report or in-app test) -> `POST /api/plan` -> `PracticePlan` (steps with words) -> learner says a word -> `startMic` -> `FrameFeatures` about 50 times a second -> `readFrame` (live `SoundReading` for the meter) -> on stop, `scoreAttempt(frames, word)` -> `AttemptScore` (hit, close or miss) -> `VerdictBadge` and `buzz` -> `saveAttempt` -> `POST /api/feedback` with the recent scores -> `CoachFeedback` (what to change, what next) -> `progressFor` -> progress screen.

Screens never touch the mic or the math directly. They call `useSoundMeter` and functions from `src/lib/`.

## Commands

| Command             | Use                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `npm run dev`       | Dev server                                                                                              |
| `npm run lint`      | ESLint                                                                                                  |
| `npm run typecheck` | TypeScript check                                                                                        |
| `npm test`          | Vitest                                                                                                  |
| `npm run build`     | Production build                                                                                        |
| `npm run format`    | Prettier on the whole repo. Prefer `npx prettier --write <your files>` so you do not touch other lanes. |

CI job `check` runs lint, typecheck, test and build. All must pass before merge.

## Conventions

- Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `test:`.
- TypeScript strict. No `any` unless unavoidable and commented.
- Mobile-first. Big touch targets, high contrast, large type.
- Color must never be the only signal. Always add a word or an icon. Sound must never be the only signal either: our users may not hear it.
- Vibration (`navigator.vibrate`) works on Android only. iPhone has no vibration API. Every vibration needs a visual twin.
- Every tunable number in scoring lives in `src/lib/scoring/constants.ts` with a comment. Change a threshold only with a test or a `/lab` measurement to back it.
- Plain English in docs, comments and interface text.
- Keep the live demo working. If a key is missing or a call fails, fall back to the built-in word bank. Never crash.
- Small pull requests, one task each.
- No em dashes in text you write.

## Maintaining this file

- Cap: 150 lines. Never raise it. If over, move something out in the same pull request.
- Rules and current config only. Long explanations go in `docs/`, with a one-line pointer here.
- Update this file in the same pull request as any change it describes (new folder, new command, new rule).
- Keep it true now: delete stale lines, do not mark them "old".
