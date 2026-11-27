# RadioLogicHQ v1.2 — Project State

*Last updated: 2026-11-27*

## Current Version

**v1.2** — Live at radiologichq.com. 48 active tools. Firebase auth + Firestore. Cloudflare Pages auto-deploy.

## What's Shipped

### Core Framework
- Generic point-based scoring engine (`engine.js`)
- Decision-tree calculator pattern for non-scored tools (`calculator.js`)
- Form renderer with drag-and-drop section reorder (`renderer.js`)
- Pill-based WYSIWYG report editor with inline colored tokens (`pill-editor.js`)
- Template engine with `{{variable}}` and `{{#if}}` conditionals (`report.js`)
- Text parser engine with per-tool keyword rules (`parser.js`)
- Copy-to-clipboard utility with fallback (`clipboard.js`)
- Smart storage layer — localStorage + background Firestore sync, toast on failure (`storage.js`)
- Toast notification utility for sync errors (`toast.js`)
- Auth state extracted to `auth-state.js` (eliminates circular import between auth.js ↔ user-data.js)
- `getSizeUnit(toolId)` helper — falls back to global `defaultUnit` preference
- Central tools registry with body part/modality/specialty labels (`tools-registry.js`)
- mm/cm unit toggle on size inputs (persists per-tool and global preference)

### Authentication & User Data
- Firebase Auth: email/password + Google OAuth + forgot password
- `<auth-ui>` modal component on all pages (AcademiQR-inspired design)
- Signup consent checkbox (Privacy Policy agreement required)
- User profiles in Firestore
- Preferences sync to Firestore when logged in
- Custom template configs (pill editor layout) sync to Firestore
- Saved report history (Save + History buttons, text only, no PHI)
- Template sharing via link/code with import dialog
- Aggregate analytics (tool opens + report copies + template popularity counters, no PII)
- User profile page: account info, data summary, editable preferences
- Data export (JSON download of all user data)
- Account deletion (cascades all Firestore data + Firebase Auth account)

### User Preferences (synced to Firestore)
- Default report template (PS360 / PS1 / RadAI) — applies across all tools
- Default measurement unit (mm / cm) — global fallback with per-tool override
- Compact mode (TI-RADS images)
- MIBG scoring system (Curie / SIOPEN)
- Leg length mode (Total / Segmental)
- Hydronephrosis classification (UTD Postnatal / UTD Antenatal / SFU)
- Hip dysplasia method (Graf / AAOS)
- Tool favorites (array of tool IDs)
- Hidden tools (array of tool IDs)

### Landing Page
- Tool directory with search bar and dropdown filters (modality, body part, specialty)
- Favorites: star icon on each card, favorites float to top of grid
- Hide: eye-slash icon hides tools from landing page
- "Favorites only" toggle button in filter bar
- All favorites/hidden state persists via localStorage + Firestore sync
- Profile page shows hidden tools with unhide buttons

### Pill Editor
- contentEditable div with non-editable inline pill spans
- Blue pills = findings, gold = scores, green = metadata
- Free text typed around pills for labels and custom text
- Palette panel: drag pills from palette into report at cursor position
- Pill popover (pencil icon): edit display aliases per value, toggle, remove
- Custom options: add new values to existing fields
- Custom fields: create entirely new pill types
- Multi-nodule: splits editorContent at IMPRESSION boundary
- Backward compatible: falls back to block-based rendering

### Web Components
- `<report-output>` — pill-based editor, copy, save, history, share, template selector (reads defaultTemplate pref)
- `<auth-ui>` — sign in/up/forgot-password modal with Google OAuth and consent

### Testing
- Vitest unit tests co-located with source (`*.test.js`)
- Calculator tests for every tool, plus engine, parser, report rendering and clipboard (1235 tests + 8 todo, 52 files)
- `npm run test:run` for CI, `npm run test` for watch mode

### Build
- Vite config auto-discovers HTML entries from `src/tools/*/` and `src/pages/` (no manual updates)

### Analytics
- All 48 tools track page opens via `trackEvent('tool:{toolId}:opens')` in `init()`
- Report copy tracking via `trackEvent('tool:{toolId}:reports')`
- Template usage tracking via `trackEvent('template:{templateId}:uses')`

