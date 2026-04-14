# RadioLogicHQ v1.2

## Commands
npm run dev       # Vite dev server
npm run build     # Production build to dist/
npm run preview   # Preview production build
npm run test      # Vitest watch mode
npm run test:run  # Vitest single run
npm run check-synonyms <toolId>  # Check parser synonym coverage for a tool
npm run check-synonyms -- --all  # Check all tools

## Architecture
- Vanilla ES6+ modules, no framework — multi-page app (MPA) via Vite
- Firebase backend: Auth (email + Google OAuth), Firestore (preferences, templates, reports, analytics)
- Deployed to Cloudflare Pages (auto-deploy on git push to main)
- Live: radiologichq.com
- Dark radiology reading room theme by default

## Key Directories
- `src/core/` — Shared framework (engine, renderer, report/pill-editor, auth, auth-state, storage, toast, parser, Firebase client)
- `src/components/` — Web Components (report-output with pill editor, auth-ui modal)
- `src/tools/{toolId}/` — One directory per calculator tool (42 tools)
- `src/pages/` — Non-tool pages (profile, privacy)
- `src/styles/` — CSS: variables.css, base.css, forms.css (shared styles)
- `src/data/` — Tools registry, CDE sets
- `src/assets/fonts/` — Self-hosted Inter font (GDPR: no Google Fonts CDN)
- `public/images/{toolId}/` — Reference SVG images per tool
- `docs/` — architecture.md, state.md, newtool.md, toolui.md, compliance.md

## Tools (42 active)

### RADS Systems
- **TI-RADS** — thyroid nodule risk (CDE: RDES152)
- **LI-RADS** — liver HCC categorization (CDE: RDES5)
- **PI-RADS** — prostate MRI risk stratification
- **O-RADS** — ovarian-adnexal mass US risk
- **Lung-RADS** — lung cancer screening CT
- **BI-RADS** — breast imaging classification (mammo, US, MRI)
- **CAD-RADS** — coronary artery disease CTA (2.0 with modifiers)
- **NI-RADS** — post-treatment head & neck surveillance

### Oncologic
- **RECIST 1.1** — solid tumor response (unidimensional)
- **mRECIST** — HCC enhancing tumor response
- **RAPNO** — pediatric neuro-oncology response (HGG/LGG/DIPG/Medulloblastoma)
- **Deauville** — PET/CT lymphoma response
- **Lugano** — lymphoma staging (I-IV, Hodgkin/NHL)
- **MIBG Score** — Curie/SIOPEN neuroblastoma scoring
- **IDRF** — neuroblastoma image-defined risk factors
- **PRETEXT** — pediatric hepatoblastoma staging (CDE: RDES358)

### Trauma
- **AAST Liver** — 2018 liver injury grading with vascular criteria
- **AAST Spleen** — 2018 spleen injury grading with vascular criteria
- **AAST Kidney** — 2018 kidney injury grading with vascular criteria
- **AAST Pancreas** — 2018 pancreas injury grading with ductal criteria
- **ASPECTS** — MCA territory stroke CT scoring
- **SAH Grading** — Hunt-Hess + Modified Fisher scales

### Body Imaging
- **Adrenal Washout** — absolute and relative washout percentages
- **Bosniak v2019** — cystic renal mass classification
- **Fleischner 2017** — incidental pulmonary nodule management
- **Balthazar / CTSI** — pancreatitis CT severity index
- **NASCET** — carotid stenosis percentage

### Cardiac
- **CAD-RADS** — coronary CTA (see RADS above)
- **Agatston Score** — coronary calcium risk stratification

### MSK / Pediatric
- **Scoliosis** — Cobb angle, multi-curve, Risser, skeletal maturity
- **Kyphosis / Lordosis** — thoracic/lumbar Cobb angles, Scheuermann
- **Reimers' Index** — proximal femoral migration percentage
- **Leg Length** — lower extremity discrepancy (total/segmental modes)
- **Salter-Harris** — pediatric physeal fracture classification (I-V)
- **Kellgren-Lawrence** — osteoarthritis grading (0-4)
- **Hip Dysplasia** — Graf (US) / AAOS classification
- **Bone Age (G&P)** — Greulich & Pyle atlas comparison
- **Bone Age (Sontag)** — ossification center count method
- **Pectus Excavatum** — PI, CI, DI, mCCI, Sternal Torsion Angle

