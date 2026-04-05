# RadioLogicHQ v1.0 — Project State

*Last updated: 2026-04-05*

## Current Version

**v1.0** — Deployed to Netlify. Firebase auth + Firestore.

## What's Shipped

### Core Framework
- Generic point-based scoring engine (`engine.js`)
- Decision-tree calculator pattern (LI-RADS)
- Form renderer with drag-and-drop section reorder (`renderer.js`)
- Block-based report template system with WYSIWYG editor (`report.js`)
- Text parser engine with per-tool keyword rules (`parser.js`)
- CDE mapping registry for RadElement Common Data Elements (`cde.js`)
- Copy-to-clipboard utility with fallback (`clipboard.js`)
- Smart storage layer — localStorage + Firestore sync (`storage.js`)
- Central tools registry with labels (`tools-registry.js`)

### Authentication & User Data
- Firebase Auth: email/password + Google OAuth + forgot password
- `<auth-ui>` modal component on all pages
- User profiles in Firestore
- Preferences sync (compact mode, section order, unit toggles)
- Custom template configs sync to Firestore
- Saved report history (Save + History buttons, text only, no PHI)
- Template sharing via link/code with import dialog
- Aggregate analytics (tool usage + template popularity counters, no PII)
- User profile page with account info + data summary

### Web Components
- `<report-output>` — report display with template selector, WYSIWYG block editor, copy, save, history
- `<auth-ui>` — sign in/up modal with Google OAuth and forgot password

### Tools
- **ACR TI-RADS Calculator** — Thyroid nodule risk stratification
  - 5 scoring categories: Composition, Echogenicity, Shape, Margin, Echogenic Foci
  - Multi-select support for Echogenic Foci with exclusive "None" option
  - Nodule size input with management recommendations (FNA/follow-up thresholds)
  - Location dropdown and free-text additional findings
  - 3 report templates: PowerScribe 360, PowerScribe One, RadAI Omni
  - Template customization with localStorage persistence
  - 18 schematic SVG reference diagrams

### Pages
- Landing page (`/`) — tool directory with card grid
- TI-RADS Calculator (`/src/tools/tirads/tirads.html`)

### Styling
- Dark radiology reading room theme
- CSS custom properties for all design tokens
- Responsive two-column layout (desktop) / single column (mobile)
- Inter font (Google Fonts)

## Report Output Formats

| Format | Target System | Style |
|--------|--------------|-------|
| PowerScribe 360 | Nuance PS360 | Structured, each category on its own line with point breakdowns |
| PowerScribe One | Nuance PS1 | Compact inline paragraph, dictation-style |
| RadAI Omni | RadAI | Key-value pairs with CDE-coded values |

## Known Issues

1. **No CDE set JSON bundled yet** — `src/data/cde-sets/RDES411.json` placeholder needed for offline CDE reference.
2. **SVG images are schematic** — placeholder diagrams, not actual ultrasound images. May want to source real reference images or improve diagrams.

## Infrastructure

- **Hosting**: Netlify (auto-deploy on git push to main)
- **Live URL**: radiologichq.netlify.app
- **Backend**: Firebase (Firestore + Auth) — free Spark plan
- **Auth**: Email/password + Google OAuth + forgot password
- **Database**: Firestore (profiles, preferences, templates, saved reports, analytics)
- **Repo**: `github.com/towbinaj/RadlogicHQ` (public, branch `main`)
- **Build**: Vite 8 MPA, `npm run build` → `dist/`
- **HIPAA**: No PHI in database. No individual timestamps. No IP addresses. Analytics are aggregate counters only.

## Feature Backlog

### Database / Backend
- [ ] **Label management UI** — admin interface to add/edit/remove body parts, modalities, and specialties labels
- [ ] **Tool metadata CRUD** — ability to add/edit tool registry entries without editing code
- [ ] **Hospital SSO** — SAML/OIDC via Firebase Identity Platform (paid, future)
- [ ] **Organization/team template management** — team admins set default templates
- [ ] **Admin analytics dashboard** — view aggregate usage data

### Tools to Build
- [ ] Bone Age Calculator (Greulich & Pyle) — date inputs, atlas image browser, statistical analysis
- [x] ~~LI-RADS (Liver) — CT/MR hepatocellular carcinoma assessment~~ SHIPPED
- [ ] BI-RADS (Breast) — breast imaging risk stratification
- [ ] Bosniak Classification — renal cyst characterization
- [ ] Adrenal Nodule Washout Calculator — CT attenuation measurements
- [ ] Fleischner Criteria — pulmonary nodule follow-up

### Framework Enhancements
- [ ] `<image-browser>` component — atlas-style image viewer with prev/next navigation and click-to-zoom
- [ ] `<toggle-group>` component — binary toggle buttons (Male/Female)
- [ ] `<date-input>` component — date picker with label
- [ ] Computed field support in engine — auto-calculate values from other inputs
- [ ] Landing page search/filter/sort by labels (body part, modality, specialty)
- [ ] Print stylesheet for report output
- [ ] Dark/light mode toggle (currently dark-only)
- [ ] Custom domain (radiologichq.com)

### Polish
- [ ] Keyboard accessibility (arrow keys to navigate options, Enter to select)
- [ ] ARIA labels on all interactive elements
- [ ] Favicon and PWA manifest
- [ ] SEO meta tags and Open Graph for tool pages
- [ ] 404 page
