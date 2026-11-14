# Demo script

Owner: Holly. Status: DRAFT, not yet run with a timer. Room judging gives us 4 minutes to demo and 3 minutes of questions. Demo from the production link, on a phone.

Lines in (brackets) wait on a real person from `user-tests.md` or on a feature being live. Say only what is built.

## The 4 minutes

| Time         | Who speaks | What is said                                                                                                                                                                                                                                                                                                                                                              | On screen                                                                                                        |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 0:00 to 0:30 | Holly      | "Listen to this word." Play "cats" with the "s" taken out. "That is how 'cats' sounds if you cannot hear high sounds. If you cannot hear a sound, you cannot copy it. So 'cats' becomes 'cat'."                                                                                                                                                                           | Slide: the word "cats" with the "s" fading out. The words are on the slide too, so nobody needs to hear the clip |
| 0:30 to 1:00 | Holly      | (The user in one sentence, from `story.md`.) "School speech therapy is about two half-hour sessions a week, and the therapist has 50 students. Between sessions there is no feedback. SeeSpeak is the practice in between. It is opt-in, and sign language is welcome here."                                                                                              | Slide: the person (label only, with their OK), the two numbers                                                   |
| 1:00 to 1:30 | Mason      | "One minute to set up." Run the test in the app (or type in a speech therapist's goals). "Claude turns this into a practice plan: which sounds, which words, and the goal, in plain words."                                                                                                                                                                               | Phone: profile screen, then "sounds to practice"                                                                 |
| 1:30 to 2:40 | Michael    | Says "cat": the app shows the sound was missing. Says "cats": hit. Says "ship" for "sip": close, the meter shows which hiss it was. "This is not speech recognition. The phone measures the hiss itself and shows the result at once. Only the numbers go to Claude, never the voice. Claude says what to change and picks the next step." Read the coach sentence aloud. | Phone: practice screen, live meter, result with color, word and icon                                             |
| 2:40 to 3:10 | Holly      | (Real numbers: "This weekend N people tried it. One went from X to Y on 's'." One quote, with their OK.)                                                                                                                                                                                                                                                                  | Phone: progress screen. Slide: the quote                                                                         |
| 3:10 to 3:40 | Holly      | "School districts already buy tools per speech therapist. We charge $120 a seat a year, free for families. Our first users are (names from the table below)."                                                                                                                                                                                                             | Slide: who pays, price, first users                                                                              |
| 3:40 to 4:00 | Holly      | "Speech practice apps exist. None we found builds the practice from your own hearing. That is SeeSpeak."                                                                                                                                                                                                                                                                  | Slide: name, link, QR code                                                                                       |

Backup if the room is too noisy for the microphone: say so plainly, cup a hand around the phone, and if it still fails show the screen recording made on Sunday morning. Say that it is a recording.

## What does the AI do? (the honest answer)

Pick the one that matches what is live on Sunday.

- If the Claude plan and coaching are live: "The phone measures the hiss with plain signal processing, because speech recognition gets about 1 word in 5 wrong even for deaf adults who use speech, against 1 in 20 for hearing adults, and it can make up words that were never said. Claude does the part that must be different for each person: it turns a report into a practice plan, and after each try it turns the measured numbers into one plain next step. It never hears the voice."
- Always true: "We put the AI where a mistake is cheap and easy to see, like a word list. We kept it out of the place where a mistake does harm: telling someone they said an 's' they did not say."
- If asked "does the app depend on it?": "The personal part does. Without it the app still runs on a built-in word bank."

## Questions to expect

| Question                         | Answer                                                                                                                                                                                                               |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| How accurate is it?              | (Michael's numbers: right N times in 10 on N voices, quiet room.) "Only 's' and 'sh' today. We do not claim more."                                                                                                   |
| Is this therapy?                 | "No. It is extra practice that people choose. Not therapy, not a diagnosis, not a hearing test."                                                                                                                     |
| Why not teach sign instead?      | "Sign language is welcome here. This is for people who choose to work on spoken English. In a 2013 national school survey, more than half of deaf and hard-of-hearing students were taught only in spoken language." |
| Has it been proven to work?      | "Not yet. Showing the sound on screen has been tried in research since the 1980s. Our own numbers are from this weekend, on a few people."                                                                           |
| Does it work on iPhone?          | (Michael's answer from issue #2.) "Vibration is Android only. Every result also shows on screen."                                                                                                                    |
| What did you build this weekend? | "All of it, since Friday 5 PM."                                                                                                                                                                                      |
| Who else does this?              | "SpeechLP, SpeechPath, MED-EL ReDi. None we found starts from your own hearing."                                                                                                                                     |

## Who pays and first users

- Payer: school district special education office, one seat per speech therapist or teacher of the deaf. $120 a seat a year. Families do not pay.
- Why that price: Little Bee Speech charges therapists $119.99 a year. SLP Toolkit charges districts $235 a seat.
- Second option: parents, $59.99 a year, with a free seat for the child's therapist.
- First users, by name: San Luis Obispo County Office of Education Deaf and Hard of Hearing Program, California Hands and Voices, Cal Poly Disability Resource Center, Cal Poly ASL Club. (Add only groups we have really spoken to.)

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