### Pediatric GU / Neuro
- **Hydronephrosis** — UTD (postnatal/antenatal) / SFU grading
- **VUR (VCUG)** — vesicoureteral reflux Grades I-V
- **VUR (Nuclear)** — radionuclide cystography (mild/moderate/severe)
- **GMH Grading** — germinal matrix hemorrhage (Papile I-IV)

## Tool Types
- **Point-based** (TI-RADS): scored sections with option card grids, `renderToolForm()`, `calculateScore()`
- **Decision-tree** (LI-RADS, Bosniak, Fleischner): step-by-step wizard, custom DOM, custom calculator
- **Measurement** (Reimers, NASCET, Leg Length, Pectus): numeric inputs → computed values
- **Category select** (AAST, Salter-Harris, BI-RADS, KL): pick findings → auto-grade
- **Response assessment** (RECIST, mRECIST, RAPNO): measurement table → % change → response category

### Shared AAST Pattern
AAST liver, spleen, kidney, and pancreas all share `calculator.js` and `templates.js` from `aast-liver/`. Each organ only needs its own `definition.js` with organ-specific findings.

## User Preferences
Synced to Firestore via `storage.js` PREF_KEYS:
- `defaultTemplate` — PS360 / PS1 / RadAI (applies to all tools via report-output)
- `defaultUnit` — mm / cm (global fallback; tools override with `sizeUnit:{toolId}`)
- `compact` — TI-RADS compact mode
- `mode:curie` — Curie / SIOPEN
- `mode:leglength` — Total / Segmental
- `mode:hydronephrosis` — UTD Postnatal / UTD Antenatal / SFU
- `mode:hip-dysplasia` — Graf / AAOS
- `favorites` — array of tool IDs (float to top of landing page)
- `hiddenTools` — array of tool IDs (hidden from landing page, recoverable in profile)

Helper: `getSizeUnit(toolId)` falls back to `defaultUnit` then 'mm'.

## Landing Page Features
- Search bar + modality/body part/specialty dropdown filters
- Favorites: star icon on each tool card, favorites float to top
- Hide: eye-slash icon hides tools (recoverable from profile page)
- "Favorites only" toggle button in filter bar
- All favorites/hidden state syncs to Firestore

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

## Testing
- Vitest for unit tests, co-located with source (`*.test.js`)
- Calculator tests cover: engine.js, parser.js, tirads, nascet, bosniak, reimers, aast-liver
- Run `npm run test:run` before committing

## Analytics
- `trackEvent('tool:{toolId}:opens')` fires on every tool page load
- `trackEvent('tool:{toolId}:reports')` fires on report copy
- All counters are aggregate-only (no PII) in `analytics_aggregate` Firestore collection

## Adding a New Tool
See `docs/newtool.md` for the complete checklist.

## Watch Out For
- Pill editor creates editorContent on first edit — reset clears it
- Hyphenated section IDs need camelCase mapping for template variables (e.g., `echogenic-foci` → `echogenicFoci`)
- Multi-nodule editorContent: split at IMPRESSION boundary, render findings per nodule
- AbortController on pill editor prevents event listener leaks
- Firebase config is in `.env.local` (gitignored) — must be set in Cloudflare Pages env vars too
- Firestore security rules in `firestore.rules` — deploy via Firebase Console
- `removeStored()` handles both localStorage and Firestore deletion — don't use `localStorage.removeItem` directly
- Tools should use `getSizeUnit(toolId)` and `setStored()` — not raw `localStorage` calls
- AAST tools share calculator/templates from `aast-liver/` — only definition.js is per-organ
- Bone age tools share calculator from `bone-age/` — Sontag imports it
- `auth-state.js` holds shared auth state — `auth.js` and `user-data.js` both import from it (no circular dependency)
- `vite.config.js` auto-discovers HTML entries — no manual updates needed when adding tools
- Firestore sync failures show a toast via `toast.js` — analytics failures remain silent
- New tools must include `trackEvent('tool:{toolId}:opens')` in their `init()` function
- Parse rules are auto-generated from definition labels + synonym dictionary (~100 entries) in `parser.js` — most tools need no manual `parseRules`
- Hand-written `parseRules` override auto-generated on conflict — use for disease-specific terminology (30 tools have these)
- Two synonym layers: cross-tool (SYNONYMS dict in `parser.js`) and tool-specific (`parseRules` in each `definition.js`)
- Run `npm run check-synonyms {toolId}` to check coverage; add missing synonyms to `SYNONYMS` or `parseRules` as needed
