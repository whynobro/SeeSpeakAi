# Lane: Content, users + pitch (Holly)

Hand this file to your AI agent. Say: "Read AGENTS.md and docs/lanes/content-pitch.md, then do issue #N."

## Goal

The app says the right things to the right people, real people have tried it, and the pitch wins the rubric. You are the voice of the user on this team: you have the final say on wording and on what we claim.

## What already exists

- `src/content/words.ts`: the practice word bank, with the rules at the top of the file.
- `src/content/cues.ts`: how to make each sound (steps, a shaping trick, a touch cue).
- `src/content/copy.ts`: the lines every screen shows ("not therapy", privacy, opt-in).
- `docs/research.md`: facts with sources, and what we must not claim.
- The HearFit proposal (in the Hackathon-Practice repo) with the rubric table and prior-art notes.

## Build list (in priority order)

1. **Pick the one user and the one story.**
   Decide who the demo is about: for example a hard-of-hearing child who drops the plural "s", or a college student with hearing aids. One person, one problem, one before and after. Write it in `docs/pitch/story.md`.
   Done when: the team can say the user and the story in one sentence each.

2. **Real users this weekend.**
   Reach out (Cal Poly ASL Club, Disability Resource Center, speech therapists, family). Ask for feedback, never "testing people". Log each session in `docs/pitch/user-tests.md`: who (no full names), what they tried, before and after numbers from the progress screen, a quote with permission.
   Done when: at least one hard-of-hearing person or parent has tried the app and agreed to be quoted.

3. **Demo script against the rubric.**
   `docs/pitch/demo-script.md`: a timed script, who speaks, what is on screen. Open with the problem made real (play "cats" with the "s" removed). Include the honest answer to "what does the AI do?" from `docs/research.md`. Add a rubric table and track our score.
   Done when: the team has run the script twice with a timer.

4. **Word bank and cues review.**
   Check every word in `src/content/words.ts` against the rules in that file. Add words for the chosen user (age, interests). Check the cue text with a speech therapist if we reach one. Run `npm test` after edits: the tests catch rule breaks.
   Done when: 30 or more reviewed words, and the cues read naturally out loud.

5. **Wording and respect check on every screen.**
   Open each pull request preview. Is it opt-in, clear, never about "fixing" anyone? Fix wording in `src/content/copy.ts`. Ask Mason for layout changes.
   Done when: an ASL Club member or a hard-of-hearing reader has seen the screens and their feedback is applied.

6. **Sign cards.**
   For about 20 practice words, add a `SignCard` (image link, sign name, credit). ASL-LEX is free for non-commercial use with credit. Lifeprint asks for permission first. Mark `reviewed: true` only after a signer has checked it. Only content words get a sign: ASL is not word-for-word English.
   Done when: 20 words have a reviewed sign, or the feature stays off for the demo.

7. **Customers and price slide.**
   Name who pays (speech therapists assigning homework, school programs, parents), a price, and the first users by name.

**Lane done when:** the story, the user proof and the script are in `docs/pitch/`, and every screen has passed your wording check.

## Files you own / files to leave alone

Own: `src/content/`, `docs/pitch/`, `docs/research.md`.

Leave alone (ask the owner or use what exists):

- `src/lib/`, `src/hooks/`, `src/app/api/` (Michael).
- `src/app/` pages and `src/components/` (Mason).
- Hot files (`src/lib/types.ts`, `package.json`, `src/app/layout.tsx`, `src/app/globals.css`): announce first, tiny change only.

## Rules for words in the word bank

- Target "s" at the end of a plural: only after p, t, k or f sounds (cats, cups, books). In "dogs" or "beds" the letter s is spoken as "z", and the app does not score that.
- No spelling traps: "sugar" and "sure" have an "sh" sound, "is" and "nose" have a "z" sound.
- Common, concrete, short words.

## How to test

- `npm test` checks the word bank rules.
- `npm run dev` and read every screen out loud.
- Pull request preview links work on your phone.

## Human-only steps

- All outreach and every conversation with a user. Get their OK before quoting.
- Deciding what is respectful.
- Rehearsing the pitch.

## What other lanes need from you, and by when

- Michael: the chosen user's age group (children's voices need different tuning) and 5 volunteers' voices for tuning. Saturday afternoon.
- Mason: final wording for the main screens, and the story for the landing page. Saturday evening.
- Everyone: the demo script by Saturday night, so Sunday morning is practice, not writing.
- Feature freeze: Sunday 11:00 AM Pacific.
