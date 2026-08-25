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
per-browser and per-device. Clearing site data resets everything.

## Screens

- **Today** — countdown to test day, syllabus-ready percentage, streak and
  accuracy, a pace line against the weekly plan, the Daily CARS and review-queue
  habits, and the three weakest subjects surfaced as one-tap rounds
- **Subjects** — every content category, split into coursework she has done and
  coursework she hasn't; the five mixed final exams sit between them
- **Subject detail** — topics grouped by foundational concept, each with a
  ready checkbox and five round pips; a timed subject exam unlocks below
- **Practice round** — one question at a time, with option elimination,
  flagging, per-option explanations on reveal, and a passage panel for CARS
- **Score report** — ring score, verdict against the pass mark, and a full
  question-by-question review
- **Calendar** — month and week views, click any day or slot to schedule a
  session, plus a weekly-hours plan and a suggested-next list
- **Progress** — headline stats, accuracy by subject, score trend, weakest
  topics, the error log, and a twelve-week study heatmap

## How practice works

- Each topic has **five rounds** of `roundLength` questions. Rounds are dealt by
  a seeded shuffle, so a retake is a genuine retake of the same questions.
  Once a subject's bank holds `5 x roundLength` items, the five rounds slice
  distinct windows instead of reshuffling one pool.
- A round **passes** at or above `passMark`.
- Missed questions enter the **error log** and resurface in the review queue at
  1, 3, 7, 14 and 28-day intervals, retiring once answered right twice running.
- Subject exams and final exams are **timed** — 95 seconds a question, answers
  lock when you advance.
- The review queue and "Redo my misses" are drills: they update the error log
  and the heatmap but are not recorded as scored rounds.

## Editing it

Two blocks near the top of `index.html` are the ones worth touching:

- `window.MCAT_PASSAGES` / `window.MCAT_BANK` — the question bank, keyed by
  subject id. Each item is `{ topic, stem, options, answer, why }`, optionally
  with `whys` (per-option notes) and `passage` (a key into `MCAT_PASSAGES`).
  `answer` is a zero-based index into `options`.
- `CONFIG` — learner name, exam date, prep start, pass mark, round length, and
  whether locked subjects are listed.

`SUBJECTS` below them holds the syllabus. Moving a subject from
`status: 'locked'` to `'active'` is what unlocks its practice when the course
starts.
