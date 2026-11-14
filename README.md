# SeeSpeak

Practice the speech sounds your ears miss.

If you cannot hear high sounds like "s" and "sh", you cannot copy them. So "cats" becomes "cat" and "sip" blurs into "ship". Speech therapy helps, but sessions are short and far apart, and practice at home has no feedback. SeeSpeak is the practice in between: say a word to your phone, and it shows you, by color, by a live meter and by vibration, whether the sound was there.

## How it works

1. **Hearing profile (1 minute).** A Ling Six Sound check (m, oo, ah, ee, sh, s) or a typed audiogram.
2. **Personal practice list.** Words built around the sounds this person is likely to miss, including grammar endings (cat, cats).
3. **See how, then say it.** Mouth position tips, then say the word. A live meter slides between "sh" and "s" while you speak.
4. **Feedback you can perceive.** Color with a word and an icon, plus a phone vibration. Never sound alone.
5. **Progress.** Before and after accuracy for each sound.

For people who choose to work on spoken English. Sign language is welcome: sign cards are an optional setting. SeeSpeak is practice between speech therapy sessions. It is not therapy, not a diagnosis and not a hearing test.

## What the phone does and what the AI does

- **Listening is signal processing, on the phone.** The app measures the pitch of the hiss (an "s" sits around 4 to 8 kHz, an "sh" around 2 to 4 kHz) and checks that it lands in the right place in the word. We do not use speech recognition to judge speech: it gets about 78% of words wrong on deaf speech (18% for hearing speakers) and it "autocorrects" a missing sound.
- **AI (Claude) personalizes.** Planned this weekend: build the practice list around the learner's sounds and interests, read a photo of an audiogram, and turn practice history into one plain next tip. If the AI is unreachable, the app falls back to a built-in word bank.

## Privacy

- Your voice is analysed in the phone browser. Audio is never uploaded or stored.
- The hearing profile and practice history stay on the device. No accounts.
- The server only ever receives target sounds and interest topics.

## Honest limits

- Only "s" and "sh" are scored today.
- It checks that the hiss is there and which hiss it is. It does not judge the whole word.
- Thresholds are starting values, tuned on test sounds and a few voices, not on a clinical data set.
- Vibration works on Android phones only. iPhones have no vibration for web pages.

## Similar products

| Product | What it does | How SeeSpeak differs |
| --- | --- | --- |
| [SpeechLP](https://apps.apple.com/us/app/-/id6752866135) | AI articulation practice for children 3 to 9 | Its feedback assumes the child can hear the difference. Ours is built for hearing loss. |
| [SpeechPath](https://apps.apple.com/us/app/speechpath/id6745437939) | Pronunciation practice for deaf users with recognition scoring | Our targets come from the user's own hearing profile, with a live meter and vibration. |
| [MED-EL ReDi](https://apps.apple.com/us/app/-/id1506576790) | Listening and speech practice from an implant maker | Not tied to a device brand. Personal targets. |
| [Neosensory Clarify](https://neosensory.com/blog/neosensory-clarify/) | Wristband that turns s, z, th, f into vibration | That helps you hear the sounds. We help you say them, with only a phone. |
| ELSA-style accent apps | Pronunciation for second-language learners | They assume you can hear the target sound. |

Sources and the full prior-art notes are in [docs/research.md](docs/research.md).

## Quick start

You need Node 24.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The tuning page is at `/lab`.

The phone microphone only works over HTTPS. So to try it on a phone, open the Vercel preview link of your pull request, not your laptop's address.

The app runs without any keys. Never commit `.env.local` or any key. The repo is public.

## Commands

| Command             | What it does                    |
| ------------------- | ------------------------------- |
| `npm run dev`       | Start the dev server            |
| `npm run lint`      | Check code style rules          |
| `npm run typecheck` | Check TypeScript types          |
| `npm test`          | Run the tests                   |
| `npm run build`     | Build for production            |
| `npm run format`    | Auto-format files with Prettier |

## Team lanes

Each person owns one lane. Stay inside your folders.

| Person            | GitHub             | Lane                   | Owns                                                                                | Lane file                                       |
| ----------------- | ------------------ | ---------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------- |
| Michael Fischbach | `whynobro`         | Tech + integration     | `src/lib/`, `src/hooks/`, `src/app/api/`, `src/app/lab/`, env and keys, deploy      | [tech.md](docs/lanes/tech.md)                   |
| Mason Di Leo      | `dileomason-stack` | Screens + design       | `src/app/` pages (all but `api/` and `lab/`), `src/components/`, `public/`, styling | [screens.md](docs/lanes/screens.md)             |
| Holly Steen       | `steenholly12`     | Content, users + pitch | `src/content/`, `docs/pitch/`, `docs/research.md`, user testing                     | [content-pitch.md](docs/lanes/content-pitch.md) |

## Docs

- [TEAM.md](TEAM.md): setup, the git loop, merge conflicts, demo rules.
- [AGENTS.md](AGENTS.md): rules for AI coding agents (also read by Claude Code through `CLAUDE.md`).
- [docs/lanes/](docs/lanes/): one build file per lane.
- [docs/research.md](docs/research.md): facts, sources, and what we must not claim.

## Deadlines

- Feature freeze: Sunday Nov 15, 11:00 AM Pacific.
- Building ends: Sunday Nov 15, 12:00 PM Pacific.
- All project code is written this weekend. Open-source libraries and templates are fine.
