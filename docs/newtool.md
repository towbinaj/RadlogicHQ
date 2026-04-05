# Adding a New Tool to RadlogicHQ

Reference this checklist when building any new calculator/tool. Update this doc as patterns evolve.

---

## 1. Files to Create

All files go in `src/tools/{toolId}/`:

| File | Purpose |
|------|---------|
| `definition.js` | Declarative config: inputs, scoring sections, options, parse rules |
| `calculator.js` | Pure functions: scoring logic, risk levels, management recommendations |
| `templates.js` | Block-based report templates for PS360, PS1, RadAI Omni |
| `{toolId}.html` | MPA entry point (page shell) |
| `{toolId}.js` | Page controller wiring everything together |
| `{toolId}.css` | Tool-specific styles (if needed beyond base styles) |

Also:
- `public/images/{toolId}/` — SVG reference diagrams for option cards
- `src/data/cde-sets/{RDESXXX}.json` — Bundled CDE set (optional, for offline reference)

---

## 2. Definition File (`definition.js`)

Export a single object with this structure:

```js
export const {toolId}Definition = {
  id: '{toolId}',                    // URL-safe, used in image paths and localStorage keys
  name: 'Human Readable Name',
  version: '1.0.0',
  description: 'One-line description.',
  cdeSetId: 'RDESXXX',              // RadElement CDE set ID (from radelement.org)

  // --- Primary Inputs (rendered first, above scoring sections) ---
  primaryInputs: [
    {
      id: 'input-id',               // Used as formState key
      label: 'Label',
      inputType: 'single-select',   // See input types below
      options: [
        { id: 'opt1', label: 'Option 1' },
      ],
      cdeElementId: 'RDE####',      // Optional CDE mapping
    },
    {
      id: 'measurement',
      label: 'Size (cm)',
      inputType: 'float',
      min: 0.1,
      max: 20,
      step: 0.1,
      unit: 'cm',
      placeholder: 'e.g., 1.5',
      cdeElementId: 'RDE####',
    },
  ],

  // --- Scored Sections (rendered as option card grids) ---
  sections: [
    {
      id: 'section-id',             // Used as formState key
      label: 'Section Label',
      description: 'Optional helper text',  // Omit if not needed
      inputType: 'single-select',   // or 'multi-select'
      cdeElementId: 'RDE####',
      options: [
        {
          id: 'option-id',
          label: 'Human readable label',
          points: 0,                 // Scoring points
          image: 'filename.svg',     // Optional — in public/images/{toolId}/
          cdeCode: 'RDE####.#',      // Optional CDE value code
          exclusive: true,           // Optional — for multi-select, deselects others (e.g., "None")
        },
      ],
    },
  ],

  // --- Additional Inputs (rendered after scored sections) ---
  additionalInputs: [],              // Same format as primaryInputs

  // --- Parse Rules (for paste-to-autofill feature) ---
  parseRules: {
    // Regex rule — extracts a numeric value
    'input-id': {
      pattern: /(\d*\.?\d+)\s*cm/,   // Must match against lowercase text
      group: 1,                       // Capture group index
      transform: (m) => parseFloat(m[1]),  // Convert match to value
    },

    // Single-select keyword rule — matches longest keyword
    'section-id': {
      options: {
        'option-id': ['keyword1', 'keyword phrase', 'alternate term'],
        'option-id-2': ['other keyword'],
      },
    },

    // Multi-select keyword rule — matches ALL found keywords
    'multi-section-id': {
      multi: true,
      options: {
        'option-id': ['keyword1', 'keyword phrase'],
        'option-id-2': ['other keyword'],
      },
    },
  },
};
```

### Supported Input Types

| inputType | Renders As | formState Value |
|-----------|-----------|----------------|
| `single-select` (in section) | Clickable image cards, radio behavior | `string` (option ID) |
| `multi-select` (in section) | Clickable image cards, checkbox behavior | `string[]` (option IDs) |
| `single-select` (in primaryInputs/additionalInputs) | `<select>` dropdown | `string \| null` |
| `float` | Number input with unit label | `number \| null` |
| `integer` | Number input | `number \| null` |
| `text` | Textarea | `string` |

### Option Properties

| Property | Required | Description |
|----------|----------|-------------|
| `id` | Yes | Unique within the section, used as formState value |
| `label` | Yes | Display text |
| `points` | Yes (sections) | Numeric score for this option |
| `image` | No | SVG filename in `public/images/{toolId}/` |
| `cdeCode` | No | CDE value code (e.g., `RDE1040.3`) |
| `exclusive` | No | For multi-select: selecting this deselects all others |