### Parser (paste-to-autofill)
- `buildParseRules(definition)` auto-generates rules from definition labels (sections, inputs, categories, grades, scores, named option groups, sideOptions/lateralityOptions/modalityOptions)
- Synonym dictionary in `parser.js` expands labels with common radiology variants (~123 entries: echogenicity, laterality, severity, grades, stages, types, morphology, enhancement, vascular, MSK, fetal, PET/CT, etc.)
- Hand-written `parseRules` in definition.js override auto-generated on conflict (shallow merge — hand-written wins per-field)
- ~36 tools have hand-written parseRules for disease-specific terminology (RADS category keywords, AAST findings, response criteria, annotation factors, anatomic regions, HU contrast phases, bidimensional measurements, etc.)
- All tools get baseline parsing automatically from their definition structure
- `npm run check-synonyms {toolId}` reports synonym coverage and hand-written rule counts per tool
- **Phase 2 segmentation rollout complete** — 18 tools opt in to `parseSegmentation` via the laterality (8 tools: aast-kidney, vur, vur-nm, reimers, hydronephrosis, hip-dysplasia, kellgren-lawrence, fetal-ventricle) or itemIndex (10 tools: tirads, lirads, lungrads, fleischner, bosniak, pirads, orads, recist, mrecist, rapno) segmenters. Bilateral state refactor pattern established for paired-organ tools (per-side formState keys + `buildXCard` helper + calculator bilateral branch + `{{#if}}`/`{{#unless}}` template conditionals). Laterality segmenter extended with MSK joint anchors (knee/shoulder/elbow/wrist/ankle/hand/foot/joint/ventricle) and optional modifier-word regex (`right lateral ventricle`, `right upper lobe lung`). Full reference in `docs/parser.md`.

### Tools (48 active)

**RADS Systems (8)**
- TI-RADS, LI-RADS, PI-RADS, O-RADS, Lung-RADS, BI-RADS, CAD-RADS, NI-RADS

**Oncologic (8)**
- RECIST 1.1, mRECIST, RAPNO (4 variants), Deauville, Lugano, MIBG Score, IDRF, PRETEXT

**Trauma / Emergency (7)**
- AAST Liver, AAST Spleen, AAST Kidney, AAST Pancreas, AAST Multi-Trauma, ASPECTS, SAH Grading

**Body Imaging (5)**
- Adrenal Washout, Bosniak v2019, Fleischner 2017, Balthazar/CTSI, NASCET

**Cardiac (2)**
- CAD-RADS (counted above in RADS), Agatston Score

**MSK / Pediatric Orthopedic (10)**
- Scoliosis, Kyphosis/Lordosis, Reimers' Index, Leg Length, Salter-Harris, Kellgren-Lawrence, Hip Dysplasia, Bone Age (G&P), Bone Age (Sontag), Pectus Excavatum

**Pediatric GU / Neuro (4)**
- Hydronephrosis (UTD/SFU), VUR (VCUG), VUR (Nuclear), GMH Grading

**Fetal Imaging (5)**
- Fetal Brain Biometry, Fetal Corpus Callosum, Fetal Lung Volume, Fetal Posterior Fossa, Fetal Ventricle Width

### Shared Code Patterns
- AAST tools (4 organs) share `calculator.js` + `templates.js` from `aast-liver/`. The calculator supports `subgrade`/`subgradeOrder`, `escalations` and `advanceMultipleInjuries: false` (used by pancreas 2024 and kidney 2025)
- AAST kidney 2018/2025 selection lives in `src/tools/aast-kidney/scales.js` (stored key `mode:aast-kidney`)
- Bone age tools (G&P + Sontag) share `calculator.js` from `bone-age/`
- All measurement tools use `getSizeUnit()` from `storage.js`

### Compliance (HIPAA + GDPR)
- No PHI stored. PHI disclaimer on all report outputs
- Self-hosted Google Fonts (no third-party IP transfer)
- Privacy Policy page
- Signup consent checkbox
- Account deletion + data export (GDPR Articles 17 & 20)
- Aggregate-only analytics (no user tracking, no timestamps)
- Firestore encryption at rest + HTTPS in transit
- See `docs/compliance.md` for full details

### Pages
- Landing page (`/`) — tool directory with search, filters, favorites, hide
- 48 tool pages (see Tools list above)
- 404 page (`/404.html`) — suggests the tool matching the bad URL + live tool search
- Profile (`/src/pages/profile.html`) — account, preferences, hidden tools, data management
- Privacy Policy (`/src/pages/privacy.html`)

