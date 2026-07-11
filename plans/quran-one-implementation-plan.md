# Quran One — Chrome Extension Implementation Plan

## Context

Greenfield project. Build a lightweight Chrome (Manifest V3) extension whose popup shows a single Quran ayah at a time, with next/prev navigation, surah + verse dropdowns (both searchable), and automatic saving of the reader's position. Requirements are in `quran one technical requirements.md`. UI is strictly RTL, Arabic-only, with a cold green/white palette. Performance is a hard requirement: it must stay "super light" despite the full Quran text (~6,236 ayahs).

Data source: https://github.com/semarketir/quranjson — verified structure:
- `source/surah.json` — array of 114 objects: `{ index: "001", title, titleAr, count, place, type, juz: [{index, verse: {start, end}}] }`
- `source/surah/surah_N.json` — `{ index, name, count, juz, verse: { verse_1: "بِسْمِ…", … } }` (text only; some surahs may include a `verse_0` bismillah — handle it as non-numbered decoration, never as ayah 1)

## Key decisions (defaults chosen for the "super light" requirement)

- **No framework, no bundler.** Vanilla ES modules + HTML + CSS. MV3 popup only — no background service worker, no content scripts needed.
- **Bundle the data inside the extension** (`data/` dir) rather than fetching from GitHub at runtime: works offline, zero network permissions, instant loads.
- **Lazy loading:** on popup open, load only `data/surah-index.json` (~30 KB) + the one surah file for the saved position via `fetch(chrome.runtime.getURL(...))`. Cache loaded surahs in an in-memory `Map` for the popup's lifetime.
- **Persistence via `chrome.storage.local`** (not cookies — cookies don't apply to extension popups; storage.local needs no consent banner and survives browser restarts). Save `{ surah, ayah }` on every navigation.
- **Custom dropdowns** (native `<select>` can't embed a search input): a button that opens a panel with an optional search field + scrollable list.
- **System Arabic font stack** (`"Amiri Quran", "Scheherazade New", "Geeza Pro", "Traditional Arabic", serif`) — no bundled font files, keeps the package small; the quranjson text is fully-vocalized Unicode and renders fine.

## File structure

```
one-quran/
├── manifest.json            # MV3: action popup, "storage" permission, Arabic name/description
├── popup.html               # <html dir="rtl" lang="ar">
├── css/popup.css            # cold green/white palette, RTL layout
├── js/
│   ├── popup.js             # entry: init, wire events, render
│   ├── data.js              # index + lazy surah loading, in-memory cache, juz lookup
│   ├── storage.js           # get/save position via chrome.storage.local
│   └── dropdown.js          # reusable searchable-dropdown component
├── data/
│   ├── surah-index.json     # copy of source/surah.json
│   └── surah/surah_1.json … surah_114.json
├── icons/                   # 16/32/48/128 png (simple green book/crescent glyph, generated)
└── scripts/fetch-data.mjs   # one-time Node script: downloads the 115 JSON files from the repo
```

## Implementation steps

1. **`scripts/fetch-data.mjs`** — download `source/surah.json` → `data/surah-index.json` and the 114 `surah_*.json` files from `raw.githubusercontent.com/semarketir/quranjson/master/...`. Run once; commit the data.

2. **`manifest.json`** — MV3, `"action": { "default_popup": "popup.html" }`, `"permissions": ["storage"]`, Arabic `name` (e.g. "قرآن — آية بآية"). Nothing else.

3. **`js/data.js`**
   - `loadIndex()` → fetches `surah-index.json` once.
   - `loadSurah(n)` → fetches `data/surah/surah_${n}.json`, memoized in a `Map`.
   - `getJuz(surahMeta, ayah)` → walks the surah's `juz` ranges (parse `verse_N` → N) to return the juz number for the current ayah.
   - Verse access by key `verse_${ayah}`; ignore `verse_0` if present.

4. **`js/storage.js`** — `getPosition()` / `savePosition({surah, ayah})` thin wrappers over `chrome.storage.local`. Default position: surah 1, ayah 1.

5. **`js/dropdown.js`** — one component used twice:
   - Trigger button showing current selection; panel with search `<input>` + `<ul>`.
   - Surah dropdown: always shows search; items rendered as `<number>. <titleAr>`; filter matches Arabic name or number.
   - Verse dropdown: items as `<number>. <truncated verse text>` (CSS ellipsis, one line); search input shown **only when count > 20** (per requirement); filter by number or text substring.
   - Performance: list is built only when the panel opens (verse texts come from the already-cached surah — no extra fetch); search filtering is debounced (~120 ms); even 286 items render fine as plain `<li>`s with ellipsis.

6. **`popup.html` + `js/popup.js`** — layout top-to-bottom, RTL:
   - **Header:** surah name (right side); left side: current ayah / total ayahs (e.g. "الآية ٥ من ٢٨٦") and juz number ("الجزء ٣").
   - **Body:** the single ayah text, large, centered, comfortable line-height, with the ornamental ayah-number marker (﴿٥﴾).
   - **Footer nav:** prev button on the **right** (السابقة), next on the **left** (التالية), the two dropdowns between them (surah first, then verse).
   - Navigation logic: next past the last ayah advances to the next surah's ayah 1; prev before ayah 1 goes to the previous surah's last ayah; buttons disabled at 1:1 and 114:6. Selecting a surah from the dropdown jumps to its ayah 1; selecting a verse jumps directly. Every position change calls `savePosition` and updates header/verse/dropdown labels.
   - Keyboard: ← = next, → = prev (RTL-natural), nice-to-have.

7. **`css/popup.css`** — fixed popup width ~380 px; palette: near-white green background (e.g. `#f3faf6`), white card for the verse, deep cool green accents (`#0f766e` / `#166534`) for buttons and header; soft borders, rounded corners; everything `dir=rtl`-aware (use logical properties: `margin-inline-start`, etc.).

## Verification

1. `node scripts/fetch-data.mjs` → confirm `data/` contains `surah-index.json` + 114 surah files; spot-check surah 1, 2, 114 JSON validity.
2. Load unpacked at `chrome://extensions` (Developer mode) → open the popup.
3. Manually verify:
   - Default opens at Al-Fatihah 1:1; header shows name/count/juz correctly.
   - Next/prev walk across a surah boundary (e.g. 1:7 → 2:1 and back).
   - Surah dropdown search by Arabic name ("البقرة") and by number ("2").
   - Verse dropdown: no search for surah 103 (3 ayahs), search present for surah 2 (286) and filters by number and text.
   - Navigate to e.g. 2:120, close popup, reopen → position restored; also after full browser restart.
   - Juz number changes correctly inside surah 2 (juz 1 → 2 → 3).
   - Layout is fully RTL, Arabic-only, no horizontal scroll.
