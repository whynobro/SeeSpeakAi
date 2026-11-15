# Demo script

Owner: Holly. Status: DRAFT, not yet run with a timer. Room judging gives us 4 minutes to demo and 3 minutes of questions. Demo from the production link, on the demo laptop in the Phone view (team decision, Nov 14). The order follows `presentation-plan.md`.

Lines in (brackets) wait on a real person from `user-tests.md` or on a feature being live. Say only what is built.

## The 4 minutes

| Time         | Who speaks                        | What is said                                                                                                                                                                                                                                                                                                                                        | On screen                                                               |
| ------------ | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 0:00 to 0:20 | Holly                             | "Two to three of every 1,000 babies in the US are born with hearing loss. For many of them, the high sounds go first." (NIDCD, see `judge-answers.md`)                                                                                                                                                                                              | Slide: the number                                                       |
| 0:20 to 0:45 | Mason                             | His own story, in his own words, only what he is OK sharing: he had a speech impediment as a kid, and he could hear himself fix it.                                                                                                                                                                                                                 | Slide: none, or one line                                                |
| 0:45 to 1:10 | Michael                           | "You and I have heard 'sip' and 'ship' thousands of times. Every time we said it wrong, we heard the difference and fixed it. If you're hard of hearing, the 's' is the part you can't hear. So how are you supposed to fix it? SeeSpeak lets you see it."                                                                                          | Slide: "sip" with the "s" turning into "sh"                             |
| 1:10 to 1:25 | Holly                             | "School speech therapy averages 1.7 sessions a week. SeeSpeak is the practice in between. It is opt-in, and sign language is welcome here."                                                                                                                                                                                                         | Slide: the two numbers                                                  |
| 1:25 to 2:45 | Michael, with Mason on the laptop | Live: "Try it now", the plan from Claude, one level. Says "sip" drifting toward "sh": close, the meter shows it. Says it again, a clear high "s": hit. Reads the coach sentence aloud. "This is not speech recognition. The phone measures the hiss itself. Only the numbers go to Claude, never the voice." Then Progress: the sound map fills in. | The live app: home, plan, practice with the meter, the result, Progress |
| 2:45 to 3:10 | Holly                             | "On Saturday we showed it to Yuka. She had speech therapy from kindergarten to third grade, and she led the ASL Club at Cal Poly. She told us: 'I think you are on to something here for sure.' She also told us to let speech therapists assign the practice. We built that link the same night."                                                  | Slide: her quote, with her OK. Then the therapist link screen           |
| 3:10 to 3:40 | Holly                             | "School districts already buy tools per speech therapist. We charge $120 a seat a year, free for families." (First users: only what is true on Sunday, see below.)                                                                                                                                                                                  | Slide: who pays, price                                                  |
| 3:40 to 4:00 | Holly                             | "Speech practice apps exist. None we found builds the practice from your own hearing. That is SeeSpeak."                                                                                                                                                                                                                                            | Slide: name, link, QR code                                              |

Backup if the room is too noisy for the microphone: say so plainly, cup a hand around the phone, and if it still fails show the screen recording made on Sunday morning. Say that it is a recording.

## What does the AI do? (the honest answer)

Pick the one that matches what is live on Sunday.

- If the Claude plan and coaching are live: "The phone measures the hiss with plain signal processing, because speech recognition gets about 1 word in 5 wrong even for deaf adults who use speech, against 1 in 20 for hearing adults, and it can make up words that were never said. Claude does the part that must be different for each person: it turns a report into a practice plan, and after each try it turns the measured numbers into one plain next step. It never hears the voice."
- Always true: "We put the AI where a mistake is cheap and easy to see, like a word list. We kept it out of the place where a mistake does harm: telling someone they said an 's' they did not say."
- If asked "does the app depend on it?": "The personal part does. Without it the app still runs on a built-in word bank."

## Questions to expect

| Question                         | Answer                                                                                                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| How accurate is it?              | (Michael's numbers: right N times in 10 on N voices, quiet room.) "Only 's' and 'sh' today. We do not claim more."                                                                                                      |
| Is this therapy?                 | "No. It is extra practice that people choose, for the days between sessions or when a therapist is hard to reach. It starts with a quick hearing check and a speaking check. Neither is a medical test or a diagnosis." |
| Why not teach sign instead?      | "Sign language is welcome here. This is for people who choose to work on spoken English. In a 2013 national school survey, more than half of deaf and hard-of-hearing students were taught only in spoken language."    |
| Has it been proven to work?      | "Not yet. Showing the sound on screen has been tried in research since the 1980s. Our own numbers are from this weekend, on a few people."                                                                              |
| Does it work on iPhone?          | (Michael's answer from issue #2.) "Vibration is Android only. Every result also shows on screen."                                                                                                                       |
| What did you build this weekend? | "All of it, since Friday 5 PM."                                                                                                                                                                                         |
| Who else does this?              | "SpeechLP, SpeechPath, MED-EL ReDi. None we found starts from your own hearing."                                                                                                                                        |

## Who pays and first users

- Payer: school district special education office, one seat per speech therapist or teacher of the deaf. $120 a seat a year. Families do not pay.
- Why that price: Little Bee Speech charges therapists $119.99 a year. SLP Toolkit charges districts $235 a seat.
- Families pay nothing. One model only: see `business-model.md`.
- First users: say only what is true. As of Saturday night: one recorded feedback call (Yuka, from the Cal Poly ASL Club), and she offered to introduce us to people in the Deaf and hard-of-hearing community and in speech therapy. **We have not spoken to** the San Luis Obispo County Office of Education program, California Hands and Voices or the Disability Resource Center, so do not name them as users. They are where we would go next, and we can say that.

## Rubric tracker

| Row                     | Max | Now (honest guess) | What moves it                                       |
| ----------------------- | --- | ------------------ | --------------------------------------------------- |
| Execution and design    | 25  |                    | Runs live on the production link, used cold         |
| Real problem, real user | 25  |                    | One real person tried it, with numbers and a quote  |
| Path to customers       | 20  |                    | Payer, price, first users by name                   |
| Pitch and demo          | 15  |                    | Care in 30 seconds. One story, live. Honest answers |
| Creative use of AI      | 15  |                    | Show the profile turning into a personal list       |

## Timer runs

| Run | Date and time | Total time | What to fix |
| --- | ------------- | ---------- | ----------- |
| 1   |               |            |             |
| 2   |               |            |             |
