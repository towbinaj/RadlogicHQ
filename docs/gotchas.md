# RadioLogicHQ — Gotchas & Watch-Outs

Non-obvious things that will bite you when working on specific parts of the app. Grouped by topic. The most critical items are also in `CLAUDE.md` under "Critical Watch-Outs"; this file holds the longer tail.

## Pill Editor

- **editorContent is created on first edit** — until then, rendering falls back to the block-based template. Clicking "Reset" on a template clears editorContent, reverting to block-based rendering.
- **Hyphenated section IDs need camelCase mapping for template variables.** Example: `echogenic-foci` in the section ID maps to `{{echogenicFoci}}` in the template.
- **Multi-nodule editorContent** must be split at the IMPRESSION boundary, with findings rendered per nodule. See `report-output.js`.
- **AbortController on the pill editor** prevents event listener leaks when the editor is re-rendered. Don't remove the abort wiring unless you replace it with equivalent cleanup.

## Storage (`storage.js`)

- **Use `setStored()` / `getStored()` / `removeStored()` — never raw `localStorage` calls.** The wrapper handles both localStorage and Firestore sync. `removeStored()` in particular cascades deletion to Firestore when logged in; `localStorage.removeItem` alone would leave orphans.
- **Tools should use `getSizeUnit(toolId)`** for mm/cm — it falls back through per-tool → global `defaultUnit` → `'mm'`. Never read `sizeUnit:` keys directly.
- **Firestore sync failures show a toast** via `toast.js`. Analytics write failures stay silent (fire-and-forget atomic increments).
- **`prefsCache` is cleared on sign-out** to prevent one user's data bleeding into the next session on a shared device.

## Auth (`auth.js`, `auth-state.js`)

- **`auth-state.js` exists to break a circular import** between `auth.js` and `user-data.js`. Both import from `auth-state.js`, never from each other for state. If you add a new file that needs the current user, import from `auth-state.js`.
- **Google OAuth requires Firebase Authorized Domains**, separate from Cloudflare custom domains and CSP whitelist. If you see `auth/unauthorized-domain`, add the domain at Firebase Console → Authentication → Settings → Authorized domains.
- **Password change re-authenticates first.** `updateUserPassword()` calls `EmailAuthProvider.credential()` + `reauthenticateWithCredential()` before `updatePassword()` because Firebase requires recent auth for sensitive ops. Failures surface as `auth/requires-recent-login`.

## Parser (`parser.js` + per-tool `parseRules`)

- **Parse rules are auto-generated** from definition labels + a ~100-entry synonym dictionary in `parser.js`. Most tools need no manual `parseRules`.
- **Hand-written `parseRules` override auto-generated on conflict.** Use them only for disease-specific terminology. ~30 tools have manual overrides.
- **Two synonym layers**: cross-tool (`SYNONYMS` dict in `parser.js`) and tool-specific (`parseRules` in each `definition.js`).
- **Run `npm run check-synonyms {toolId}`** to audit coverage; add missing synonyms to `SYNONYMS` or `parseRules` as needed.

## Brand Assets

- **Use `BRAND` constants from `src/core/brand.js`** (`logoWhite`, `wordmarkWhite`, etc.) instead of hardcoding `/brand/foo.png` paths. Single source of truth; a future rename only touches one file.
- **Header wordmark srcset**: The header `<img>` uses `srcset` with 400w / 800w / 1200w variants. If you bump `.site-header__wordmark { height }`, update the `sizes` attribute (currently `"172px"`, matching ~5.36:1 aspect at 32px tall) across all 52 HTML files or the browser picks the wrong variant.

## HL7 safety in report output

Report text is copied into PS360 / PowerScribe One / RadAI Omni and ultimately rides an HL7 v2 ORU message through hospital interfaces. **HL7 v2 structural delimiters in an OBX-5 field will corrupt the message.**