### Parse Rules

- Keywords are matched case-insensitively against pasted text
- List keywords longest-first for best matching (the engine handles this)
- Include common synonyms and abbreviations
- Regex rules: use `\d*\.?\d+` (not `\d+\.?\d*`) to handle values like `.5`
- Matched text is stripped; remainder goes to Additional Findings
- Section label variants (plural/singular) are auto-stripped from remainder

---

## 3. Calculator File (`calculator.js`)

Export pure functions that take the total score + additional inputs and return a result object. The result object gets merged into template data.

```js
export function calculate{Tool}(totalScore, ...otherInputs) {
  // Map score to risk level, category, recommendation, etc.
  return {
    totalScore,
    levelName: '...',        // e.g., 'TR5'
    levelLabel: '...',       // e.g., 'Highly Suspicious'
    levelFullLabel: '...',   // e.g., 'TR5 - Highly Suspicious'
    recommendation: '...',   // e.g., 'FNA recommended'
    recommendationDetail: '...', // Longer explanation
    // ... any other keys needed by report templates
  };
}
```

**Important**: Every key returned here becomes a `{{variable}}` available in report templates.

---

## 4. Templates File (`templates.js`)

Export an object with three template configurations (PS360, PS1, RadAI Omni). Each has:

```js
export const {toolId}Templates = {
  ps360: {
    label: 'PowerScribe 360',
    blocks: [
      {
        id: 'blockId',              // Unique block identifier
        label: 'Block Label',       // Shown in block editor
        template: 'Label: {{variable}}',  // Template with {{variables}}
        pointsTemplate: ' ({{variablePoints}} pts)',  // Optional — appended when points shown
        enabled: true,              // Default visibility
        locked: true,               // Optional — prevents toggle/reorder (use for nodule label)
        showPoints: true,           // Optional — whether this block has points to show
        condition: 'variableProvided',  // Optional — only render if this data key is truthy
      },
    ],
    impression: {
      template: 'IMPRESSION:\n{{noduleSummaries}}',
      enabled: true,
    },
    showPoints: true,               // Global default for "Show points" toggle
  },
  ps1: { ... },
  radai: { ... },
};
```

### Template Variables

Variables come from three sources:
1. **buildTemplateData()** — auto-maps section IDs to labels (e.g., `{{composition}}` = "Solid or almost completely solid")
2. **buildTemplateData()** — auto-maps `{sectionId}Points` (e.g., `{{compositionPoints}}` = 2)
3. **calculator.js return object** — all keys become available (e.g., `{{tiradsFullLabel}}`)
4. **Page controller** — manually added keys (e.g., `{{noduleLabel}}`, `{{noduleLocation}}`)

### Special Variables (set by the page controller)

| Variable | Source | Description |
|----------|--------|-------------|
| `{{noduleLabel}}` | Page controller | "Nodule 1", "Nodule 2", etc. |
| `{{noduleLocation}}` | Page controller | Resolved from primaryInputs |
| `{{noduleLocationProvided}}` | Page controller | Boolean for conditional rendering |
| `{{noduleSummaries}}` | Page controller | Combined impression lines for all nodules |

---

## 5. Page HTML (`{toolId}.html`)

Standard structure — copy from tirads.html and modify:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{Tool Name} | RadlogicHQ</title>
</head>
<body>
  <header class="site-header">
    <div class="container">
      <a href="/" class="site-header__logo">RadlogicHQ</a>
      <nav class="site-header__nav">
        <a href="/">All Tools</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <!-- Hero with score/level badges -->
    <div class="tool-hero">
      <div class="tool-hero__text">
        <h1>{Tool Name} <a href="{reference_url}" target="_blank" rel="noopener" class="tool-hero__ref" title="{full citation}">{Ref}</a></h1>
      </div>
      <div class="tool-hero__summary">
        <div class="summary-badge">
          <span class="summary-badge__label">Score</span>
          <span class="summary-badge__value" id="total-score">0</span>
        </div>
        <div class="summary-badge summary-badge--level">
          <span class="summary-badge__label">Level</span>
          <span class="summary-badge__value" id="{tool}-level" data-level="0">--</span>
        </div>
      </div>
    </div>

    <!-- Multi-item tabs (if applicable) -->
    <div class="nodule-tabs-bar" id="nodule-tabs"></div>

    <div class="tool-layout">
      <div class="tool-layout__input">
        <div id="tool-input"></div>
        <div class="study-findings card">
          <label for="additional-findings">Additional Findings</label>
          <textarea id="additional-findings" rows="2"></textarea>
        </div>
      </div>
      <div class="tool-layout__output">
        <report-output></report-output>
        <div class="parse-panel card">
          <label for="parse-input">Paste Findings</label>
          <textarea id="parse-input" rows="3" placeholder="Paste report text to auto-fill..."></textarea>
          <div class="parse-panel__actions">
            <button class="btn btn--primary parse-panel__btn" id="parse-btn">Parse</button>
            <span class="parse-panel__status" id="parse-status"></span>
          </div>
        </div>
      </div>
    </div>
  </main>

  <script type="module" src="./{toolId}.js"></script>
