# JLPT N5 Flashcard Site — Implementation Plan (v1)

Goal: help a near-beginner learn everything required for **JLPT N5 in 60 days**. A multi-page,
static flashcard web app with 4-level mastery tracking, weighted progress bars, a typed
answer-check, and a practice-history calendar. No server, no build step.

---

## Core decisions
- **Storage:** browser `localStorage` as the source of truth; single browser/device.
- **Method:** simple flip decks (no spaced-repetition scheduling).
- **Content:** N5 dataset — hiragana 104, katakana 104, kanji ~106, vocab ~120, grammar ~62.
- **Direction:** both directions available per deck (see the card-faces table).
- **Audio:** none — no text-to-speech or voice anywhere.
- **Theme:** light/dark toggle **plus** a selectable color **preset** (default
  **Japanese-inspired (Ai & Shu)**) chosen in Settings — see Theming.
- **Accessibility:** color is the primary mastery indicator (colorblind support is out of scope).

## Mastery model & scoring
Each card holds one mastery level. Progress = weighted points ÷ card count.

| Level | Color | Points (of 1.0) |
|---|---|---|
| unknown | default (white / dark) | 0.0 |
| learning | yellow | 0.2 |
| familiar | blue | 0.6 |
| mastered | green | 1.0 |

- **Deck progress** = Σ(points of deck cards) ÷ (deck card count).
- **Overall progress** = Σ(points of all cards) ÷ (total card count across decks).
- The four mastery colors are tuned per theme (below) but always keep the
  **neutral → warm → cool → green** progression.

## Theming (color presets)
Users pick a **preset** in Settings (not granular per-color control); the light/dark toggle is
separate and works with every preset. Selection is saved to `localStorage`. Implement with CSS
custom properties (a `data-theme` for light/dark and a `data-preset` for the palette).

**Constraint:** blue = *familiar* and green = *mastered* / the calendar heatmap, so every preset's
**accent avoids blue and green** to prevent buttons/progress blurring into the semantic colors.

**Default = Japanese-inspired (Ai & Shu).** Ship all four:

| Preset | Accent | Light bg | Dark bg | Mastery: learning / familiar / mastered |
|---|---|---|---|---|
| **Ai & Shu** *(default)* | #2E4A8B indigo (+ #E2523B vermilion) | #F7F3EA washi | #16130F sumi | #E4B44C gold / #3B6EA5 indigo-blue / #5B8C51 matcha |
| **Indigo** | #4F46E5 | #F4F6FB | #0F1420 | #F59E0B amber / #3B82F6 blue / #16A34A green |
| **Calm / Focus** | #0D9488 teal | #F1F5F9 | #0F172A | #F59E0B amber / #38BDF8 sky / #10B981 emerald |
| **Playful** | #7C3AED violet (+ #EC4899 pink) | #FAF5FF | #1E1B2E | #FB923C orange / #60A5FA blue / #34D399 green |

*unknown* is always the neutral/default surface color for the active mode.

---

## App structure (pages)

### 0. Navigation shell — top navbar only (no sidebar)
A single persistent horizontal navbar; decks are reached via Home and a quick-switch dropdown.

- **Top navbar (global, persistent):**
  - Left: **🇯🇵 N5** logo → Home
  - Links: **Home** · **Decks ▾** (dropdown to jump straight to any deck) · **Calendar** · **Settings**
  - Right: slim **overall progress** (bar + %) · **save/unsaved indicator** (💾 / ⚠, click → export)
    · **theme toggle**
- **Per-deck progress** lives on the Home deck list and the Deck page (not in the navbar).
- **Focus mode (Practice page):** the navbar reduces to a minimal contextual bar —
  `‹ Exit · <deck> · <direction> · 12/40 · deck progress`.
- **Mobile:** navbar collapses to a **hamburger menu** (Home / Decks / Calendar / Settings).

### 1. Home page
- **Overall progress** bar (weighted, across all decks).
- **Deck list** — Hiragana, Katakana, Kanji, Grammar, Vocab — each showing its own mini
  progress + card count. Click a deck → Deck page.
- Link to **Calendar page**.

### 2. Deck page (opens on selecting a deck)
- **Deck progress bar** at top, with a small text summary beneath it, e.g.
  `unknown 40 · learning 12 · familiar 8 · mastered 4`.
- **Grid of all flashcards** in the deck, each tinted by mastery color.
- Clicking a grid card **flips it in place** (preview); it does not enter Practice.
- Cards grouped **by category**:
  - Kana → by row/family (a, ka, sa, ta, na, ha, ma, ya, ra, wa, n; plus dakuten & yōon groups).
  - Vocab → by category (People, Numbers, Time, …).
  - Kanji / Grammar → single group (categories may be added later).