- **Never in templates, labels, or tooltips that flow into the report:**
  - `|` (field separator) → use `;` or parens
  - `~` (repetition separator) → write `approx`
  - `^` (component separator) → use `-`
  - `&` (subcomponent separator) → use `and`
  - `\` (escape char) → use `/`
- The clipboard `asciiSafe()` function in `src/core/clipboard.js` **neutralizes** these on copy as a backstop, but they should not be in templates at all — downstream tools may read the report text via other paths besides the copy button (template import/export, Firestore `saved_reports`, etc).
- **Non-ASCII characters** (`—`, `–`, `≥`, `≤`, `°`, `×`, `±`, `→`) are automatically normalized to ASCII on copy (`≥` → `>=`, `—` → `--`, etc.) — see `ASCII_MAP` in `clipboard.js`. Modern HL7 v2.5+ interfaces handle UTF-8 fine, but legacy v2.3/v2.4 interfaces mangle it to `?`, and sanitizing on copy closes that gap.
- Unit tests for the sanitizer live in `src/core/clipboard.test.js` — 20 test cases covering each transformation and a realistic TI-RADS snippet assertion that verifies pure 7-bit ASCII output.
- **If you add a new character** to a template or definition, either:
  1. Stick to ASCII (preferred — one less layer of complexity), or
  2. Add it to `ASCII_MAP` in `clipboard.js` with a test case in `clipboard.test.js`.

## Security & CSP (`public/_headers`)

- **Any new third-party script, analytics service, image CDN, or API call must be added to the appropriate CSP directive** (`script-src`, `connect-src`, `img-src`). The browser will silently block unlisted sources. CSP violations appear in DevTools Console as *"Refused to ... because it violates the following Content Security Policy directive"*.
- **`escapeHtml()` helper in `report-output.js`** — use it whenever you interpolate user-controlled data into an `innerHTML` template literal. The pill palette currently wraps `truncValue`, item labels, and section labels.
- **`style-src` includes `'unsafe-inline'`** because several components (feedback-widget, auth-ui) inject `<style>` blocks at runtime. Tighten this only if you move those styles to dedicated `.css` files.
- **Test CSP changes in an incognito window** after deploy — aggressive browser caching hides CSP regressions.

## Cloudflare Pages Functions (`functions/`)

- **Pages Functions are separate from Vite's bundle.** The `functions/` directory is deployed directly by Cloudflare Pages, not processed by Vite. Don't import `functions/*.js` from `src/*.js` or vice versa.
- **Env vars for Functions live in Cloudflare Pages dashboard** → Settings → Variables and Secrets, NOT in `.env.local`. `GITHUB_TOKEN` (used by `api/feedback.js`) must be set as a **Secret**, not Plaintext.
- **`VITE_*` vars are build-time, not runtime.** They get inlined into the client bundle and are effectively public. Runtime secrets (like `GITHUB_TOKEN`) should never have the `VITE_` prefix.

## Build & Tooling

- **`vite.config.js` auto-discovers HTML entries** from `src/tools/*/*.html` and `src/pages/*.html`. No manual updates needed when adding tools.
- **Run `npm audit` after any dep upgrade.** Vite has had a history of dev-server CVEs (path traversal via `server.fs.deny` bypass, arbitrary file read via WebSocket). Production is unaffected because Cloudflare serves static `dist/` output, but dev machines matter.
- **Run `npm run test:run` before committing.** 93 tests covering engine, parser, and several tool calculators.

## New Tool Requirements

- **Include `trackEvent('tool:{toolId}:opens')`** as the first line of the tool's `init()` function. Silent fire-and-forget analytics.
- **Register the tool in `src/data/tools-registry.js`** with body parts, modalities, and specialties. Untagged tools won't appear in filter dropdowns.
- **Include the standard `<head>` block** (favicon links, canonical URL, OG + Twitter meta). See `docs/newtool.md` section 6 for the template.
- **Include the wordmark `<img>` in the header** — not the old text span. See the template in `docs/newtool.md`.

## AAST & Shared Patterns

- **AAST Liver, Spleen, Kidney, Pancreas all share `calculator.js` and `templates.js`** from `src/tools/aast-liver/`. Each organ has only its own `definition.js` with organ-specific findings. Don't fork the calculator when adding a new AAST organ — extend the shared one.
- **Bone Age (Sontag) imports its calculator** from `src/tools/bone-age/` (G&P).
