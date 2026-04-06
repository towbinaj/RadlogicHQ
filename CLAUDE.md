# RadioLogicHQ v1.1

## Commands
npm run dev       # Vite dev server
npm run build     # Production build to dist/
npm run preview   # Preview production build

## Architecture
- Vanilla ES6+ modules, no framework — multi-page app (MPA) via Vite
- Firebase backend: Auth (email + Google OAuth), Firestore (preferences, templates, reports, analytics)
- Deployed to Netlify (auto-deploy on git push to main)
- Live: radiologichq.netlify.app
- Dark radiology reading room theme by default

## Key Directories
- `src/core/` — Shared framework (engine, renderer, report/pill-editor, auth, storage, parser, Firebase client)
- `src/components/` — Web Components (report-output with pill editor, auth-ui modal)
- `src/tools/{toolId}/` — One directory per calculator tool (TI-RADS, LI-RADS)
- `src/pages/` — Non-tool pages (profile, privacy)
- `src/styles/` — CSS: variables.css, base.css, forms.css (shared styles)
- `src/data/` — Tools registry, CDE sets
- `src/assets/fonts/` — Self-hosted Inter font (GDPR: no Google Fonts CDN)
- `public/images/{toolId}/` — Reference SVG images per tool
- `docs/` — architecture.md, state.md, newtool.md, toolui.md, compliance.md

## Tools
- **TI-RADS** — point-based thyroid nodule risk calculator (CDE: RDES152)
- **LI-RADS** — decision-tree liver HCC categorization (CDE: RDES5)

## Tool Types
- **Point-based** (TI-RADS): scored sections with option card grids, `renderToolForm()`, `calculateScore()`
- **Decision-tree** (LI-RADS): step-by-step wizard, custom DOM, custom calculator

## Authentication
- Firebase Auth: email/password + Google OAuth + forgot password
- `<auth-ui>` modal on all pages — AcademiQR-inspired design
- Signup requires privacy policy consent checkbox
- Header shows username when logged in, links to profile
- Anonymous users can use all tools (auth required only for saving)

## Data Flow
- **Logged out**: localStorage only (current behavior)
- **Logged in**: localStorage + background Firestore sync
- storage.js is the gateway — checks auth status, routes to Firestore or localStorage
- On login: Firestore prefs pulled into localStorage; on write: saves both places
- prefsCache cleared on sign-out (prevents user data bleed)

## Report Editor (Pill-based)
- contentEditable div with inline colored pill spans
- Pills = structured data fields (values from calculator)
- Free text typed around pills (labels, headings, custom text)
- Palette panel: drag pills from palette into editor
- Pill popover (pencil icon): edit display aliases per value, toggle, remove, add custom options
- Custom fields: "+ New field" in palette creates new pill types
- editorContent serialized as array of text/pill nodes
- Backward compatible: falls back to block-based rendering if no editorContent

## Compliance
- **HIPAA**: No PHI stored. PHI disclaimer on reports. No individual timestamps. Aggregate-only analytics.
- **GDPR**: Self-hosted fonts. Privacy policy page. Account deletion + data export. Consent at signup.
- See `docs/compliance.md` for full details

## Conventions
- Dark theme by default (all colors from CSS variables)
- Shared styles in `forms.css` — tool CSS is minimal overrides only
- Tooltips (hover `title`) instead of inline gray text
- No number spinners (`class="no-spinner"`)
- Efficiency first: minimize clicks, scrolling, mouse mileage
- All labels same size/weight per `docs/toolui.md`

## Adding a New Tool
See `docs/newtool.md` for the complete checklist.

## Watch Out For
- Pill editor creates editorContent on first edit — reset clears it
- Hyphenated section IDs need camelCase mapping for template variables (e.g., `echogenic-foci` → `echogenicFoci`)
- Multi-nodule editorContent: split at IMPRESSION boundary, render findings per nodule
- AbortController on pill editor prevents event listener leaks
- Firebase config is in `.env.local` (gitignored) — must be set in Netlify env vars too
- Firestore security rules in `firestore.rules` — deploy via Firebase Console
- `removeStored()` handles both localStorage and Firestore deletion — don't use `localStorage.removeItem` directly