- **Practice / Start** button → Practice page.

### 3. Practice page
- **Flip card**: click to flip, click again to flip back.
- **Mastery buttons**: unknown / learning / familiar / mastered. Selection rules:
  - All cards start **unknown**.
  - Opening **any** card → the currently-selected button = the card's **current level**
    (no auto-promotion). Nothing changes unless the user clicks a different level.
  - The selected level is committed **when advancing to the next card**.
  - Demotions are allowed (a level can go down); they are kept in state but do **not** count
    toward calendar progress.
- **Direction toggle** (per deck — see faces table below).
- **Shuffle toggle** (on/off).
- **Category selector**: include *all*, a *single* category, or *some* categories.
- **Mastery filter (button group)**: `All · Unknown · Learning · Familiar · Mastered`. The four
  level buttons are **multi-select** (practice any combination); selecting **All** overrides and
  clears the others. Controls which cards enter the practice queue.
- **Answer check (formative only)**: a textbox to type the answer + verify. Submitting shows
  **only** correct/incorrect (and reveals the expected answer) — it does **not** change mastery
  or advance the card.
  - **Disabled/hidden when the card shows the English/romaji (answer) side** — only active when
    the shown face is Japanese.
  - **Per-deck answer:** Kana → romaji · Vocab → English gloss · Kanji → English meaning ·
    **Grammar → no answer box** (its answer is a full phrase; typing it would just frustrate).
  - **Matching** normalizes case, whitespace, and punctuation, and accepts **any one** of the
    gloss's separator-split alternatives (`,` `/` `;`) — e.g. "expensive" matches a
    "tall, expensive" card. No synonym/semantic matching beyond that.
- **Keyboard shortcuts**: `1–4` set mastery level, `←/→` navigate, `Space` flip, `Enter` submit answer.
- **No audio.**

**Card faces per deck (direction toggle):**

| Deck | Japanese side (front default) | Answer side |
|---|---|---|
| Kana | kana | romaji |
| Vocab | Japanese word | English (+ reading shown here) |
| Kanji | kanji | meaning + on/kun readings |
| Grammar | grammar point | meaning + example |

Reverse direction puts the answer side on the front, which disables the answer box.

### 4. Calendar page
- GitHub/LeetCode-style **heatmap** of practice days over the **last 3 months**; darker green =
  more progress that day.
  - Intensity = weighted **points gained** that day (u→l=+0.2, l→f=+0.4, f→m=+0.4). A day
    practiced with no level change still counts as "active" (lightest shade).
