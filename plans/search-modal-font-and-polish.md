# Quran One — Search Modal, Tashkeel-Insensitive Search, Real Amiri Quran Font, Rounded Corners

## Context

The extension is built and working. This iteration addresses five user requests:
1. Verse search fails on bare Arabic (without tashkeel) because the Quran text is fully vocalized — searching `الله` doesn't match `ٱللَّهِ`.
2. The surah/verse pickers are cramped dropdowns; they should open as a roomy modal overlay inside the popup.
3. "Amiri Quran" appears in the CSS font stack but the font file is **not bundled**, so Chrome silently falls back to Geeza Pro — the rendering doesn't match https://fonts.google.com/specimen/Amiri+Quran. Bundle the real font file.
4. User made CSS changes (body 420×420, `border-radius: 10px`, flex column, `.ayah-card` scrollable) — **preserve them**; all CSS work is additive except replacing the old `.dropdown-panel` styles (mine, not the user's) which the modal redesign supersedes.
5. Rounded popup corners: keep the user's `border-radius: 10px` on body and make it actually visible by clipping children (`overflow: hidden`) and making `html` transparent. Note: the outer popup *window* corner is controlled by Chrome/OS (already rounded on macOS Chrome); CSS cannot alter the OS window shape — we round everything within our control.

After approval, copy this plan to `plans/search-modal-font-and-polish.md` in the project (user keeps plans in-repo).

## Changes

### 1. Tashkeel-insensitive Arabic search — new `js/arabic.js`

Export `normalizeArabic(text)` used for **both** the stored `searchText` of items and the live query:
- Strip: tashkeel/tanween/shadda/sukun `ً-ٟ`, superscript alef `ٰ`, Quranic annotation marks `ۖ-ۭ`, tatweel `ـ`.
- Normalize letters: `ٱأإآ → ا` (incl. alef wasla, heavily used in this text), `ى → ي`, `ة → ه`, `ؤ → و`, `ئ → ي`.
- Wire in: `js/popup.js` (`renderSurahDropdownItems`, `renderVerseDropdown`) build `searchText` through `normalizeArabic(...)`; `js/dropdown.js` `renderList` normalizes the query (keep the existing Arabic-digit → Latin digit normalization).
- Result: typing `قل هو الله احد` matches `قُلْ هُوَ ٱللَّهُ أَحَدٌ`.

### 2. Search opens as a modal inside the popup — rework `js/dropdown.js` + CSS

Keep the same `createDropdown({container, showSearch, onSelect, searchPlaceholder})` API, trigger buttons stay in the footer. Change what opens:
- A fixed-position overlay (`.picker-overlay`, `position: fixed; inset: 0`, dim backdrop) containing a panel (`.picker-modal`) that fills most of the 420×420 popup.
- Panel layout: large search input at top (~15px font, comfortable padding) — only when `showSearch` is true (keeps the ">20 verses" rule) — plus a close ✕ button; below it the scrollable result list filling the remaining height.
- Verse items may wrap to 2 lines (`-webkit-line-clamp: 2`) so more text is readable; surah items stay one line.
- Close on: item select, ✕, backdrop click, Escape. Focus the search input on open (existing behavior).
- CSS: replace `.dropdown-panel` block with `.picker-overlay` / `.picker-modal` styles; keep `.dropdown-trigger`, `.dropdown-item` (widened), `.dropdown-search` (enlarged), `.dropdown-empty`.

### 3. Bundle the exact Google "Amiri Quran" font

- Download the real font file at build time (same pattern as Quran data — one-time, then bundled, no runtime network):
  - `curl` `https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap` **with a Chrome User-Agent** to get the woff2 subset URLs from `fonts.gstatic.com` (default UA yields a single ttf: `_Xmo-Hk0rD6DbUL4_vH8Zq5t.ttf`; woff2 is smaller — use it if served, else bundle the ttf).
  - Save to `fonts/amiri-quran.woff2` (+ latin subset if listed). Add a small `scripts/fetch-font.mjs` or document the curl in a comment.
- `css/popup.css`: add `@font-face { font-family: "Amiri Quran"; src: url("../fonts/amiri-quran.woff2") format("woff2"); font-display: swap; }` before the existing font stack (stack order already correct). No manifest change needed — same-package resources load fine under extension CSP.
- **Demonstrate**: via CDP run `document.fonts.ready` then `document.fonts.check('24px "Amiri Quran"')` → must be `true`, and before/after screenshots showing the distinctive Amiri glyph shapes (clearly different from Geeza Pro fallback).

### 4. Preserve user CSS — hard constraint
The user hand-edits `css/popup.css`; **re-read it immediately before editing** and never revert their declarations, even redundant-looking ones. Exact inventory to keep as-is (state at planning time):
- `body`: `width: 420px`, `height: 420px` (+ commented-out `height: 100%`), `overflow-y: hidden`, `border-radius: 10px`, `display: flex; flex-direction: column` (appears twice — leave the duplication alone)
- `.ayah-card`: `overflow-y: auto`, `flex: 1`
All CSS work is additive (new `@font-face`, `.picker-*` blocks, `overflow: hidden` + `html` rules for corners). The only removal permitted is the old `.dropdown-panel` block, which is my earlier code that the modal replaces — not a user edit.

### 5. Rounded corners
- `body`: keep the user's `border-radius: 10px`, add `overflow: hidden` so the teal header/footer corners are clipped to the radius.
- `html { background: transparent; border-radius: 10px }` so no square white box paints behind the rounded body where the browser allows it.
- Verify in headless Chrome with `--default-background-color=00000000` — corners must show transparency in the screenshot alpha. Document that the OS-level popup window frame is Chrome's to round (it already does on macOS).

## Files touched
- `js/arabic.js` (new), `js/popup.js`, `js/dropdown.js`
- `css/popup.css`, `fonts/amiri-quran.woff2` (new, downloaded), `scripts/fetch-font.mjs` (new)
- `plans/search-modal-font-and-polish.md` (copy of this plan)

## Verification
1. Serve locally (`python3 -m http.server`) + headless Chrome CDP script (extend the existing scratchpad `cdp-test.mjs`):
   - Bare-Arabic search: verse search `الله` in surah 112 → matches ayah 1/2; `قل هو الله احد` → ayah 1; surah search `الفاتحه` (with ه) still finds الفاتحة.
   - Modal behavior: trigger click opens overlay; Escape / backdrop / ✕ close it; selection navigates and closes; search-input presence still obeys the >20 rule (surah 103 → no input).
   - Regression: rerun the previous 11-step navigation/persistence flow.
   - Font: `document.fonts.check('24px "Amiri Quran"')` === true after `document.fonts.ready`.
2. Screenshots: full popup (Amiri Quran glyphs), open modal, and a transparent-background shot proving rounded corners.
3. Manual: load unpacked in Chrome, confirm popup look, search UX, and corners.

## Implementation notes (deviations found during verification)

1. **Alef handling in `js/arabic.js`**: mapping alef forms to plain `ا` was not enough — the Uthmani text writes words like ملائكة with a *dagger alef* (U+0670) where modern typing uses a full alef, so queries could never match. All alef forms (ا أ إ آ ٱ) are now **deleted** from both sides of the comparison instead. Verified: "واذ قال ربك للملايكه" finds 2:30, "الرحمن" finds 55:1.
2. **`.picker-overlay[hidden] { display: none }`** was required: the overlay's `display: flex` rule silently defeated the `hidden` attribute, leaving the modal permanently visible. Caught by screenshot, now asserted in the E2E test via `getComputedStyle`.
