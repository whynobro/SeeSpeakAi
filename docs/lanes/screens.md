# Lane: Screens + design (Mason)

Hand this file to your AI agent. Say: "Read AGENTS.md and docs/lanes/screens.md, then do issue #N."

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
- Calm and adult-friendly. Not babyish: teens and adults will use this too.

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
