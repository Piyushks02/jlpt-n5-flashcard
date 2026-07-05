# JLPT N5 Flashcards

A complete, offline-first flashcard web app for studying everything required for the **JLPT N5** exam. No account, no server, no build step — just open and study.

🔗 **Live site:** [piyushks02.github.io/jlpt-n5-flashcard](https://Piyushks02.github.io/jlpt-n5-flashcard/)

---

## Features

- **5 decks** — Hiragana, Katakana, Kanji, Vocabulary, Grammar
- **4-level mastery tracking** — Unknown → Learning → Familiar → Mastered
- **Weighted progress bars** — per deck and overall, with points score
- **Practice filters** — filter by mastery level and category (multi-select)
- **Kana subcategory filter** — drill into specific rows (a, ka, sa … / dakuten / combo)
- **Flip cards** with direction toggle (JP → EN or EN → JP)
- **Typed answer check** — for kana, kanji, and vocabulary
- **Keyboard shortcuts** — `Space` flip · `← →` navigate · `1–4` set mastery · `Esc` exit textbox
- **Practice calendar** — GitHub-style heatmap of the last 6 months
- **Session summary** — cards viewed and level changes per session
- **Select mode** in deck view — bulk-mark multiple cards to a mastery level
- **4 color themes** — Ai & Shu (default), Indigo, Calm/Focus, Playful — each with light/dark toggle
- **Export / Import** progress as JSON
- **Save to directory** — Chrome/Edge: auto-save progress to a chosen folder
- Works from `file://` — no server needed

---

## Card counts

| Deck | Cards |
|---|---|
| Hiragana | 104 (basic + dakuten + yōon) |
| Katakana | 104 (basic + dakuten + yōon) |
| Kanji | 106 |
| Vocabulary | 631 |
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
| `1` | Mark as Unknown |
| `2` | Mark as Learning |
| `3` | Mark as Familiar |
| `4` | Mark as Mastered |
| Any letter | Focus answer box |
| `Enter` *(in answer box)* | Submit answer, then releases focus |
| `Enter` *(outside answer box)* | Next card |
| `Esc` | Exit answer box |

---

## Progress & storage

Progress is stored in **`localStorage`** — it persists across browser restarts but is tied to the browser and device. To back up or transfer progress:

- **Export** — downloads `jlpt-n5-progress.json`
- **Import** — restores from a previously exported file (replaces current progress)
- **Save to directory** *(Chrome/Edge only)* — picks a folder and auto-saves on every change

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
