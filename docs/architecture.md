# RadlogicHQ v1.0 — Architecture

## Overview

RadlogicHQ is a collection of radiology calculators and tools that output structured reports for copy/paste into radiology reporting systems (PowerScribe 360, PowerScribe One, RadAI Omni). Reports map to RSNA Common Data Elements (CDEs) from radelement.org. Built as a vanilla JS multi-page app with no backend — all logic runs client-side.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla ES6+ modules, Web Components, HTML5, CSS3 |
| Build | Vite 8 (MPA mode — one HTML entry per tool) |
| Backend | None — pure static site |
| Fonts | Inter (Google Fonts) |
| Data | RadElement CDE sets (bundled JSON) |
| Standards | RSNA ACR-RSNA CDEs, RADLEX, SNOMED CT |

## Project Structure

```
RadlogicHQ/
├── src/
│   ├── core/                          # Shared framework (all tools use this)
│   │   ├── engine.js                  # Generic score calculation (point summing)
│   │   ├── renderer.js                # Builds form DOM from tool definitions
│   │   ├── report.js                  # Template engine ({{variable}}, {{#if}})
│   │   ├── cde.js                     # CDE mapping registry + bundled data loader
│   │   ├── clipboard.js               # Copy-to-clipboard with fallback
│   │   └── storage.js                 # localStorage wrapper for template persistence
│   ├── components/                    # Reusable Web Components
│   │   └── report-output.js           # <report-output> — text area + copy + template selector + editor
│   ├── tools/                         # One directory per calculator tool
│   │   └── tirads/
│   │       ├── tirads.html            # MPA entry point
│   │       ├── tirads.js              # Page controller
│   │       ├── tirads.css             # Tool-specific styles
│   │       ├── definition.js          # Declarative config (categories, options, points)
│   │       ├── calculator.js          # TI-RADS scoring + management logic
│   │       └── templates.js           # Default report templates (PS360, PS1, RadAI)
│   ├── styles/
│   │   ├── variables.css              # CSS custom properties (dark theme)
│   │   ├── base.css                   # Global resets, typography, layout
│   │   └── forms.css                  # Form control styles
│   └── data/
│       └── cde-sets/                  # Bundled CDE set JSON files
│           └── RDES411.json           # Thyroid nodule CDE set (placeholder)
├── public/
│   └── images/
│       └── tirads/                    # 18 schematic SVG diagrams
├── docs/
│   ├── architecture.md                # This file
│   └── state.md                       # Project state and feature tracking
├── index.html                         # Landing page — tool directory
├── package.json
├── vite.config.js                     # MPA entry points
└── CLAUDE.md                          # AI dev instructions
```

## Tool Architecture

### Definition-Driven Design

Each tool follows a 3-file pattern that separates concerns:

```
definition.js ──→ What inputs to render (declarative config)
calculator.js ──→ How to compute results (pure functions)
templates.js  ──→ How to format output (template strings)
```

The core framework handles the wiring:

```
definition.js → renderer.js → DOM form
                                 ↓ (user clicks/types)
                              formState
                                 ↓
engine.js (generic score) + calculator.js (tool-specific logic)
                                 ↓
                              calcResult
                                 ↓
report.js + templates.js → <report-output> component
```

### Tool Definition Schema

```javascript
{
  id: 'tirads',                    // URL-safe identifier
  name: 'ACR TI-RADS Calculator',
  version: '1.0.0',
  description: '...',
  cdeSetId: 'RDES411',            // Links to RadElement CDE set

  sections: [                      // Scored categories
    {
      id: 'composition',
      label: 'Composition',
      description: 'Internal content of the nodule',
      inputType: 'single-select',  // or 'multi-select'
      options: [
        { id: 'cystic', label: '...', points: 0, image: 'composition-cystic.svg' },
        { id: 'solid',  label: '...', points: 2, image: 'composition-solid.svg' },
      ]
    },
    // ...more sections
  ],

  additionalInputs: [             // Non-scored inputs
    { id: 'nodule-size', label: 'Maximum Dimension', inputType: 'float', unit: 'cm' },
    { id: 'nodule-location', label: 'Location', inputType: 'single-select', options: [...] },
    { id: 'additional-findings', label: 'Additional Findings', inputType: 'text' },
  ]
}
```

