# Lane: Screens + design (Mason)

Hand this file to your AI agent. Say: "Read AGENTS.md, docs/HACKATHON.md, docs/PLAN.md and docs/lanes/screens.md, then do issue #N."

## Goal

A first-time user understands the app in 10 seconds and can finish one practice word with no help. The speech is visible while they talk: a live meter moves as they hiss, then a clear result appears.

## What already exists

- `src/app/page.tsx`: landing page with three links.
- `src/app/profile/page.tsx`: Ling Six check, sign card setting, the sounds to practice.
- `src/app/practice/page.tsx`: a working but plain practice loop (word, meter, Start and Done, result, next word).
- `src/app/progress/page.tsx`: before and after numbers.
- `src/components/`: `SoundMeter`, `VerdictBadge`, `WordCard`. Plain on purpose. Make them yours.
- `useSoundMeter()` from `src/hooks/` (Michael's lane): gives you `status`, `reading` (is there a hiss, where on the sh-to-s line, how loud), `start()` and `stop()`. You never touch the microphone yourself.
- All wording comes from `src/content/` (Holly's lane): `COPY`, `CUES`, `WORD_BANK`.

## The plan

Read [docs/PLAN.md](../PLAN.md) first: report -> curated plan -> training -> feedback -> goal. Your part is every screen in that loop. The data shapes you build against are in `src/lib/types.ts`: `AssessmentReport`, `PracticePlan`, `PlanStep`, `TrainingView`, `CoachFeedback`.

- Step 1 screens: a start screen with two choices, "I have a speech therapist report" (a short form: sounds, goals, age group, interests) and "Test in the app" (the hearing check that exists, then a few starting words).
- Step 2 screen: the plan. `fetch('/api/plan', { method: 'POST', body: JSON.stringify({ report }) })` returns a `PracticePlan`. Show the summary, each sound with its why and goal, and a start button. Sounds with `scored: false` get a "show how, no score" label.
- Step 3 screen: training, with three views of the sound (`TrainingView`): mouth, graph, frequency. After each try, POST the recent scores to `/api/feedback` and show the returned `message` and `cue` in a feedback card. Follow `nextAction`.
- Step 4 screen: progress toward the goal.

## Build list (in priority order)

1. **Practice screen.**
   The heart of the demo. Big word. Live meter that shows the voice while they speak (loudness, and the marker sliding between "sh" and "s"). One big button. A result that cannot be missed: full-width color, a large icon and a few words. Try again and Next.
   Done when: a person who has never seen the app completes a word on a phone without being told what to tap.

2. **Mouth pictures.**
   Draw our own simple pictures for "s" and "sh": a side view (where the tongue goes) and a front view (smile for "s", rounded lips for "sh"). SVG files in `public/`. Do not copy textbook images. Show them in the "How to make this sound" box with Holly's cue text.
   Done when: both sounds have a side and a front picture on the practice screen.

3. **Result feedback that works without sound or vibration.**
   iPhones cannot vibrate from a web page. Add a visual pulse or flash to every result so it lands on any phone.
   Done when: hit, close and miss each look clearly different in a glance, in grayscale too.

4. **Profile flow.**
   One sound per step instead of a long list, a progress dot row, then the "sounds to practice" result with a clear next button.
   Done when: the Ling Six check takes under a minute on a phone.

5. **Progress screen.**
   A before and after picture per sound (two bars or a simple line). A share or screenshot-friendly summary for a therapist or parent.
   Done when: improvement is obvious without reading numbers.

6. **Landing page and look.**
   Name, one line, one main button. Pick the colors and type once, in `globals.css` (hot file: announce first).
   Done when: the first screen looks finished on a small phone.

7. **Sign cards (with Holly).**
   Show the sign on `WordCard` when the setting is on. Holly supplies the images and credits.

**Lane done when:** the whole flow, profile to practice to progress, looks finished and works on a phone on the production URL.

## Files you own / files to leave alone

Own: `src/app/` pages (all but `api/` and `lab/`), `src/components/`, `public/`.

Leave alone (ask the owner or use what exists):

- `src/lib/`, `src/hooks/`, `src/app/api/`, `src/app/lab/` (Michael). Need new data on a screen? Ask Michael for a function or hook.
- `src/content/` (Holly). Need different words? Ask Holly.
- Hot files (`src/lib/types.ts`, `package.json`, `src/app/layout.tsx`, `src/app/globals.css`): announce first, tiny change only.

## Design rules

- Phone first. Large type. Touch targets at least 48 px tall.
- Color is never the only signal. Add a word or an icon. Sound is never the only signal.
- High contrast. Check it in bright light.
- Two looks (#36): a play look for younger learners and a plain look for teens and adults. Neither may feel babyish to the person using it. Same practice, same scoring in both.

## Gamified UI and shop

The demo flow is in [docs/DEMO.md](../DEMO.md). The practice is the game: points come from saying words, so the reward pushes toward more real practice. Weekend order: points and streak first, shop second, hiss rocket (#34) only if everything else is done. Cut anything not solid by **Sun 9 AM**.

- **Points.** Earned by practicing, from the tries already saved on the device. Proposal (design judgment, not research): 1 point per try, 2 more for a hit, 5 more once a day for 10 tries. Misses still earn the try point. No lives, no losing points, no leaderboards: learners with very different hearing are never ranked against each other.
- **Streak that forgives.** Days in a row with at least one try. One missed day does not reset it.
- **Shop.** Spend points on looks only: meter skins, hats for the mascot, backgrounds. Never sell practice content, hints, or anything that changes scoring. No real money, no ads. About 6 to 9 items; the first one affordable after one session (about 15 points). Our own drawings (SVG in `public/`), nothing copied.
- **Storage.** Points, owned items and what is equipped live on the device. Read and write them only through Michael's `@/lib/rewards` (`pointsFor`, `streakFor`, `loadWallet`, `buy`, `equip`). Until it lands, use a stub in your component marked `TODO: replace with @/lib/rewards`.
- **Where things go.** `src/app/shop/page.tsx`, `src/components/shop/` (item list with names and prices, item art). Holly checks item names.
- **Age look.** The age group from the report picks the default look (#36); a setting switches it. Points and shop exist in both looks.
- **Accessibility.** Every reward shows a word and an icon, never color or sound alone. Respect `prefers-reduced-motion`. Buttons at least 48 px. A purchase can be undone.

## Landing page animation: "the voice that comes back different" (Mason, from the Nov 14 call)

The idea (Michael and Mason): a sound wave leaves the person's mouth, loops around, and goes back into their own
ear, and it **changes on the way back**. The point: a hard-of-hearing person hears their own voice differently
from how it really sounds, so they cannot tell their own "s" is missing.

- Out of the mouth: the full wave, with the high, fast "s" part drawn clearly.
- On the way back to the ear: the high part fades or flattens, so what arrives is "cat", not "cats". This
  matches the science: hearing loss usually takes high pitches first (see `docs/pitch/presentation-plan.md`,
  "What the hiss means").
- Words on screen too (for example "What you say: cats. What you hear: cat"), so the animation never relies on
  sound or motion alone.
- Mason found a JavaScript library with a 3D character that turns to follow the cursor. **Mason: add its name
  and link here.** A simpler fallback: a flat SVG head with an animated SVG path for the wave.
- Rules: respect `prefers-reduced-motion` (show a still picture), works at 375 px wide, does not slow the first
  load. A new library goes in `package.json` (hot file, tell the team) and in the disclosure list in
  `docs/HACKATHON.md`.
- Priority: after the demo path and the restyle work. Cut it if it is not solid by the Sunday 9 AM cut. It also
  works as the opening shot of the demo video.

## Bird mascot: "your little guy" (Mason, from the Nov 14 call)

The teal bird from the logo becomes a companion that lives on the site. **Mason builds it** (decided Nov 14). No outside preview build.

- **Where it lives:** only on the practice screen, in the top right corner of the page header, small (48 px).
  It sits still and scrolls with the page. No flying, no following the cursor or a finger.
- **While listening:** it opens its beak in time with the mic level (`meter.reading.level` from
  `useSoundMeter`), passed in as a prop. No new mic code.
- **Same bird in the wave animation above:** it sings, the wave loops back into its own ear, and the high "s"
  part is gone when it arrives.
- **Build it flat, in code (SVG plus CSS or a small script),** in the logo's style. A 3D look clashes with the
  flat logo, and phones have no cursor for a head-follow trick. On desktop its head and eyes can follow the
  cursor.

Rules:

- The bird is never a verdict. Its beak follows loudness only. Hit, close and miss still come from the badge,
  the meter and the words. It never looks happy or sad about a try unless that matches the real verdict.
- It never covers the meter, the word or a button. Set `pointer-events: none` so it never blocks a click.
- `prefers-reduced-motion`: the beak stays shut and it does not blink.
- A switch to hide it. Settings stay on the device.
- Wording and tone: a friend, never a teacher who is disappointed in the learner.
- Priority: after the demo path and the restyle work. The fly-in and perch are about 1 hour, and the beak on
  practice is about 30 minutes. Cut it if it is not solid by the Sunday 9 AM cut.

## New logo and photos (Nov 14)

- **Logo:** `public/brand/seespeak-wordmark.png` (served as `/brand/seespeak-wordmark.png`) is the new wordmark.
  Use it in the redesign. Its text says "See Speak AI": check with Michael which name to show.
- **Photos:** `public/photos/photo-1.jpg` to `photo-8.jpg` (served as `/photos/photo-N.jpg`), with
  `public/photos/CREDITS.md`. Use them to show who the app is for (landing page, "who it's for" sections).
  Every photo gets a small "Photo: Pinterest" caption, and none goes next to user quotes, test numbers or
  "people who tried it". Use `next/image` with real alt text.

## Example word: "sip" and "ship", not "cats" (Nov 14)

Research (see `docs/pitch/judge-answers.md`): with hearing loss, a learner's "s" drifts toward "sh". Dropping
the "s" ("cats" to "cat") reads like a grammar slip. So every example now uses **"sip" drifting toward "ship"**.
It is the example, not the home page title.

- **Voice loop picture** (`src/components/VoiceLoop.tsx`, wording in `src/content/voiceLoop.ts`): the bird sings
  "sip"; on the way back to its ear the "s" turns into "sh", so what it may hear is "ship". Labels: "What you
  say: sip" and "What you may hear: ship". Caption: "With high-pitch hearing loss, your "s" can drift toward
  "sh"." Today the component strikes out an ending; it needs a swap ("s" becomes "sh") instead.
- Never call it a "lisp": no source backs that word.

## Kingfisher hero (#104): advice

Animations score little; the demo path and the AI matter more. Give it 20 minutes, then cut it.

- The clip is 1280x720 at about 1.4 Mbit/s, 8 s, loaded from thinkingods.com. Stretching it wider, or zooming
  it to make the branch reach the page edges, is what makes it blurry. Do not stretch the video.
- **Better:** keep the video at or below its own size and let its edges melt into the page: a CSS
  `mask-image: linear-gradient(to right, transparent, black 12%, black 88%, transparent)` on the video, with the
  page background set to the sampled band color. If the branch must reach the edges, draw that part as a simple
  SVG branch in the same color, which stays sharp at any width.
- **Live demo risk:** the video loads from someone else's server. If that site is slow or down during judging,
  the hero fails. The fallback already reveals the page, so it will not break, but test it on the venue Wi-Fi.

## How your AI agent should work with you

Before designing any screen, open `docs/design/README.md` and look at every picture in `docs/design/references/`. Use the brand files and colors listed there. Ask Mason which references matter most for this screen.

Instructions for Mason's AI agent. Mason decides how it looks; the agent builds and checks.

1. **Ask before building each screen.** Ask Mason 3 to 6 design questions, for example: How should it feel (calm, playful, bold)? Which colors? Is there a mascot, and what is it? What does the shop sell, and what would a 12-year-old want to buy? Should it look younger or older? Wait for the answers.
2. **Ask for references.** Ask Mason for 2 or 3 reference images or apps (screenshots, links, app names) and wait for them. Do not invent a style without them.
3. **Build in small steps.** One part of a screen per step (layout, then the main element, then states, then polish). Keep each pull request to one issue.
4. **Check every step in a browser.** Run `npm run dev`, open the page in the in-app browser or Claude in Chrome, and take a screenshot at 375 px wide and at laptop width with the phone frame. Compare it with the references. Fix what is off and screenshot again.
5. **Repeat until Mason approves.** Show Mason the screenshot and what changed. Stop only when he says it is right.
6. **Keep the rules.** Color is never the only signal. Touch targets at least 48 px. High contrast. Wording comes from `src/content/`. The test browser blocks the mic, so tell Mason which steps he must try by hand on a phone.

## How to test

- `npm run dev` on a laptop (the mic works on `localhost`).
- On a phone, use the Vercel preview link of your pull request.
- Hand the phone to someone who has not seen it and watch without talking.

## Human-only steps

- Draw the mouth pictures (paper first is fine, then SVG).
- Judge whether a screen is clear and feels respectful.
- Try every screen on a small phone.

## What other lanes need from you, and by when

- Michael: tell him what the screens need from the hook that is missing. Saturday afternoon.
- Holly: screenshots of the main screens for the pitch slides. Saturday evening, refreshed Sunday morning.
- Feature freeze: Sunday 11:00 AM Pacific.
