# Lane: Tech + integration (Michael)

Hand this file to your AI agent. Say: "Read AGENTS.md and docs/lanes/tech.md, then do issue #N."

## Goal

A real person says a word into a phone and gets a verdict they can trust: the target sound was there, it was the other hiss, or it was missing. Everything the screens need comes from typed functions in `src/lib/` and the `useSoundMeter` hook.

## What already exists

- `src/lib/types.ts`: the shared contract.
- `src/lib/audio/`: `startMic` (mic with browser sound processing switched off), `fft.ts`, `features.ts` (`featuresFromFrame`, `featuresFromSamples`).
- `src/lib/scoring/`: `readFrame` (live meter), `scoreAttempt` (verdict for one word), `LIMITATIONS`, `constants.ts` (every threshold), `synth.ts` (test sounds). Unit tests run on synthetic sounds only.
- `src/lib/profile/`: `pickTargets(profile)` from a Ling Six check or audiogram thresholds.
- `src/lib/store/`: on-device storage and `progressFor`.
- `src/lib/feedback/`: `buzz(verdict)`, `canVibrate()`.
- `src/lib/ai/plan.ts` and `POST /api/plan`: report to curated plan. `src/lib/ai/feedback.ts` and `POST /api/feedback`: recent scores to feedback. Both run on built-in rules today, with a marked place for the Claude call.
- `src/lib/ai/practiceList.ts` and `POST /api/practice-list`: return the built-in word bank for now.
- `src/hooks/useSoundMeter.ts`: start, stop, live reading, captured frames.
- `/lab`: live numbers behind the meter, and "score as" for a captured recording.

## The plan

Read [docs/PLAN.md](../PLAN.md) first: report -> curated plan -> training -> feedback -> goal. Your part is the measuring and the brain.

## Build list (in priority order)

0. **The brain (do this right after item 1).**
   Put `ANTHROPIC_API_KEY` in Vercel. In `src/lib/ai/plan.ts`, call Claude (`claude-opus-5-5`) to turn an `AssessmentReport` into a `PracticePlan`. In `src/lib/ai/feedback.ts`, call Claude with the recent scores to write a `CoachFeedback`. Both already work from built-in rules: keep those as the fallback, check everything Claude returns, and never let a sound that is not "s" or "sh" be marked `scored: true`.
   Done when: with a key, `/api/plan` and `/api/feedback` return `source: 'ai'`; without one they return `source: 'rules'`; feedback comes back in under 3 seconds or falls back.

1. **Tune on real voices.**
   Open `/lab` on a phone (Vercel link). Have 5 people (men, women, a child if possible) say "sss", "shh", "cat", "cats", "sip", "ship". Write down the centroid numbers. Set the anchors and thresholds in `src/lib/scoring/constants.ts` from the data.
   Done when: "cat" vs "cats" and "sip" vs "ship" come out right at least 8 times in 10 for each tester, in a quiet room, and the numbers are logged in `docs/research.md`.

2. **iPhone and noise check.**
   Test the mic on an iPhone (Safari may still filter the sound) and in a noisy room. Add a short "measuring room noise" step if needed, and a clear "too noisy" warning.
   Done when: the app works or fails with a plain message on iPhone Safari, Android Chrome and a laptop.

3. **Vibration twin for iPhone.**
   `navigator.vibrate` does not exist on iPhone. Give Mason a `feedback` function that reports what was done, so the screen can always show a visual pulse. Try the Safari switch-toggle haptic trick only if time allows.
   Done when: every verdict produces feedback on both phone types.

4. **Claude practice list.**
   In `src/lib/ai/practiceList.ts`: when `ANTHROPIC_API_KEY` is set, ask Claude for words around the learner's target sounds and interests. Validate every word against the rules at the top of `src/content/words.ts` (voiceless hiss only, no spelling traps). On any error, fall back to the word bank.
   Done when: the route returns AI words with a key, word-bank words without one, and never crashes.

5. **Audiogram entry and photo.**
   Typed thresholds to a `HearingProfile`. Then `POST /api/audiogram`: Claude reads a photo of an audiogram and returns thresholds for the learner to confirm. Tell the learner before the photo is sent. Do not store it.
   Done when: a typed and a photographed audiogram both produce picks from `pickTargets`.

6. **Coach tip.**
   One plain sentence from the recent attempts ("your hiss is landing near sh: smile and bring your tongue forward"). Rule-based first, Claude wording second.
   Done when: the practice screen shows a tip after 3 tries.

7. **Which feedback works (stretch).**
   Track hit rate by feedback channel in `progressFor` and suggest the best one.

**Lane done when:** a real word said into a phone on the production URL gives a correct verdict, saved and shown in progress.

## Files you own / files to leave alone

Own: `src/lib/`, `src/hooks/`, `src/app/api/`, `src/app/lab/`.

Leave alone (ask the owner or use what exists):

- `src/app/` pages and `src/components/` (Mason). Need a screen change? Ask Mason, or give him a hook.
- `src/content/` (Holly). Need a word or a line of text changed? Ask Holly.
- Hot files (`src/lib/types.ts`, `package.json`, `src/app/layout.tsx`, `src/app/globals.css`): announce first, tiny change only.

## How to test

- `npm test` for the math. Write tests with `src/lib/scoring/synth.ts`.
- `npm run dev`, then `/lab` on a laptop (the mic works on `localhost`).
- A real phone needs HTTPS: use the Vercel preview link of your pull request.

## Human-only steps

- Say words into the phone and judge if the verdict is right.
- Accept the microphone permission prompt.
- Set `ANTHROPIC_API_KEY` in Vercel. Never in the repo or the chat.
- Connect Vercel to the repo and check the production link.

## What other lanes need from you, and by when

- Mason: a stable `useSoundMeter` and `scoreAttempt`. Tell him before you change what they return. Saturday afternoon.
- Holly: honest numbers for the pitch (how often the verdict is right, on how many voices) and the list of things the app cannot do. Saturday evening.
- Everyone: tuned scoring merged by Saturday night so real users can try it Sunday morning.
- Feature freeze: Sunday 11:00 AM Pacific.