### Input Type Rendering

| inputType | Renders As | Form State Value |
|-----------|-----------|-----------------|
| `single-select` (section) | Clickable image cards (radio) | `string` (option ID) |
| `multi-select` (section) | Clickable image cards (checkbox) | `string[]` (option IDs) |
| `float` / `integer` | Number input with unit label | `number \| null` |
| `text` | Textarea | `string` |
| `single-select` (additional) | Dropdown `<select>` | `string \| null` |

### Calculation Engine

Two layers:

1. **Generic engine** (`engine.js`): `calculateScore(definition, formState)` — iterates sections, sums points per-section and total. Works for any point-based scoring tool.

2. **Tool-specific calculator** (e.g., `calculator.js`): Takes the total score and additional inputs, returns domain-specific results (risk levels, management recommendations).

### Report Template System

**Syntax:**
- `{{variable}}` — substituted with value from template data
- `{{#if key}}...{{/if}}` — included only if key is truthy
- `{{#unless key}}...{{/unless}}` — included only if key is falsy

**Template Flow:**
1. `buildTemplateData()` transforms form state + calc result into flat key-value object
2. `renderReport(templateStr, data)` performs substitution
3. Result displayed in `<report-output>` component

**Customization:**
- Users switch between PS360/PS1/RadAI via dropdown
- "Edit" button opens template editor with live preview
- Custom templates saved to localStorage (`radtools:templates:{toolId}:{templateId}`)
- "Reset to Default" restores shipped template

### CDE Mapping

Each tool's definition links inputs to RadElement CDE element IDs:
- Section `cdeElementId` → maps to an RDE element
- The CDE registry (`cde.js`) stores mappings and resolves coded values
- RadAI Omni template uses CDE-coded values for machine-readable output
- CDE sets bundled in `src/data/cde-sets/` for offline access

**RadElement API** (reference, not used at runtime):
- Base URL: `https://api3.rsna.org/radelement/v1/`
- Sets: `GET /sets/{id}` — full CDE set with elements
- Elements: `GET /elements/{id}` — element definition
- Coding systems: RADLEX, SNOMEDCT, LOINC, DICOM

## Page Architecture

Each tool is a standalone Vite MPA entry point:

```
Landing (index.html) ──── main.js ──── base styles, landing page layout
TI-RADS ──────────────── tirads.js ── engine, renderer, report, calculator, templates, report-output
[Future tools] ────────── {tool}.js ── engine, renderer, report, calculator, templates, report-output
```

## Component Architecture

### `<report-output>` Web Component

The primary reusable component. Manages:
- Template selection (dropdown)
- Report text display (pre-formatted)
- Copy-to-clipboard (with toast notification)
- Template editing (textarea + live preview)
- Template persistence (localStorage)
- Reset to defaults

**API:**
```javascript
const el = document.querySelector('report-output');
el.toolId = 'tirads';
el.renderFn = renderReport;       // Template engine function
el.setTemplates(tiradsTemplates);  // { ps360: { label, template }, ... }
el.updateReport(templateData);     // Flat key-value object
```

## Styling Architecture

- **Dark theme by default** — designed for radiology reading room environment
- **CSS custom properties** in `variables.css` — all colors, spacing, typography
- **No framework CSS** — vanilla CSS with BEM-ish naming (.block__element--modifier)
- **Responsive** — two-column desktop (form left, report right), single-column mobile

### Color System
- Background layers: `--bg-primary` (darkest) → `--bg-elevated` (lightest)
- Text: `--text-primary` (white-ish) → `--text-muted` (dim gray)
- Accent: `--accent` (blue) for interactive elements, selections, borders
- Status: `--success`, `--warning`, `--danger` for TI-RADS level colors

## Security

- No backend, no authentication, no user data storage (beyond localStorage templates)
- No external API calls at runtime
- Input sanitization not needed (no database, no server-side rendering)
- CSP not needed (no dynamic script loading, CDN fonts only)
