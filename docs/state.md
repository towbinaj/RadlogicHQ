# RadioLogicHQ v1.2 — Project State

*Last updated: 2026-04-15*

## Current Version

**v1.2** — Live at radiologichq.com. 42 active tools. Firebase auth + Firestore. Cloudflare Pages auto-deploy.

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
- Tests for: engine.js, parser.js, tirads, nascet, bosniak, reimers, aast-liver calculators (93 tests)
- `npm run test:run` for CI, `npm run test` for watch mode

### Build
- Vite config auto-discovers HTML entries from `src/tools/*/` and `src/pages/` (no manual updates)

### Analytics
- All 47 tools track page opens via `trackEvent('tool:{toolId}:opens')` in `init()`
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

### Tools (42 active)

**RADS Systems (8)**
- TI-RADS, LI-RADS, PI-RADS, O-RADS, Lung-RADS, BI-RADS, CAD-RADS, NI-RADS

**Oncologic (8)**
- RECIST 1.1, mRECIST, RAPNO (4 variants), Deauville, Lugano, MIBG Score, IDRF, PRETEXT

**Trauma / Emergency (6)**
- AAST Liver, AAST Spleen, AAST Kidney, AAST Pancreas, ASPECTS, SAH Grading

**Body Imaging (5)**
- Adrenal Washout, Bosniak v2019, Fleischner 2017, Balthazar/CTSI, NASCET

**Cardiac (2)**
- CAD-RADS (counted above in RADS), Agatston Score

**MSK / Pediatric Orthopedic (10)**
- Scoliosis, Kyphosis/Lordosis, Reimers' Index, Leg Length, Salter-Harris, Kellgren-Lawrence, Hip Dysplasia, Bone Age (G&P), Bone Age (Sontag), Pectus Excavatum

**Pediatric GU / Neuro (4)**
- Hydronephrosis (UTD/SFU), VUR (VCUG), VUR (Nuclear), GMH Grading

### Shared Code Patterns
- AAST tools (4 organs) share `calculator.js` + `templates.js` from `aast-liver/`
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
- 42 tool pages (see Tools list above)
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
- [ ] Custom domain (radiologichq.com)
- [ ] Favicon + PWA manifest
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
- [ ] 404 page

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

## Repo Housekeeping

Stale feature branches on origin that are fully merged into `main`.
Cosmetic clutter, not functional problems — clean up whenever convenient.

- [ ] **Delete `claude/ti-rads-coverage-batch-1-TdEkz`** — the branch
  that landed the retroactive test-coverage backlog (batches 1-6, 769 new
  calculator tests: baseline 165 → 934 passing + 8 todo), the
  `fix(rapno)` CR bug fix, and the `refactor(bone-age)` Sontag split.
  Fully merged via `561ea6b Merge branch ...`. Local delete succeeded;
  `git push origin --delete` from the Claude Code session returned
  HTTP 403 (likely branch protection or session proxy permission — the
  GitHub MCP toolset does not expose branch deletion either). Easiest
  cleanup: delete via the GitHub UI at
  `https://github.com/towbinaj/RadlogicHQ/branches`, or retry
  `git push origin --delete claude/ti-rads-coverage-batch-1-TdEkz`
  from a local terminal where credentials may differ.
- [ ] **Delete `claude/ti-rads-test-coverage-batch-1-xxEV9`** — a parallel
  branch from a different session pinned at `909be77 chore(hooks):
  enforce test:run + build before every git commit`, which is commit
  #47 in current main's history. Investigated 2026-04-15: zero unique
  commits (pure ancestor of main, fully contained in the merge). Local
  delete succeeded; remote delete hit the same HTTP 403 as the other
  branch. Clean up via the GitHub UI or a local terminal alongside
  `claude/ti-rads-coverage-batch-1-TdEkz`.
