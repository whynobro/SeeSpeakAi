# Research notes

Facts we rely on, with sources. Owner: Holly. Add a source for every new claim. If there is no source, do not say it in the pitch.

## What the AI does (the honest answer for judges)

- **Listening is not AI.** It is signal processing on the phone: we measure the pitch of the hiss and where it falls in the word. This is on purpose. Across four current speech recognition systems, the word error rate was 52.6% for deaf and hard-of-hearing speakers versus 5.0% for hearing speakers ([Zhao 2024](https://koenecke.infosci.cornell.edu/files/Laryngoscope_Zhao2024.pdf), 24 and 9 speakers). An older test of one system found about 78% versus 18% ([Glasser 2017](https://ar5iv.labs.arxiv.org/html/1909.01167)), and language models fill in sounds that were not said ([Whisper hallucination study](https://arxiv.org/html/2402.08021)). A tool that "hears" an "s" that was never said is worse than no tool.
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

## The problem in numbers (checked Nov 14)

- At age 6, hard-of-hearing children used the "s" verb ending ("she runs") 75% of the time, versus 97% for hearing children, and the gap had not closed by age 6 ([Koehlinger 2013](https://pmc.ncbi.nlm.nih.gov/articles/PMC3951012)). This is the verb ending, not the plural.
- How well a child hears at 4 kHz through hearing aids predicts how well they say "s" endings ([Koehlinger 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4398614)).
- In speakers aged 8 to 17 with hearing loss, the "s" sits lower in pitch as high-pitch hearing gets worse, so "s" and "sh" move closer together ([Pittman 2018](https://doi.org/10.1044/2018_JSLHR-H-17-0460), abstract only). This is what our meter shows.
- Hard-of-hearing elementary students see a speech therapist about 1.7 times a week for about 31 minutes. 30% get no services ([Page 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6430501)).
- The median school speech therapist has 50 students. They say 40 is manageable ([ASHA 2026 Schools Survey](https://www.asha.org/siteassets/surveys/2026-schools-survey-slp-caseload.pdf)).
- 70,000 students aged 3 to 21 were served for hearing impairment under special education law in 2022-23 ([NCES](https://nces.ed.gov/programs/digest/d23/tables/dt23_204.30.asp)).
- After high school, school speech services stop. Colleges owe interpreters and note takers, not speech therapy ([Hands and Voices](https://handsandvoices.org/needs/transition.htm)).
- No study we found counts dropped plural "s" at ages 8 to 12 or at college age. Do not put a number on those.

## Prices of similar tools (checked Nov 14)

- Little Bee Speech, for therapists: $119.99 a year. For parents: $83.99 a year ([price page](https://little-bee-speech-tu.instantdocsbase.com/help/how-much-is-the-subscription)).
- SLP Toolkit, sold to school districts: $235 per seat per year, by purchase order ([price page](https://www.slptoolkit.com/pricing/)).
- Speech Blubs, for parents: $59.99 a year ([price page](https://speechblubs.com/faq/how-much-does-speech-blubs-cost)).
- Do not say that special education law pays for SeeSpeak. Whether an app counts as assistive technology is decided child by child.

## Not proven (say so if asked)

- That vibration feedback improves speaking. Research so far is small prototypes.
- That lowering the pitch of "s" helps people say it. It helps hearing it ([Wolfe 2010](https://www.thieme-connect.de/products/ejournals/pdf/10.3766/jaaa.21.10.2.pdf)).
- Our accuracy on real voices. Log test results below as we get them.

## Our own test log

| Date | Tester (no full names) | Phone | Words tried | Correct verdicts | Notes |
| ---- | ---------------------- | ----- | ----------- | ---------------- | ----- |
