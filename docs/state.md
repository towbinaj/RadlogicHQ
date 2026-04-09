# RadioLogicHQ v1.1 — Project State

*Last updated: 2026-04-05*

## Current Version

**v1.1** — Live at radlogichq.pages.dev. Firebase auth + Firestore. Cloudflare Pages auto-deploy.

## What's Shipped

### Core Framework
- Generic point-based scoring engine (`engine.js`)
- Decision-tree calculator pattern for non-scored tools (`calculator.js`)
- Form renderer with drag-and-drop section reorder (`renderer.js`)
- Pill-based WYSIWYG report editor with inline colored tokens (`pill-editor.js`)
- Template engine with `{{variable}}` and `{{#if}}` conditionals (`report.js`)
- Text parser engine with per-tool keyword rules (`parser.js`)
- CDE mapping registry for RadElement Common Data Elements (`cde.js`)
- Copy-to-clipboard utility with fallback (`clipboard.js`)
- Smart storage layer — localStorage + background Firestore sync (`storage.js`)
- Central tools registry with body part/modality/specialty labels (`tools-registry.js`)
- mm/cm unit toggle on size inputs (persists preference)

### Authentication & User Data
- Firebase Auth: email/password + Google OAuth + forgot password
- `<auth-ui>` modal component on all pages (AcademiQR-inspired design)
- Signup consent checkbox (Privacy Policy agreement required)
- User profiles in Firestore
- Preferences sync to Firestore when logged in
- Custom template configs (pill editor layout) sync to Firestore
- Saved report history (Save + History buttons, text only, no PHI)
- Template sharing via link/code with import dialog
- Aggregate analytics (tool usage + template popularity counters, no PII)
- User profile page: account info, data summary, editable preferences
- Data export (JSON download of all user data)
- Account deletion (cascades all Firestore data + Firebase Auth account)

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
- `<report-output>` — pill-based editor, copy, save, history, share, template selector
- `<auth-ui>` — sign in/up/forgot-password modal with Google OAuth and consent

### Tools
- **TI-RADS** — Thyroid nodule risk stratification (CDE: RDES152)
  - 5 scoring categories with option card grids + SVG diagrams
  - Multi-nodule tabs (add, remove, rename, independent scoring)
  - Draggable section reorder (syncs with report block order)
  - Compact mode (hide images)
  - Parse findings from pasted text
  - 3 report templates: PowerScribe 360, PowerScribe One, RadAI Omni

- **LI-RADS v2018** — Liver HCC categorization (CDE: RDES5)
  - Decision-tree UI: benign assessment → major features → ancillary
  - Multi-observation tabs
  - Couinaud segment + size + series/image number inputs
  - Ancillary features as compact toggleable card grid
  - All features have hover tooltips from ACR LI-RADS Lexicon
  - 3 report templates

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
- Landing page (`/`) — tool directory with color-coded labels, rendered from registry
- TI-RADS (`/src/tools/tirads/tirads.html`)
- LI-RADS (`/src/tools/lirads/lirads.html`)
- Profile (`/src/pages/profile.html`) — account, preferences, data management
- Privacy Policy (`/src/pages/privacy.html`)

### Styling
- Dark radiology reading room theme (CSS custom properties)
- Self-hosted Inter font
- Responsive two-column layout (mobile: single column)
- Shared styles in `forms.css` (report output, auth modal, pills, palette)

## Known Issues

1. **SVG images are schematic** — placeholder diagrams, not actual ultrasound images
2. **Circular import chain** (auth.js ↔ user-data.js) — works via ES module live bindings but is fragile

## Infrastructure

- **Hosting**: Cloudflare Pages (auto-deploy on git push to main)
- **Live URL**: radlogichq.pages.dev
- **Backend**: Firebase (Firestore + Auth) — free Spark plan
- **Auth**: Email/password + Google OAuth + forgot password
- **Database**: Firestore (profiles, preferences, templates, saved reports, analytics)
- **Repo**: `github.com/towbinaj/RadlogicHQ` (public, branch `main`)
- **Build**: Vite 8 MPA, `npm run build` → `dist/`
- **HIPAA**: No PHI stored. Aggregate analytics only.
- **GDPR**: Self-hosted fonts. Privacy policy. Account deletion. Data export. Consent.

## Feature Backlog

### Tools to Build
- [ ] Bone Age Calculator (Greulich & Pyle)
- [ ] BI-RADS (Breast)
- [ ] Bosniak Classification (Renal cyst)
- [ ] Adrenal Nodule Washout Calculator
- [ ] Fleischner Criteria (Pulmonary nodule)

### Framework Enhancements
- [ ] Landing page search/filter/sort by labels
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
- [ ] SEO meta tags and Open Graph
- [ ] 404 page
