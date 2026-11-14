# Team guide

For Michael, Holly and Mason. Short and practical.

## One-time setup

1. Install Node 24 and Git.
2. Clone the repo **outside** OneDrive, Dropbox and iCloud. Synced folders break `node_modules` and git.
   ```bash
   cd ~/Code   # any folder that is NOT synced
   git clone https://github.com/whynobro/SeeSpeakAi.git
   cd SeeSpeakAi
   npm install
   cp .env.example .env.local
   npm run dev
   ```
3. Accept the GitHub invite to the repo if you have not yet.
4. Never commit `.env.local`, keys or secrets. The repo is public.

## Lanes

| Person            | GitHub             | Lane                   | Owns                                                                                      |
| ----------------- | ------------------ | ---------------------- | ----------------------------------------------------------------------------------------- |
| Michael Fischbach | `whynobro`         | Tech + integration     | `src/lib/`, `src/hooks/`, `src/app/api/`, `src/app/lab/`, env and keys, deploy            |
| Mason Di Leo      | `dileomason-stack` | Screens + design       | `src/app/` pages (all but `api/` and `lab/`), `src/components/`, `public/`, styling       |
| Holly Steen       | `steenholly12`     | Content, users + pitch | `src/content/`, `docs/pitch/`, `docs/research.md`, user testing, the final say on wording |

Your lane file (the build list for you and your AI) is in `docs/lanes/`:
`tech.md`, `screens.md`, `content-pitch.md`.

How the lanes meet:

- Mason's screens never touch the microphone or the math. They call Michael's `useSoundMeter` hook and functions from `src/lib/`. Need something new from the tech side? Ask Michael for a function, do not write it inside a page.
- The words on screen (practice words, how-to cues, the "not therapy" lines) live in Holly's `src/content/` files. Mason's screens import them. Want different wording? Holly changes one file and every screen updates.
- Holly reviews every pull request preview for one thing: is this respectful, clear and right for the people we are building for?

## Hot files

These are shared. Two people editing them causes conflicts.

- `src/lib/types.ts` (the shared contract)
- `package.json`
- `src/app/layout.tsx`
- `src/app/globals.css`

Rule: post in team chat BEFORE you edit one. Keep the change tiny. Merge it fast.

## The git loop

Branch names look like `<lane>/<task>`. Lanes: `tech`, `ui`, `content`.

```bash
# 1. start fresh
git checkout main
git pull origin main
git checkout -b ui/practice-screen

# 2. work, then save your work
git add -A
git commit -m "feat: add live meter to practice screen"

# 3. before pushing, bring in anything new from main
git pull origin main

# 4. push and open a pull request
git push -u origin ui/practice-screen
gh pr create --fill     # or use the GitHub website
```

Then:

1. Wait for the CI check named `check` (lint, typecheck, tests, build) to go green.
2. Squash merge the pull request.
3. Delete the branch.
4. Go back to step 1.

Rules:

- `main` is protected. Never commit to it. Never force-push it.
- Small pull requests. Aim for one every 30 to 60 minutes.
- Use Conventional Commit messages: `feat:`, `fix:`, `docs:`, `chore:`, `test:`.
- Each pull request gets a preview link once Vercel is connected. Test on your phone there.

## Merge conflicts

A conflict means two people changed the same lines. Do not panic.

1. Run `git pull origin main`. Git lists the conflicted files.
2. Open each file. Find the marker lines that start with `<<<<<<<`, `=======` and `>>>>>>>`.
3. Keep the right lines (often both). Delete the markers.
4. Run `git add <file>`, then `git commit`.

**`package-lock.json` conflicts:** do not edit it by hand. Take main's version, then rebuild:

```bash
git checkout origin/main -- package-lock.json
npm install
git add package-lock.json
git commit -m "chore: refresh lockfile"
```

Stuck? Ask in team chat, or ask your AI: "Help me resolve this merge conflict. Do not touch files outside my lane."

## Handing work to your AI

Open your AI coding agent in the repo folder and say:

> Read AGENTS.md, docs/PLAN.md and docs/lanes/<your file>, then do issue #N.

Example: "Read AGENTS.md, docs/PLAN.md and docs/lanes/screens.md, then do issue #5."

Each person's AI works only in that person's copy of the repo. The agents do not talk to each other. They stay in sync through the files on GitHub, so pull `main` often and put anything a teammate needs to know in a pull request, not only in your chat.

Starter issues are on the GitHub Issues tab. Labels: `lane:tech`, `lane:ui`, `lane:content`.

Read what the AI changed before you push. You are responsible for it.

## Testing with a phone

- The microphone only works over HTTPS or on `localhost`. On a phone, use the Vercel preview link of your pull request, not your laptop's address.
- Vibration works on Android phones only. iPhones have no vibration for web pages. Demo on an Android phone if we can get one. Every vibration also shows on screen.
- `/lab` is the tuning page. It shows the raw numbers behind the meter. Use it to test a new voice before trusting a score.
- Test in a quiet spot first, then in a noisy one. The demo room will be noisy.

## Deploy

- Production on Vercel follows `main`.
- Each pull request gets a preview link (once Vercel is connected).
- Michael sets env values in Vercel. The Anthropic key lives only in Vercel. Never paste it in chat or in the repo.

## Demo-time rules

- **Feature freeze: Sunday Nov 15, 11:00 AM Pacific.** After that, only fixes for broken things.
- Building ends Sunday Nov 15, 12:00 PM Pacific.
- Demo from the **production URL**, on a phone, not from localhost.
- Check the production site works after your last merge.
- Real people using the app this weekend, with proof (before and after numbers, a quote, with their OK), matters a lot. We ask for feedback. We do not test people.