### Styling
- Dark radiology reading room theme (CSS custom properties)
- Self-hosted Inter font
- Responsive two-column layout (mobile: single column)
- Shared styles in `forms.css` (report output, auth modal, pills, palette)

## Known Issues

1. **SVG images are schematic** — placeholder diagrams, not actual ultrasound images

## Infrastructure

- **Hosting**: Cloudflare Pages (auto-deploy on git push to main)
- **Live URL**: radiologichq.com
- **Backend**: Firebase (Firestore + Auth) — free Spark plan
- **Auth**: Email/password + Google OAuth + forgot password
- **Database**: Firestore (profiles, preferences, templates, saved reports, analytics)
- **Repo**: `github.com/towbinaj/RadlogicHQ` (public, branch `main`)
- **Build**: Vite 8 MPA (auto-discovers entries), `npm run build` → `dist/`
- **Test**: Vitest, `npm run test:run`
- **HIPAA**: No PHI stored. Aggregate analytics only.
- **GDPR**: Self-hosted fonts. Privacy policy. Account deletion. Data export. Consent.

## Feature Backlog

### Framework Enhancements
- [x] Custom domain (radiologichq.com)
- [x] Favicon
- [ ] PWA manifest
- [ ] Dark/light mode toggle
- [ ] Print stylesheet for report output
- [ ] `<image-browser>` component for atlas-style tools

### Backend / Admin
- [ ] Admin analytics dashboard
- [ ] Label management UI
- [ ] Tool metadata CRUD without code edits
- [ ] Hospital SSO (SAML via Firebase Identity Platform)
- [ ] Organization/team template management
- [ ] Google Cloud BAA for HIPAA safety net

### Polish
- [ ] Keyboard accessibility (arrow keys, Enter to select)
- [ ] ARIA labels on all interactive elements
- [x] SEO meta tags and Open Graph (canonical + og:* + twitter:*, commit 99d1104)
- [x] 404 page

## Post-Launch Checklist (radiologichq.com)

Immediate follow-ups now that the custom domain is live:

- [x] **`GITHUB_TOKEN` added to Cloudflare Pages env vars (Secret)** —
  feedback widget verified end-to-end via issue #3 (title prefix, labels,
  metadata, honeypot, rate limit, PII-free IP hashing all working).
- [ ] **Submit sitemap to Google Search Console** — property for
  `radiologichq.com`, then Sitemaps → enter `sitemap.xml`.
- [x] **Verified OG / Twitter card previews**.
- [x] **`www.radiologichq.com` → `radiologichq.com` redirect** confirmed working.
- [ ] **Enable Page Shield** (Cloudflare → Security → Page Shield) for
  script supply-chain monitoring.
- [ ] **Set up Email Routing for `feedback@radiologichq.com`** → forward to
  `radiologichq@gmail.com`, as a backup channel if the widget errors.
  Then update the feedback-widget error message to reference the domain
  email instead of the Gmail one.

## Clinical Content Review (2026-11-27)

Guideline-currency audit against published versions. Done on this pass:
- [x] TI-RADS: no level / FNA advice until composition, echogenicity, shape and margin are chosen (spongiform alone is sufficient)
- [x] Reimers: impression no longer asserts coxa valga by default
- [x] AAST Pancreas citation corrected to Moore 1990 (Kozar 2018 never covered pancreas)
- [x] O-RADS citation updated to US v2022 paper (Strachowski, Radiology 2023)

Pending — need radiologist sign-off on grade tables before shipping:
- [x] **AAST Pancreas 2024** (Notrica et al., J Trauma Acute Care Surg 2025;98(3):442-447) — implemented from Table 1 with subgrades (I-A..V-D); replaces 1990 scale. Signed off 2026-11-27: most severe subgrade wins; no multiple-injury advancement.
- [x] **AAST Kidney 2025** (Keihani et al., J Trauma Acute Care Surg 2025;98(3):448-451) — implemented from Table 1 imaging criteria with a 2018/2025 toggle (default 2025, shared with AAST Multi). Signed off 2026-11-27: default 2025; size-less perinephric hematoma parses as HRD <3.5 cm.
- [x] **Parser negation** — multi-select parsing now skips negated mentions ("no urinary extravasation", "without active bleeding", "not seen"); see `docs/parser.md` section 3.
- [x] **BI-RADS v2025** (ACR BI-RADS v2025 Manual; Minichetti et al., AJR 2026) — category 0 split (additional imaging vs prior examinations), category 6 per multidisciplinary team, CEM modality, optional clinical indication, ASCII report text. Lexicon/density changes do not apply (tool is category-level). Signed off 2026-11-27: paraphrased category 0 and 6 wording accepted.
- [ ] **NI-RADS MRI** (Bunch et al., JACR 2025) — add MRI pathway or label tool CT/PET-CT only
- [x] **ASPECTS** — blank by default; 10/10 only after marking regions or confirming "No early ischemic changes" (button or pasted text)
- [ ] Watch: O-RADS MRI update (expected 2026), Lugano revision (ICML 2025 workshop)

