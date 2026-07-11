# Quran One — Chrome Web Store Readiness

## Context

The extension works and is tested. The user wants to submit it to the Chrome Web Store with zero review blockers. A compliance review against current CWS policies found the code itself already satisfies the hard rules; what's missing is a clean submission package, the mandatory listing assets (screenshots), prepared dashboard answers (single purpose, permission justification, privacy declarations), and minor polish (anti-aliased icons, a11y labels).

**Already compliant (no changes needed):** Manifest V3; only permission is `storage` (no host permissions → eligible for fast review); zero remote code (Quran data + Amiri Quran font bundled, no network calls at runtime); no eval / no obfuscation / no inline scripts; readable source (minification not needed); icons 16/32/48/128 present; valid manifest JSON; version `1.0.0`; no `_`-prefixed or reserved paths in runtime files.

**Gaps found:** repo root contains non-runtime files that must not ship (`.DS_Store`, `scripts/`, `plans/`, `quran one technical requirements.md`); no store screenshots (upload requires ≥1 at 1280×800 or 640×400); no prepared privacy/single-purpose/permission texts; icons have hard aliased edges (weak store presentation); search inputs lack `aria-label`.

## Changes

### 1. Packaging script — `scripts/package.mjs` (new)
Builds `dist/one-quran-v<version>.zip` (version read from manifest.json) containing ONLY runtime files:
`manifest.json, popup.html, css/, js/, data/, fonts/, icons/`.
Excludes dotfiles. After zipping, the script verifies the archive: lists entries, fails if any junk (`.DS_Store`, `scripts/`, `plans/`, `*.md`) or `_`-prefixed top-level path slipped in, prints final size (~1.9 MB expected).

### 2. Icon polish — update `scripts/make-icons.py`, regenerate `icons/*.png`
Same crescent design and colors; add 4× supersampling with box-downsample so edges are anti-aliased (the current hard pixel stairs look low-quality at 128px in the store listing). No manifest changes.

### 3. Minor a11y/quality — `js/dropdown.js`
Add `aria-label` to the picker search inputs (reuse the placeholder text). Nothing else — buttons already have labels.

### 4. Store assets — new `store/` directory (NOT shipped in the zip)
- **`store/screenshots/`** — generate 2–3 mandatory screenshots at exactly **1280×800** via headless Chrome + CDP: a temporary `store/stage.html` renders a 1280×800 branded backdrop (green palette, Arabic tagline) with the live popup embedded in an iframe; capture (a) reading view with Amiri Quran text, (b) search modal open with bare-Arabic results. This satisfies the screenshot requirement at upload time.
- **`store/LISTING.md`** — ready-to-paste dashboard content, Arabic primary + English translation:
  - Title, short description (≤132 chars), detailed description.
  - Category suggestion (Education), primary language (العربية).
  - **Single purpose statement**: reading the Quran one ayah at a time in the browser popup.
  - **Permission justification** for `storage`: saves only the last-read position locally on the device; nothing is transmitted.
  - **Privacy practices tab answers**: collects no user data, no PII, nothing sold/transferred, no remote code — check "does not collect or use data".
  - **Submission checklist** for account-side steps Claude can't do: $5 one-time developer registration, verified email + 2FA, upload zip from `dist/`, paste texts, attach screenshots.
- **`store/PRIVACY.md`** — short privacy policy (AR+EN: "all data stays on your device; only the last-read ayah position is stored locally; nothing is collected or shared") ready to host (e.g. GitHub) if a URL is wanted; not strictly required since no data is collected.

### 5. Plan copy
Copy this plan to `plans/chrome-store-readiness.md` (user keeps plans in-repo).

## Verification
1. `node scripts/package.mjs` → zip builds; entry listing shows only runtime paths; junk-file check passes; size printed.
2. Unzip into a scratch dir, serve it, and run the existing E2E suite (`cdp-test2.mjs`, adjusted URL) against the **unzipped package** — proves the exact submitted artifact works (font loads, search modal, navigation, persistence).
3. `node -e` manifest JSON validity + confirm regenerated icons are valid PNGs at 16/32/48/128 (`sips`), view icon128 for smooth edges.
4. View the two 1280×800 screenshots to confirm dimensions (`sips`) and presentation quality.
5. Note in final report: remaining human-only steps (developer account, dashboard form paste, screenshot upload).