- Below the calendar: **current-session summary** —
  - **Cards viewed** this session (a card counts as viewed once it's **flipped** in Practice).
  - **Level moves** this session (which cards moved to which levels).

### 5. Settings page
- **Light/dark toggle** and a **color-preset selector** (Ai & Shu / Indigo / Calm / Playful).
- **Daily session reset time** — a time picker for when each day's session resets and the
  calendar day rolls over (the "logical-day boundary"). **Default 05:00** local.
- **Default direction** per deck and default shuffle on/off.
- Export / Import / Link-save-file controls also live here.

---

## Data model
Datasets ship as `.js` files that register onto a global `window.N5DATA` (so the app works from
`file://` with no server). Required fields per card type:

- **Kana** (`hiragana`, `katakana`): `kana`, `romaji`, `group` (gojuon/dakuten/combo), and a
  **`row`/`family`** field (a, ka, sa, …) for grouping in the grid and category filter.
- **Kanji**: `kanji`, `meaning`, `on`, `kun`, `example`.
- **Vocab**: `jp`, `reading`, `en`, `cat` (category).
- **Grammar**: `point`, `meaning`, `example`, `exampleEn`.
- **Answer key** for the answer-check: kana → `romaji`, vocab → `en`, kanji → `meaning`
  (grammar has no answer box). Keep glosses to clean, comma-separated meanings so each part is
  individually acceptable under the matching rules.

---

## Storage & persistence

A static web page **cannot silently auto-write a file to disk** — file writes require a
user-initiated download or the File System Access API (Chromium-only, needs a permission grant).
Therefore `localStorage` is the source of truth and files are for backup/portability.

| Data | Where | Lifetime |
|---|---|---|
| **Mastery state** (level per card) | `localStorage` (permanent key) | until browser/device/cache cleared |
| **Daily history** (per-day points gained / level moves) — drives the calendar | `localStorage` (permanent key) | same |
| **Current-session log** (cards viewed + level moves this session) | `localStorage` (session key, stamped with logical-day) | resets at the **configured daily reset time** (default 05:00 local); survives tab reload/close-reopen |
| **UI preferences** (light/dark mode, color preset, default direction, shuffle, daily reset time) | `localStorage` (permanent key) | until browser/device/cache cleared |
| **Backup / portability file** | **Export / Import JSON**; optional **linked auto-save file** | user-managed |

- **Single source of truth = `localStorage`.** It persists across reload and tab close, and
  clears when the device/browser/cache changes.
- **"Logical day" boundary is user-configurable in Settings (default 05:00 local).** Both the
  session reset *and* the calendar's day-bucketing use this same boundary. Example at the default:
  a day runs 05:00 → next 05:00, so practice at 02:00 counts toward the previous calendar day.
- **Import replaces** all local progress (behind a confirm dialog), not merge.
- **No backend.** A backend/DB would only be needed for true cross-device auto-sync (future).

### Live save vs backup file — mental model
Two layers with different jobs:

- **`localStorage` = the live save game.** The app reads/writes it constantly and it holds
  *everything*: mastery state, daily history, the current-session log, and UI preferences. It is
  **per-browser, per-device** — survives reloads and browser restarts, but is wiped by clearing
  browser data or switching browser/device.
- **The exported JSON file = a backup of the save game on disk.** Created by the Export button
  (or the optional linked auto-save). It exists only so a browser wipe or device change doesn't
  lose progress, and to transfer progress between devices (Import → replaces local data).

**What the export file contains vs. what stays only in `localStorage`:**

| Data | In `localStorage` | In export file |
|---|---|---|
| Mastery state (per-card levels) | ✅ | ✅ |
| Daily history (calendar) | ✅ | ✅ |
| UI preferences (theme/preset/defaults) | ✅ | ✅ (so a restore brings settings back too) |
| Current-session log (viewed + level moves) | ✅ | ❌ — deliberately ephemeral, never exported |

Because a browser cannot silently write to disk, the app nudges the user (unsaved-changes banner
+ native "Leave site?" prompt) so `localStorage` and the backup file don't drift apart.

### Export & loss-prevention
> **Browser constraint:** a page **cannot** put a custom button/text inside the tab-close
> dialog, nor open a directory picker during close. Only the generic native "Leave site?"
> prompt is available at close time. Directory choice is possible from an **in-app** button.

Behavior = **native warning + in-app reminder + optional linked auto-save**:
- **Export button** (in-app): saves JSON via the File System Access API **directory/file picker**
  on Chromium (Chrome/Edge); falls back to a normal download on Firefox/Safari.
- **Link save file** (optional, Chromium): pick a file once; the app then **auto-writes** the JSON
  on every change. The browser may re-prompt for permission periodically.
- **Unsaved-changes guard**: if there are changes since the last export/auto-save, closing the
  tab triggers the browser's generic "Leave site?" prompt, and the app shows a persistent
  **"⚠ Unsaved changes — Export now"** banner while in use.

---

## Tech / routing
- Static site, no build step. **Single-page app with hash routing** (`#/`, `#/deck/kanji`,
  `#/practice/kanji`, `#/calendar`, `#/settings`) to keep state and avoid multiple HTML files.
- Data shipped as `.js` files registering onto `window.N5DATA` (works from `file://`).

## Feature backlog / future ideas
- Daily goal tied to the 60-day plan; streak on Home.
- Undo last mark; "leech" flag for cards repeatedly failed in the typed check.
- Search/filter within the Deck grid.
- Quiz/self-test mode, SRS scheduling, mastery decay, exam-readiness estimate. Expand vocab
  toward the full N5 list.

## 60-day study roadmap
- Days 1–10: hiragana → katakana · Days 11–45: kanji + vocab · Days 20–50: grammar
- Days 46–55: reading/listening · Days 56–60: timed review · Daily: review due cards.

## Build order
1. Data (kana `row` field, per-card answer keys) + mastery/storage/session layer.
2. Hash router + nav shell (top navbar, Decks dropdown, focus mode, mobile hamburger) + Home page.
3. Deck page (grouped grid + progress summary + inline flip/preview + Start).
4. Practice page (flip, mastery rules, direction, shuffle, category + mastery filters,
   answer-check, keyboard shortcuts).
5. Calendar page (heatmap by points-gained + session summary).
6. Settings page + Export/Import + linked auto-save + unsaved-changes guard.
7. Security scan (Semgrep) + verify.
