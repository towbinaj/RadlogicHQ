# RadlogicHQ v1.0 — Project State

*Last updated: 2026-04-04*

## Current Version

**v1.0** — Initial build, not yet deployed.

## What's Shipped

### Core Framework
- Generic point-based scoring engine (`engine.js`)
- Form renderer that builds DOM from declarative tool definitions (`renderer.js`)
- Template engine with `{{variable}}` and `{{#if}}` conditional support (`report.js`)
- CDE mapping registry for RadElement Common Data Elements (`cde.js`)
- Copy-to-clipboard utility with fallback (`clipboard.js`)
- localStorage wrapper for template persistence (`storage.js`)

### Web Components
- `<report-output>` — report display with template selector, copy button, template editor, reset-to-default

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

- **Hosting**: Not yet deployed
- **Backend**: None (pure static site)
- **Repo**: Not yet created
- **Build**: Vite 8 MPA, `npm run build` → `dist/`

## Feature Backlog

### Tools to Build
- [ ] Bone Age Calculator (Greulich & Pyle) — date inputs, atlas image browser, statistical analysis
- [ ] LI-RADS (Liver) — CT/MR hepatocellular carcinoma assessment
- [ ] BI-RADS (Breast) — breast imaging risk stratification
- [ ] Bosniak Classification — renal cyst characterization
- [ ] Adrenal Nodule Washout Calculator — CT attenuation measurements

### Framework Enhancements
- [ ] `<image-browser>` component — atlas-style image viewer with prev/next navigation and click-to-zoom
- [ ] `<toggle-group>` component — binary toggle buttons (Male/Female)
- [ ] `<date-input>` component — date picker with label
- [ ] Computed field support in engine — auto-calculate values from other inputs (e.g., chronologic age from DOB + study date)
- [ ] Template import/export as JSON for sharing between colleagues
- [ ] Print stylesheet for report output
- [ ] Dark/light mode toggle (currently dark-only)

### Polish
- [ ] Keyboard accessibility (arrow keys to navigate options, Enter to select)
- [ ] ARIA labels on all interactive elements
- [ ] Favicon and PWA manifest
- [ ] SEO meta tags and Open Graph for tool pages
- [ ] 404 page
