# Research notes

Facts we rely on, with sources. Owner: Holly. Add a source for every new claim. If there is no source, do not say it in the pitch.

## What the AI does (the honest answer for judges)

- **Listening is not AI.** It is signal processing on the phone: we measure the pitch of the hiss and where it falls in the word. This is on purpose. Across four current speech recognition systems, the word error rate was 52.6% for 24 deaf and hard-of-hearing adults and 5.0% for 9 hearing adults. Most of the deaf speakers used sign. For the 3 who used speech only, the error rate was 19.7%, about 1 word in 5 ([Zhao 2024](https://koenecke.infosci.cornell.edu/files/Laryngoscope_Zhao2024.pdf)). An older test of one system in 2017 found about 77% to 78% versus 18% ([Glasser 2017](https://ar5iv.labs.arxiv.org/html/1909.01167)). Whisper, a popular speech recognition model, made up whole phrases that were never said in about 1% of recordings ([Koenecke 2024](https://arxiv.org/html/2402.08021)). A tool that reports a sound that was not there is worse than no tool.
- **AI (Claude) does the personal part:** builds the practice list around the learner's sounds and interests, reads a photo of an audiogram, and turns practice history into one plain tip. Say only the parts that are built by demo time.
- Do not say "the AI runs the app" or "AI listens to your speech". A judge who asks how will find out it does not.

## Sound facts the scoring uses

- Ling Six sounds by pitch: "sh" energy sits around 2 to 4 kHz, "s" around 4 to 8 kHz ([BATOD](https://www.batod.org.uk/wp-content/uploads/2022/09/The-Ling-6-Sound-Test.pdf)). Not hearing "s" suggests little hearing at or above 4 kHz. Not hearing "sh" suggests little above 2 kHz.
- Spectral moments, such as the center of the hiss's pitch, separate "s" from "sh" ([Jongman, Wayland and Wong 2000](https://doi.org/10.1121/1.1288413)). Women's and children's voices sit higher than men's, so thresholds must be tuned on several voices.
- The Ling check on a phone is a quick screen, not a hearing test. Phone speakers are not calibrated.

## Phone and browser facts

- Browsers turn on echo cancellation and noise suppression for the microphone by default, and these can remove a hiss as "noise". We ask for them to be off, then check the track settings, because a browser may ignore the request ([getUserMedia constraints](https://blog.addpipe.com/audio-constraints-getusermedia/)). An old WebKit bug made Safari cut high pitches even with processing off. It was marked fixed in 2023 for when echo cancellation is off ([WebKit bug](https://bugs.webkit.org/show_bug.cgi?id=192932)). Still test on a real iPhone.
- Web pages can vibrate Android phones but not iPhones ([caniuse](https://caniuse.com/mdn-api_navigator_vibrate)). Every vibration has a visual twin.

## Who uses sign and who uses speech

- In a 2013 Gallaudet school survey, more than half of deaf and hard-of-hearing students were taught in spoken-language-only settings, 15% in sign only, and 13% in both ([ASHA summary](https://asha.org/practice-portal/professional-issues/language-communication-deaf-hard-of-hearing-children)). These are school surveys, not the whole population.
- So: do not assume a hard-of-hearing user signs. Sign cards are a setting, off by default, offered with respect.
- Sign images: the ASL-LEX database is free for non-commercial use with credit, but its videos are copyrighted, so we ask before using any of them. Lifeprint does not allow its pictures or videos in any app, even a free web app, and asks people not to request permission. We do not use Lifeprint material. Fingerspelling shows letters, not sounds ("sh" is two letters and one sound), so it does not teach pronunciation.

## Similar products

- SpeechLP: AI articulation games for young children (ages 2 or 3 to 9), announced for launch at the ASHA 2025 convention. Neither its store page nor its press release mentions hearing loss ([press release](https://www.k12dive.com/press-release/20251112-speechlp-launches-ai-speech-therapy-app-at-asha-2025-conference/)).
- SpeechPath, MED-EL ReDi, Cochlear CoPilot, Neosensory Clarify, older systems (IBM SpeechViewer): see the HearFit proposal in the Hackathon-Practice repo for the full table and sources.
- Pitch claim we can defend: "Speech practice apps exist, but none we found builds the practice from your own hearing." Never say "first speech app for deaf learners".

## The problem in numbers (checked Nov 14)

- In a study of 40 hard-of-hearing and 17 hearing 6-year-olds, the "s" verb ending ("she runs") was used in 75% of the places it was needed, against 97% for hearing children. The authors found the overall grammar gap had not closed by age 6 ([Koehlinger 2013](https://pmc.ncbi.nlm.nih.gov/articles/PMC3951012)). This is the verb ending, not the plural. The numbers pool all sentences, not averages per child, and each age group was a different set of children.
- How well a child hears at 4 kHz through hearing aids predicts how well they say "s" endings ([Koehlinger 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4398614)).
- In speakers aged 8 to 17 with hearing loss, the "s" sits lower in pitch as high-pitch hearing gets worse, so "s" and "sh" move closer together ([Pittman 2018](https://doi.org/10.1044/2018_JSLHR-H-17-0460), abstract only). This is what our meter shows.
- Hard-of-hearing elementary students who see a school speech therapist average 1.7 sessions a week of about 31 minutes each. In the same study of 155 children, parents said 30% were getting no school services at all, from either a speech therapist or a teacher of the deaf ([Page 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6430501)). Do not multiply these into "minutes a week": the paper does not.
- The median school speech therapist has 50 students. They say 40 is manageable ([ASHA 2026 Schools Survey](https://www.asha.org/siteassets/surveys/2026-schools-survey-slp-caseload.pdf)).
- 70,000 students aged 3 to 21 were served for hearing impairment under special education law in 2022-23 ([NCES](https://nces.ed.gov/programs/digest/d23/tables/dt23_204.30.asp)).
- After high school, students leave the special education law that covers school speech services. Colleges provide aids and adjustments such as interpreters or note takers, and the guide we read does not list speech therapy among them ([Hands and Voices](https://handsandvoices.org/needs/transition.htm)).
- We found no study that measures dropped plural "s" at ages 8 to 12 or at college age. Do not put a number on those.

## Prices of similar tools (checked Nov 14)

- Little Bee Speech, for therapists: $119.99 a year. For parents: $83.99 a year ([price page](https://little-bee-speech-tu.instantdocsbase.com/help/how-much-is-the-subscription)).
- SLP Toolkit, sold to school districts: $235 per seat per year, by purchase order ([price page](https://www.slptoolkit.com/pricing/)).
- Speech Blubs, for parents: $59.99 a year ([price page](https://speechblubs.com/faq/how-much-does-speech-blubs-cost)).
- Do not say that special education law pays for SeeSpeak. Whether an app counts as assistive technology is decided child by child.

## Not proven (say so if asked)

- That vibration feedback improves speaking. Research so far is small prototypes.
- That lowering the pitch of "s" helps people say it. One study of 15 children found it helps them hear high sounds in quiet, not in noise, and it did not test speaking ([Wolfe 2010](https://www.thieme-connect.de/products/ejournals/pdf/10.3766/jaaa.21.10.2.pdf)).
- Our accuracy on real voices. Log test results below as we get them.

## Our own test log

| Date | Tester (no full names) | Phone | Words tried | Correct verdicts | Notes |
| ---- | ---------------------- | ----- | ----------- | ---------------- | ----- |
