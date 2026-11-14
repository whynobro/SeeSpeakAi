# Research notes

Facts we rely on, with sources. Owner: Holly. Add a source for every new claim. If there is no source, do not say it in the pitch.

## What the AI does (the honest answer for judges)

- **Listening is not AI.** It is signal processing on the phone: we measure the pitch of the hiss and where it falls in the word. This is on purpose. Speech recognition gets about 78% of words wrong on deaf speech versus 18% for hearing speakers ([Glasser et al.](https://ar5iv.labs.arxiv.org/html/1909.02853)), and language models fill in sounds that were not said ([Whisper hallucination study](https://arxiv.org/html/2402.08021)). A tool that "hears" an "s" that was never said is worse than no tool.
- **AI (Claude) does the personal part:** builds the practice list around the learner's sounds and interests, reads a photo of an audiogram, and turns practice history into one plain tip. Say only the parts that are built by demo time.
- Do not say "the AI runs the app" or "AI listens to your speech". A judge who asks how will find out it does not.

## Sound facts the scoring uses

- Ling Six sounds by pitch: "sh" energy sits around 2 to 4 kHz, "s" around 4 to 8 kHz ([BATOD](https://www.batod.org.uk/wp-content/uploads/2022/09/The-Ling-6-Sound-Test.pdf)). Not hearing "s" suggests little hearing at or above 4 kHz. Not hearing "sh" suggests little above 2 kHz.
- The "center of pitch" of the hiss separates "s" from "sh" ([Jongman, Wayland and Wong 2000](https://zenodo.org/record/3733338)). Women's and children's voices sit higher than men's, so thresholds must be tuned on several voices.
- The Ling check on a phone is a quick screen, not a hearing test. Phone speakers are not calibrated.

## Phone and browser facts

- Browsers clean up microphone sound by default and can remove a hiss as "noise". We switch that off ([getUserMedia constraints](https://blog.addpipe.com/audio-constraints-getusermedia/)). iPhone Safari may still filter ([WebKit bug](https://bugs.webkit.org/show_bug.cgi?id=192932)): test on a real iPhone.
- Web pages can vibrate Android phones but not iPhones ([caniuse](https://caniuse.com/mdn-api_navigator_vibrate)). Every vibration has a visual twin.

## Who uses sign and who uses speech

- In a Gallaudet school survey, about half of deaf and hard-of-hearing students were taught in spoken-language-only settings, about 15% sign only, about 13% both ([ASHA summary](https://asha.org/practice-portal/professional-issues/language-communication-deaf-hard-of-hearing-children)). These are school surveys, not the whole population.
- So: do not assume a hard-of-hearing user signs. Sign cards are a setting, off by default, offered with respect.
- Sign images: ASL-LEX is free for non-commercial use with credit. Lifeprint asks for permission before app use. Fingerspelling shows letters, not sounds ("sh" is two letters and one sound), so it does not teach pronunciation.

## Similar products

- SpeechLP: AI articulation app for children 3 to 9, launched at ASHA 2025. Not built for hearing loss ([press release](https://www.k12dive.com/press-release/20251112-speechlp-launches-ai-speech-therapy-app-at-asha-2025-conference/)).
- SpeechPath, MED-EL ReDi, Cochlear CoPilot, Neosensory Clarify, older systems (IBM SpeechViewer): see the HearFit proposal in the Hackathon-Practice repo for the full table and sources.
- Pitch claim we can defend: "Speech practice apps exist, but none we found builds the practice from your own hearing." Never say "first speech app for deaf learners".

## Not proven (say so if asked)

- That vibration feedback improves speaking. Research so far is small prototypes.
- That lowering the pitch of "s" helps people say it. It helps hearing it ([Wolfe 2010](https://www.thieme-connect.de/products/ejournals/pdf/10.3766/jaaa.21.10.2.pdf)).
- Our accuracy on real voices. Log test results below as we get them.

## Our own test log

| Date | Tester (no full names) | Phone | Words tried | Correct verdicts | Notes |
| ---- | ---------------------- | ----- | ----------- | ---------------- | ----- |