Current as of the audit (no newer version found): TI-RADS 2017, LI-RADS v2018 diagnostic, PI-RADS v2.1, Lung-RADS v2022, CAD-RADS 2.0, Bosniak v2019, Fleischner 2017, RECIST 1.1, mRECIST, AAST liver/spleen 2018, UTD 2014, IDRF 2009, adrenal washout thresholds.

## Full Tool Audit (2026-11-27)

Seven parallel audits exercised every option of all 48 tools against their
cited sources (calculator logic, thresholds, report text in all templates,
browser, parse). Critical findings fixed (tests first, one commit per area):
- AAST 2018: liver pseudoaneurysm/contained bleeding -> III; kidney contained
  Gerota bleeding -> III, thrombosis/infarction -> IV, <=1 cm laceration -> II;
  multiple injuries advance ONE grade up to III; paste crash on liver/spleen/
  pancreas/Multi.
- RECIST/mRECIST: PD checked before PR; CR + non-target not evaluated = PR
  ('None at baseline' option); reappearance after nadir 0 = PD; partial nadir.
- RAPNO: clinical worsening = PD, increased steroids cap at SD, steroid parse.
- PRETEXT: group computed from contiguous free sections (2 table errors).
- Lung-RADS: v2022 new/growing table; part-solid missing solid size = incomplete.
- LI-RADS: 10-19 mm APHE + washout/growth = LR-5; no <10 mm no-APHE row;
  fat in mass favors HCC; non-v2018 'homogeneous signal' removed.
- PI-RADS: TZ T2 2 + DWI >=4 -> 3. TI-RADS: spongiform totals 0 (TR1).
- O-RADS: ascites -> 5; classic lesions >=10 cm -> 3; solid smooth CS mapping;
  cystic lesions by morphology/size.
- Bosniak: few (1-3) septa II, many (>=4) IIF; calcification excludes I.
- Adrenal non-enhancing lesions; Agatston decimal gaps; kyphosis
  hypokyphosis; hip IIa- description; bone-age method label; hydronephrosis
  bilateral severity + P2/P3 text; GMH empty impression; ventricle 12.0 mm.
- Parser: single-select negation; whole-word short keywords; generic option
  labels qualified by field label.

Clinical decisions signed off and implemented: Agatston -> CAC-DRS 2018;
Deauville -> Lugano 2014 response with uptake-vs-baseline and timing; fetal
posterior fossa -> Cignini 2016 centiles (20-35 wk).

Bone age (G&P and Sontag) -> Greulich and Pyle Brush Foundation SD by
age/sex, normal = CA +/- 2 SD (table from the atlas supplied by the user;
src/tools/bone-age/brush.js). Still open: pectus Haller index labelling.

Pending (major, not yet fixed): placeholder/premature impressions on empty
forms across many tools; O-RADS menopausal status / solid components; Lung-
RADS stable/slow-growth, cat 0/1, airway, cysts, S modifier, exam category;
CAD-RADS 2.0 modifiers; Bosniak enhancement requirement + MRI criteria;
Fleischner rounding + negated risk factors; RECIST node short-axis rule;
Lugano E/A-B rules; IDRF/PRETEXT/Curie parse key mismatches; kidney
laterality parse; BI-RADS CEM button overlap; NI-RADS management.

## Repo Housekeeping

- [x] Stale `claude/ti-rads-*` branches — confirmed gone from origin (2026-11-27).
- `@grpc/grpc-js` is pinned via `overrides` in `package.json` to clear Firestore's Node-only transport advisories (firebase 12 and 13 both pin ~1.9). Revisit when Firebase bumps it.
