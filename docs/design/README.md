# Design

## Brand files (used by the app)

Served from `public/brand/`, so the app can use them as `/brand/<file>`:

| File                     | Use                                                |
| ------------------------ | -------------------------------------------------- |
| `seespeak-logo.png`      | Wordmark on light backgrounds                      |
| `seespeak-logo-dark.png` | Wordmark on dark backgrounds ("Speak" turns white) |
| `seespeak-icon.png`      | Bird only, white background (app icon, favicon)    |
| `seespeak-icon-dark.png` | Bird only, black background                        |

Colors: teal `#2A9D8F` (bird, "See"), sunny yellow `#FFD166` (beak, notes), dark navy `#1E2A3A` ("Speak" on light). The bird is the mascot: it can sing when a sound lands. The logo was made with ChatGPT image generation (listed in the AI disclosure in `docs/HACKATHON.md`).

## Proposed theme v2

[theme-v2.md](theme-v2.md): one blue and tan theme for every age, an app shell and a no-AI-look checklist (issue #74). A proposal until Michael and Mason agree.

## Reference photos for the UI

Put screenshots and pictures of apps, games and styles we like in [`references/`](references/). Anyone can add them. AI agents building screens look here first.

**How to add one on the GitHub website (no git needed):**

1. Open https://github.com/whynobro/SeeSpeakAi/tree/main/docs/design/references
2. Click **Add file**, then **Upload files**, and drag the pictures in.
3. Pick **Create a new branch**, then **Propose changes** and **Create pull request**. It merges like any other pull request.

**Or with git:** copy the files into `docs/design/references/` on your branch and commit.

**Name files so they explain themselves:** `duolingo-streak-screen.png`, `shop-cute-hats.jpg`, `meter-colors-idea.png`. Add a line to the list below saying what you like about each one.

Only pictures we may use as inspiration. Never copy a reference straight into the app.

## What each reference is for

| File                      | What we like about it                                            | Added by |
| ------------------------- | ---------------------------------------------------------------- | -------- |
| `seespeak-logo-light.png` | Our logo: friendly singing bird, rounded shapes, teal and yellow | Michael  |
| `seespeak-logo-dark.png`  | Same logo on black                                               | Michael  |
