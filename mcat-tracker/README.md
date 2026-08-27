# MCAT Tracker

A study tracker for one MCAT candidate: the full AAMC content map, five
practice rounds per topic, timed subject and final exams, a spaced-repetition
error log, an Outlook-style study calendar, and progress analytics.

Built from the Claude Design handoff bundle (`Han Ni Oo MCAT Tracker`). The
whole app is a single self-contained `index.html` — no build step, no
dependencies to install, and it works offline once the fonts are cached.

## Run it

Double-click `index.html`, or serve the folder:

```bash
python3 -m http.server 8000   # then open http://localhost:8000/mcat-tracker/
```

Progress lives in `localStorage` under the key `hnoo-mcat-v1`, so it is
per-browser and per-device. **Back it up:** Progress → *Your data* →
**Download backup** writes a JSON file you can keep, and **Restore from file**
loads it back (on any browser or device). Clearing site data, switching
browsers or changing device wipes the tracker otherwise, so take a backup
every few weeks.

## Screens

- **Today** — countdown to test day, the mastered percentage, streak and
  accuracy, a pace line against the weekly plan, the Daily CARS and review-queue
  habits, and the three weakest subjects surfaced as one-tap rounds
- **Subjects** — every content category, split into coursework she has done and
  coursework she hasn't; the five mixed final exams sit between them
- **Subject detail** — topics grouped by foundational concept, each with a
  ready checkbox and five round pips; a timed subject exam unlocks below
- **Practice round** — one question at a time, with option elimination,
  flagging, per-option explanations on reveal, and a passage panel for CARS.
  Fully keyboard-driven: **A–D** or **1–4** picks an answer, **F** flags,
  **Enter** checks and advances
- **Score report** — ring score, verdict against the pass mark, and a full
  question-by-question review. Every miss must be tagged with why it happened
  — *didn't know it, misread it, fell for a trap, careless slip, ran out of
  time* — before the next round unlocks; the five causes have five different
  remedies, and the error log aggregates them
- **Calendar** — month and week views, click any day or slot to schedule a
  session, plus a weekly-hours plan and a suggested-next list
- **Progress** — headline stats, accuracy by subject, score trend, weakest
  topics, the error log, and a twelve-week study heatmap

The layout adapts below 820px — the sidebar becomes a bottom tab bar and
every screen works one-handed on a phone. Screens live in the URL
(`#/subjects`, `#/subject/biology`, …), so the browser's Back button moves
between screens and a screen can be bookmarked.

## How practice works

Every question is tagged with the syllabus topic it belongs to, and a round
only ever draws from the scope you asked for. There are three scopes:

| Scope | Where | Draws from |
|---|---|---|
| **Topic round** | the pips on a topic row | that one topic |
| **Mixed round** | the pips on a concept-group heading | every topic in that group |
| **Subject exam** | the button at the foot of a subject | the whole subject, timed |

- A scope offers **as many rounds as its questions support** — `floor(pool ÷
  roundLength)`, capped at five — so the pip count is a fact about the bank,
  not a promise. Below `roundLength` questions it offers one short round, and
  below **3** it offers none and says how many more it needs.
- Rounds are dealt by a seeded shuffle, so a retake is a genuine retake of the
  same questions. Once a scope holds twice `roundLength`, its rounds slice
  distinct windows instead of reshuffling one pool.
- A round **passes** at or above `passMark`, and a topic is **mastered** once
  every round it offers has been passed. Mastery is the number the headlines
  report; the self-ticked "covered in class" checkbox is kept only as a
  coursework marker.
- Missed questions enter the **error log** and their *concepts* resurface in
  the review queue at 1, 3, 7, 14 and 28-day intervals — served as a different
  question on the same topic whenever the bank has one, so the retrieval is of
  the idea rather than the memorised card. A miss retires after three clears
  on separate days.
- **Biochemistry** is active ahead of its course (the exam does not wait for a
  transcript); the *ahead of coursework* chip marks it. Organic Chemistry,
  Physics and Sociology stay locked until their courses start.
- Subject exams and final exams are **timed** — 95 seconds a question, answers
  lock when you advance.
- The review queue and "Redo my misses" are drills: they update the error log
  and the heatmap but are not recorded as scored rounds.

## Editing it

Two blocks near the top of `index.html` are the ones worth touching:

- `window.MCAT_PASSAGES` / `window.MCAT_BANK` — the question bank, keyed by
  subject id. Each item is `{ tid, stem, options, answer, why }`, optionally
  with `whys` (per-option notes) and `passage` (a key into `MCAT_PASSAGES`).
  `answer` is a zero-based index into `options`. **`tid` is the syllabus topic
  id** — `biology-0` is the first topic of the first `biology` group, counting
  from zero across the whole subject. It is what binds a question to a topic
  row, so a wrong `tid` puts a question in the wrong round.
- `CONFIG` — learner name, exam date, prep start, pass mark, round length, and
  whether locked subjects are listed.

`SUBJECTS` below them holds the syllabus. Moving a subject from
`status: 'locked'` to `'active'` is what unlocks its practice when the course
starts.

## Writing questions

Two properties of the bank matter as much as the science, because a bank that
leaks its answers teaches a habit that fails on test day.

**Keep the key balanced.** Correct answers should land on A, B, C and D at
roughly equal rates. A bank where one letter dominates can be scored well
without reading the questions, and a student will pick that pattern up without
ever noticing she has.

**Keep the options parallel.** If the correct answer is reliably the longest
or the most qualified option, that is a second free answer. Write distractors
at comparable length and specificity, and trim the answer rather than padding
the distractors.

Run `node mcat-tracker/check-bank.js` after editing. It validates every `tid`
against the syllabus, reports the answer-key distribution and the option-length
tell, lists which topics still cannot support a round, and exits non-zero if
the key has drifted back toward guessable.

Where a question's options are genuinely ordered — ascending numbers, or a
logical `only / only / both / neither` set — leave them in their natural order
and balance the key elsewhere. Ordering is information the student is meant to
use.

## Growing the bank

The bank holds **278 questions across 9 passages** — every Biology topic is
practisable, Biochemistry is a real subject, and the four thin subjects each
have 40+ items — but 109 topics still cannot support a round of their own.
`check-bank.js` prints the shortest topics first, which is the work queue. A
topic needs 3 questions before it offers any practice of its own and
`roundLength` before it offers a full round, so the cheapest way to turn the
map green is to take the 0-question topics to 3 rather than deepening the ones
that already work.

Passage sets are the highest-value additions: the real exam hangs roughly
three-quarters of its questions off passages. Define the passage in
`MCAT_PASSAGES`, reference it from each question with `passage: "pN"`, and the
app shows the passage panel beside those questions and keeps them together in
any round or exam that deals them.
