# RadlogicHQ v1.0

## Commands
npm run dev       # Vite dev server
npm run build     # Production build to dist/
npm run preview   # Preview production build

## Architecture
- Vanilla ES6+ modules, no framework — multi-page app (MPA) via Vite
- No backend — pure static site, all logic runs client-side
- CDE data bundled locally in src/data/cde-sets/
- Dark radiology reading room theme by default

## Key Directories
- `src/core/` — Shared framework (engine, renderer, report template engine, clipboard, storage, CDE mapping)
- `src/components/` — Reusable Web Components (report-output, etc.)
- `src/tools/{toolId}/` — One directory per calculator tool
- `src/styles/` — CSS custom properties in variables.css, global styles in base.css
- `src/data/cde-sets/` — Bundled RadElement CDE JSON data
- `public/images/{toolId}/` — Reference images per tool
- `docs/` — architecture.md and state.md (read these for deep context)

## Tool Structure (each tool has 6 files)
- `definition.js` — Declarative config: sections, options, point values, input types
- `calculator.js` — Pure functions: scoring logic, risk levels, management recommendations
- `templates.js` — Report templates for PowerScribe 360, PowerScribe One, RadAI Omni
- `{toolId}.html` — MPA entry point
- `{toolId}.js` — Page controller wiring definition → engine → report output
- `{toolId}.css` — Tool-specific styles

## Conventions
- Tool definitions are declarative config objects, calculation logic is pure functions
- Report templates use `{{variable}}` and `{{#if key}}...{{/if}}` syntax
- All user-facing text lives in report templates — no hardcoded report strings in JS
- CDE element IDs link tool inputs to radelement.org standards
- Use CSS custom properties from src/styles/variables.css — never hardcode colors
- Images are schematic SVG diagrams per tool in public/images/{toolId}/
- Web Components use `customElements.define()` — no Shadow DOM

## Adding a New Tool
1. Create `src/tools/{toolId}/` with the 6 files above
2. Add HTML entry to `vite.config.js` rollupOptions.input
3. Add tool card to `index.html`
4. Add reference images to `public/images/{toolId}/`
5. Optionally bundle CDE set JSON in `src/data/cde-sets/`

## Input Types Supported
- `single-select` — radio-style options with images + point values
- `multi-select` — checkbox-style (multiple selections, points summed)
- `float` / `integer` — numeric input with min/max/step/unit
- `text` — free-text entry for findings/comments
- `single-select` (dropdown) — select menu with options array
- `toggle` — binary toggle buttons (e.g., Male/Female)
- `date` — date picker
- `computed` — auto-calculated from other inputs

## Watch Out For
- Option cards use `exclusive: true` flag for mutual exclusion in multi-select (e.g., "None" deselects others)
- Template customizations are saved to localStorage — users can reset to defaults
- The report-output component uses a custom `renderFn` callback — must be set before calling updateReport()
- SVG images use transparent backgrounds (page bg is dark already)
- Vite config uses MPA entry points — update rollupOptions.input when adding tools
