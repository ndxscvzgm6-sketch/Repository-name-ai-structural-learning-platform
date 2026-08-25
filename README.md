# Math Quest

A playful, mobile-first math learning app for the Square Root Method unit
(quadratics of the form `u² = k`), featuring **Quint** — a friendly purple
mascot that reacts as you learn — interactive manipulatives, a multi-step
adaptive solver, mistake-aware practice, and a soft pastel / frosted-glass
aesthetic.

The whole app is a single self-contained `index.html`. No build step, no
dependencies to install.

## Run it locally

### Option 1 — just open the file

Double-click `index.html`, or open it in any modern browser. That's it.

### Option 2 — serve it (recommended on some browsers)

A couple of browsers refuse to run inline Babel from `file://`. If the page
loads blank, serve it over HTTP instead:

```bash
# Python (almost always pre-installed)
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

```bash
# Or with Node
npx serve .
```

## What's inside

- **Home** — mastery rings, daily review card, XP / streak / gem chips
- **Concept** — interactive `k`-slider manipulative: drag past zero and watch
  the solutions migrate from the real line to the complex plane; "Why does
  this work?" mini-lesson with a convince-yourself `i × i` interactive
- **Solver** — 3-step adaptive walkthrough with tiered nudge → hint → just-
  show-me, color-pulsing the algebra as it changes
- **Practice** — slip-aware feedback ("forgot ±", "dropped i"), side-by-side
  *your path* vs *better path* when you miss
- **Celebrate** — Quint with confetti when a unit is complete

Built on React + KaTeX (loaded from CDN), with Babel-standalone for in-
browser JSX compilation. Progress persists in `localStorage`.

---

## Also in this repo

- [`mcat-tracker/`](mcat-tracker/) — **MCAT Tracker**, a single-file study
  tracker: the AAMC content map, timed practice rounds and exams, a
  spaced-repetition error log, a study calendar, and progress analytics.
