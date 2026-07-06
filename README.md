# JLPT N5 Flashcards

A complete, offline-first flashcard web app for studying everything required for the **JLPT N5** exam. No account, no server, no build step — just open and study.

🔗 **Live site:** [piyushks02.github.io/jlpt-n5-flashcard](https://Piyushks02.github.io/jlpt-n5-flashcard/)

---

## Features

**Decks & content**
- **5 decks** — Hiragana, Katakana, Kanji, Vocabulary, Grammar — 1,029 cards total
- **Kanji categories** — 9 thematic groups (Days, Numbers, Time, People & Body, etc.)
- **Vocab categories** — 23 categories (People, Food, Verbs, Adjectives, Greetings, etc.)
- **Kana subcategory filter** — drill into individual rows (a, ka, sa … / dakuten / combo)

**Practice modes**
- **MCQ mode** *(default)* — 6 randomly generated options, pick with mouse or `A–F` keys
- **Type mode** — write your answer in a text box; accepted on `Enter`
- **Card recycling** — queue loops infinitely after completion; counter shows `n/n ↺`
- **Flip card** — click or `Space`; always flips automatically when you submit an answer
- **Direction toggle** — JP → EN or EN → JP per deck
- **Practice from selection** — select cards in deck view then hit Practice to drill only those

**Filters & settings**
- **Mastery filter** — multi-select (Unknown / Learning / Familiar / Mastered)
- **Category filter** — multi-select chips; kana shows grouped row-level subcategories
- **Shuffle** — randomise card order
- **▶ Auto Next** — auto-advance to the next card 700 ms after a correct answer
- All practice settings configurable as defaults in the Settings page

**Progress & tracking**
- **4-level mastery** — Unknown → Learning → Familiar → Mastered (weighted points)
- **Progress bars** — per deck and overall, showing pts / total and percentage
- **Practice calendar** — GitHub-style heatmap of the last 6 months; hover a day to see pts and time
- **Time tracking** — daily and cumulative time spent, shown on the calendar page
- **Session summary** — cards viewed, level changes, and time for the current session
- **Day counter** — shows how many days since you started learning (home + calendar)

**Deck view**
- **Card grid** grouped by category with inline flip preview
- **Select mode** — select multiple cards, bulk-mark mastery, or launch a targeted practice session

**Themes & appearance**
- **4 color presets** — Ai & Shu (default), Indigo, Calm/Focus, Playful
- **Light / dark toggle** — works with every preset
- **Japan flag** SVG in navbar — renders correctly on all browsers and OS

**Data & storage**
- **Export / Import** progress as `jlpt-n5-progress.json`
- **Save to directory** *(Chrome/Edge)* — auto-saves to a chosen folder on every change
- **No server needed** — works from `file://` or any static host

---

## Card counts

| Deck | Cards |
|---|---|
| Hiragana | 104 (basic + dakuten + yōon) |
| Katakana | 104 (basic + dakuten + yōon) |
| Kanji | 106 (9 categories) |
| Vocabulary | 631 (23 categories) |
| Grammar | 84 |
| **Total** | **1,029** |

---

## Getting started

### Option 1 — Use the hosted site
Visit [piyushks02.github.io/jlpt-n5-flashcard](https://Piyushks02.github.io/jlpt-n5-flashcard/) — no setup needed.

### Option 2 — Run locally
```bash
git clone https://github.com/Piyushks02/jlpt-n5-flashcard.git
cd jlpt-n5-flashcard
```
Then open `index.html` in your browser. No build step, no dependencies.

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Space` | Flip card |
| `←` / `→` | Previous / next card |
| `Enter` *(outside answer box)* | Next card |
| `1` | Mark as Unknown |
| `2` | Mark as Learning |
| `3` | Mark as Familiar |
| `4` | Mark as Mastered |
| `A` – `F` | Select MCQ option (in MCQ mode) |
| Any letter *(outside answer box, Type mode)* | Focus answer box and start typing |
| `Enter` *(in answer box)* | Submit answer, then releases focus |
| `Esc` | Exit answer box, restore shortcuts |

---

## Progress & storage

Progress is stored in **`localStorage`** — persists across browser restarts but is tied to the browser and device. To back up or transfer progress:

- **Export** — downloads `jlpt-n5-progress.json`
- **Import** — restores from a previously exported file (replaces current progress)
- **Save to directory** *(Chrome/Edge only)* — picks a folder and auto-saves on every change

The export file includes mastery state, daily history, time log, and UI preferences.

---

## Tech stack

- Vanilla HTML, CSS, JavaScript — no frameworks, no build tools
- Single-page app with hash routing (`#/`, `#/deck/kanji`, `#/practice/hiragana` …)
- Data files register onto `window.N5DATA` so the app works from `file://`
- CSS custom properties for theming (light/dark + 4 color presets)
- `localStorage` for progress · IndexedDB for the save-directory handle

---

## Study roadmap (120 days)

| Days | Focus |
|---|---|
| 1–10 | Hiragana |
| 11–20 | Katakana |
| 21–60 | Kanji + Vocabulary |
| 30–70 | Grammar |
| 71–100 | Mixed review — all decks |
| 101–115 | Weak cards (Unknown / Learning filter) |
| 116–120 | Final timed review |

---

## License

MIT — free to use, modify, and share.

---

*Built with [Claude](https://claude.ai)*