</body>
</html>
```

---

## 6. Page Controller (`{toolId}.js`)

Wires definition → renderer → engine → calculator → report output. Copy from tirads.js and modify:

**Key responsibilities:**
- Import all modules (styles, components, core libs, tool-specific files)
- Manage multi-item state (nodules, lesions, etc.) — each item has its own `formState`
- Render nodule/item tabs if multi-item
- Wire `renderToolForm()` with onChange callback
- Call `calculateScore()` + tool-specific calculator on every change
- Build template data, add tool-specific keys (location resolution, camelCase remapping)
- Set `reportEl.renderFn` that renders blocks per-item + combined impression
- Handle study-level additional findings (separate from per-item state)
- Wire parse button to `parseFindings()`

**Template data remapping** — hyphenated section IDs need camelCase aliases for templates:
```js
templateData.echogenicFoci = templateData['echogenic-foci'] || 'Not selected';
templateData.echogenicFociPoints = sectionScores['echogenic-foci'] || 0;
```

---

## 7. Reference Images

- Place SVGs in `public/images/{toolId}/`
- Use 200x150 viewBox, transparent background
- Dark theme friendly: use `#3a4a5a` for tissue, `#60a5fa` for outlines
- Filename format: `{section}-{option}.svg` (e.g., `composition-solid.svg`)
- Cards without images get an empty placeholder automatically (same background color)
- Images hidden in compact mode via `.view-toggle-link`

---

## 8. Config Updates

### vite.config.js
Add the new HTML entry point:
```js
rollupOptions: {
  input: {
    main: resolve(__dirname, 'index.html'),
    tirads: resolve(__dirname, 'src/tools/tirads/tirads.html'),
    newtool: resolve(__dirname, 'src/tools/{toolId}/{toolId}.html'),  // ADD
  },
},
```

### index.html
Add a tool card to the landing page grid:
```html
<a href="/src/tools/{toolId}/{toolId}.html" class="tool-card">
  <div class="tool-card__icon">{XX}</div>
  <div class="tool-card__body">
    <h2 class="tool-card__title">{Tool Name}</h2>
    <p class="tool-card__desc">{Description}</p>
    <span class="tool-card__tag">{Specialty} &bull; {Modality}</span>
  </div>
</a>
```

---

## 9. Design Principles

- **Efficiency first**: minimize clicks, scrolling, mouse travel (see feedback_radlogic_efficiency.md)
- **Controls near content**: toggles/links belong next to what they affect
- **Compact by default**: small cards, tight grids, no wasted whitespace
- **Show/Hide images**: every tool with image cards gets the inline toggle link
- **Dark theme**: all colors from CSS variables, dark radiology reading room aesthetic
- **Font consistency**: section labels, input labels, and additional findings labels should all match

---

## 10. Verification Checklist

- [ ] All scoring options selectable, score updates live
- [ ] Score maps to correct risk level/category
- [ ] Size/measurement affects management recommendation
- [ ] All 3 report templates generate correct output
- [ ] Copy button copies plain text
- [ ] Multi-item (nodule) tabs: add, remove, switch, rename (double-click)
- [ ] Each item maintains independent form state
- [ ] Report shows per-item findings + combined impression
- [ ] Paste & parse auto-fills correct options
- [ ] Unparsed text goes to Additional Findings with semicolon separation
- [ ] Re-parse replaces (not appends) form state and additional findings
- [ ] Show/Hide images toggle works
- [ ] Compact mode hides images, tightens layout
- [ ] Block editor: toggle fields, reorder, show/hide points
- [ ] Template customizations persist in localStorage
- [ ] Build passes (`npm run build`)
- [ ] CDE set ID and element IDs are correct per radelement.org

---

*Last updated: 2026-04-05. Update this doc each time a new tool is built or the framework changes.*
