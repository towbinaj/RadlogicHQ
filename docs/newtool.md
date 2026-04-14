# Adding a New Tool to RadioLogicHQ

Reference this checklist when building any new calculator/tool. Update this doc as patterns evolve.

---

## 1. Files to Create

All files go in `src/tools/{toolId}/`:

| File | Purpose |
|------|---------|
| `definition.js` | Declarative config: inputs, features, options, parse rules, tooltips |
| `calculator.js` | Pure functions: scoring/categorization logic, recommendations |
| `templates.js` | Block-based report templates for PS360, PS1, RadAI Omni |
| `{toolId}.html` | MPA entry point (page shell) |
| `{toolId}.js` | Page controller wiring everything together |
| `{toolId}.css` | Tool-specific styles only (shared styles live in `forms.css`) |

Also:
- `public/images/{toolId}/` — SVG reference diagrams (only for tools with visual option cards)
- `src/data/cde-sets/{RDESXXX}.json` — Bundled CDE set (optional, for offline reference)

---

## 2. Tool Types

RadioLogicHQ supports two UI patterns. Choose based on the scoring system:

### Point-based (e.g., TI-RADS)
- All sections visible at once as clickable option card grids
- Points summed across sections → maps to risk level
- Uses `renderToolForm()` from `src/core/renderer.js`
- Uses `calculateScore()` from `src/core/engine.js`
- Sections are draggable to reorder

### Decision-tree (e.g., LI-RADS)
- Step-by-step questions with early exits
- Feature combinations map to categories via lookup table
- Custom UI built in page controller (no `renderToolForm()`)
- Custom calculator with decision logic (no `calculateScore()`)

---

## 3. Definition File (`definition.js`)

Export a single object. Structure varies by tool type.

### Common fields (both types)

```js
export const {toolId}Definition = {
  id: '{toolId}',                    // URL-safe, used in localStorage keys
  name: 'Human Readable Name',
  version: '1.0.0',
  description: 'One-line description.',
  cdeSetId: 'RDESXXX',              // RadElement CDE set ID (radelement.org)

  // --- Primary Inputs (rendered first as compact inline row) ---
  primaryInputs: [
    {
      id: 'location',
      label: 'Location',             // Label should NOT include unit — use separate label
      inputType: 'single-select',
      options: [
        { id: 'opt1', label: 'Option 1' },
      ],
      cdeElementId: 'RDE####',
    },
    {
      id: 'size',
      label: 'Size',                 // NOT "Size (cm)" — unit comes from toggle
      inputType: 'float',
      min: 0.1, max: 20, step: 0.1,
      unit: 'cm',                    // Native unit for internal storage
      unitToggle: true,              // Adds mm/cm toggle button
      placeholder: 'e.g., 1.5',
      cdeElementId: 'RDE####',
    },
  ],

  // --- Parse Rules (for paste-to-autofill) ---
  parseRules: { ... },               // See Parse Rules section below
};
```

### Point-based tools: additional fields

```js
  // Scored sections — rendered as draggable option card grids
  sections: [
    {
      id: 'section-id',
      label: 'Section Label',
      inputType: 'single-select',    // or 'multi-select'
      cdeElementId: 'RDE####',
      options: [
        {
          id: 'option-id',
          label: 'Label',
          points: 0,
          image: 'filename.svg',     // Optional
          cdeCode: 'RDE####.#',      // Optional
          exclusive: true,           // Optional — for multi-select "None" options
        },
      ],
    },
  ],

  additionalInputs: [],              // Rendered after scored sections
```

### Decision-tree tools: additional fields

```js
  // Decision steps — rendered sequentially as yes/no or multi-choice
  steps: [
    {
      id: 'stepId',
      question: 'Is this observation benign?',
      inputType: 'yes-no',          // or custom choice cards
      earlyExit: { yes: 'LR-1' },  // Category if answered yes
    },
  ],

  // Major features — rendered as compact inline rows (label left, buttons right)
  majorFeatures: [
    {
      id: 'featureId',
      label: 'Feature Name',
      tooltip: 'Definition from lexicon for hover tooltip',  // REQUIRED
      inputType: 'yes-no',
      cdeElementId: 'RDE####',
    },
  ],

  // Ancillary features — rendered as compact toggleable card grids
  ancillaryFeatures: {
    favoringUpgrade: [
      { id: 'featureId', label: 'Feature', tooltip: 'Definition...' },
    ],
    favoringDowngrade: [ ... ],
  },

  // Location input — separate from primaryInputs for decision-tree tools
  locationInput: { ... },
```

### Supported Input Types

| inputType | Renders As | formState Value |
|-----------|-----------|----------------|
| `single-select` (in section) | Clickable image cards, radio behavior | `string` (option ID) |
| `multi-select` (in section) | Clickable image cards, checkbox behavior | `string[]` (option IDs) |
| `single-select` (in primaryInputs) | `<select>` dropdown | `string \| null` |
| `float` | Number input (no spinner) with optional unit toggle | `number \| null` |
| `integer` | Number input (no spinner) | `number \| null` |
| `text` | Textarea | `string` |
| `yes-no` | Present/Absent or Yes/No button pair | `'yes' \| 'no' \| null` |

### Size Input with Unit Toggle

- Set `unitToggle: true` on size inputs to add mm/cm toggle
- Internal value always stored in the definition's native `unit`
- Toggle converts display value and persists preference to localStorage
- Number inputs use `class="no-spinner"` — no up/down arrows

### Tooltips

- **All feature labels should have tooltips** sourced from official lexicons
- Use `tooltip` property on features, not inline gray text
- Gray hint/description text is discouraged — it adds scroll and clutter
- Tooltips render as native `title` attributes for hover
- For multi-choice buttons, put `title` on each button

### Parse Rules

**Parse rules are auto-generated from the definition structure.** The parser (`parser.js`) uses `buildParseRules(definition)` to derive rules from:
- `sections` → keyword rules from option labels (single-select or multi-select)
- `primaryInputs` with `single-select` → keyword rules from option labels
- `primaryInputs` with `float`/`integer` → regex from label + unit
- `categories` with `findings` → multi-select rules from finding labels (AAST style)
- `categories` flat list → single-select rules from category labels (BI-RADS style)
- `grades` → keyword rules from grade labels (VUR style)
- `scores` → keyword rules from score labels + interpretations (Deauville style)
- Named option groups (e.g., `t2Score`, `dce`) → keyword rules from option labels
- `sideOptions`, `lateralityOptions`, `modalityOptions` → keyword rules from labels

A **synonym dictionary** in `parser.js` expands label keywords with common radiology variants (e.g., "hypoechoic" → "hypo-echoic", "right" → "right-sided", "present" → "positive"/"identified"/"seen").

**Most tools need no manual `parseRules`** — just leave `parseRules: {}` and the auto-generator handles it.

For tools needing **specialized terminology** not covered by labels/synonyms, add manual overrides. Hand-written rules win on conflict with auto-generated:

```js
parseRules: {
  // Regex — extracts numeric value
  'size': {
    pattern: /(\d*\.?\d+)\s*mm/,    // Use \d*\.?\d+ not \d+\.?\d*
    group: 1,
    transform: (m) => parseInt(m[1], 10),
  },

  // Single-select keywords — matches longest
  'featureId': {
    options: {
      'yes': ['keyword1', 'keyword phrase'],
      'no': ['no keyword', 'absent'],
    },
  },

  // Multi-select keywords — matches ALL found
  'multiFeatureId': {
    multi: true,
    options: { ... },
  },
},
```

- Match against original text (not progressively stripped)
- Remainder goes to Additional Findings, separated by semicolons
- Section label variants (plural/singular) auto-stripped from remainder
- Re-parse replaces form state (not appends)
- To add new synonyms, update the `SYNONYMS` dictionary in `src/core/parser.js`
- Run `npm run check-synonyms {toolId}` to see which labels have synonym coverage and which don't
- Run `npm run check-synonyms -- --all` to check all tools at once

---

## 4. Calculator File (`calculator.js`)

Two patterns:

### Point-based

```js
export function calculate{Tool}(totalScore, sizeCm) {
  const level = getLevel(totalScore);    // Map score → risk level
  const mgmt = getManagement(level, sizeCm);
  return {
    totalScore,
    levelName: 'TR5',
    levelLabel: 'Highly Suspicious',
    levelFullLabel: 'TR5 - Highly Suspicious',
    recommendation: 'FNA recommended',
    noduleSize: sizeCm,
    noduleSizeProvided: sizeCm != null,
  };
}
```

### Decision-tree

```js
export function calculate{Tool}(formState) {
  // Check early exits first
  if (formState.definitelyBenign === 'yes') return buildResult('LR-1', ...);
  // Lookup table for feature combinations
  const table = hasAPHE ? TABLE_APHE : TABLE_NO_APHE;
  return buildResult(category, ...);
}
```

**Important**: Every key returned becomes a `{{variable}}` in report templates.

---

## 5. Templates File (`templates.js`)

Block-based. Each block = one line in the report.

```js
export const {toolId}Templates = {
  ps360: {
    label: 'PowerScribe 360',
    blocks: [
      { id: 'obsLabel', label: 'Label', template: '{{obsLabel}}:', enabled: true, locked: true },
      { id: 'location', label: 'Location', template: 'Location: {{location}}', enabled: true, condition: 'locationProvided' },
      { id: 'size', label: 'Size', template: 'Size: {{sizeMm}} mm', enabled: true, condition: 'sizeProvided' },
      { id: 'feature', label: 'Feature', template: 'Feature: {{featureLabel}}', enabled: true },
      { id: 'category', label: 'Category', template: 'Category: {{categoryFullLabel}}', enabled: true },
    ],
    impression: {
      template: 'IMPRESSION:\n{{impressionSummary}}',
      enabled: true,
    },
    showPoints: true,      // false for tools without point scoring
  },
  ps1: { ... },
  radai: { ... },
};
```

### Block properties

| Property | Required | Description |
|----------|----------|-------------|
| `id` | Yes | Unique block identifier |
| `label` | Yes | Shown in block editor |
| `template` | Yes | Template string with `{{variables}}` |
| `pointsTemplate` | No | Appended when "Show points" is on |
| `enabled` | Yes | Default visibility |
| `locked` | No | Prevents toggle/reorder (use for item label) |
| `showPoints` | No | Whether this block has points |
| `condition` | No | Only render if this data key is truthy |

### 🔴 HL7 safety — characters to avoid in templates and labels

Report text is copied into dictation systems (PS360, PowerScribe One, RadAI
Omni) and ultimately flows through HL7 v2 ORU messages. These characters
are HL7 v2 structural delimiters and **will corrupt the message** if they
appear in OBX-5 content:

| Forbidden | HL7 role | Use instead |
|---|---|---|
| `\|` | field separator | `;` or `(parens)` or a newline |
| `~` | field-repetition separator | write `approx` instead of `~` |
| `^` | component separator | `-` |
| `&` | subcomponent separator | `and` |
| `\\` | escape character | `/` or omit |

**Never write `' \| Points: {{x}}'` in a template.** Match the existing
TI-RADS PS360 pattern: `' ({{x}} pts)'`.

Non-ASCII characters (em-dash `—`, en-dash `–`, `≥`, `≤`, `°`, `×`, `±`,
`→`) are sanitized to ASCII equivalents by `src/core/clipboard.js` on
copy (so `≥3 mm` becomes `>=3 mm` in the pasted text). Prefer ASCII in
new templates anyway — it's one less layer to reason about — but the
backstop is there.

### Impression variable

- Point-based tools: use `{{noduleSummaries}}` (built by page controller)
- Decision-tree tools: use `{{impressionSummary}}` (built by page controller)

---

## 6. Page HTML (`{toolId}.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{Tool Name} | RadioLogicHQ</title>
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <meta name="description" content="{Tool Name} calculator with structured report output for PowerScribe and RadAI.">
  <link rel="canonical" href="https://radiologichq.com/src/tools/{toolId}/{toolId}.html">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="RadioLogicHQ">
  <meta property="og:title" content="{Tool Name} | RadioLogicHQ">
  <meta property="og:description" content="{Tool Name} calculator with structured report output for PowerScribe and RadAI.">
  <meta property="og:url" content="https://radiologichq.com/src/tools/{toolId}/{toolId}.html">
  <meta property="og:image" content="https://radiologichq.com/favicon-512.png">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="{Tool Name} | RadioLogicHQ">
  <meta name="twitter:description" content="{Tool Name} calculator with structured report output for PowerScribe and RadAI.">
  <meta name="twitter:image" content="https://radiologichq.com/favicon-512.png">
</head>
<body>
  <header class="site-header">
    <div class="container">
      <a href="/" class="site-header__logo"><img src="/brand/wordmark-white-400.png" srcset="/brand/wordmark-white-400.png 400w, /brand/wordmark-white-800.png 800w, /brand/wordmark-white-1200.png 1200w" sizes="172px" alt="RadioLogic HQ" class="site-header__wordmark"></a>
      <nav class="site-header__nav">
        <a href="/">All Tools</a>
        <auth-ui></auth-ui>
      </nav>
    </div>
  </header>

  <main class="container">
    <div class="tool-hero">
      <div class="tool-hero__text">
        <h1>{Tool Name} <a href="{url}" target="_blank" rel="noopener" class="tool-hero__ref" title="{full citation}">Ref</a></h1>
      </div>
      <div class="tool-hero__summary">
        <div class="summary-badge summary-badge--level">
          <span class="summary-badge__label">{Score/Category}</span>
          <span class="summary-badge__value" id="{tool}-level" data-level="0">--</span>
        </div>
      </div>
    </div>

    <!-- Multi-item tabs -->
    <div class="{item}-tabs-bar" id="{item}-tabs"></div>

    <div class="tool-layout">
      <div class="tool-layout__input">
        <div id="tool-input"></div>  <!-- or id="step-container" for decision-tree -->
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

## 7. Page Controller (`{toolId}.js`)

**Required imports (get you the full chrome for free):**
```js
import '../../styles/base.css';
import '../../styles/forms.css';
import './{toolId}.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import '../../core/tool-name.js';   // auto-imports feedback-widget, custom tool names, compact mode
```
The feedback widget (floating bottom-left "Feedback" button → GitHub Issues)
auto-inserts itself from `tool-name.js`. No additional wiring needed.

**Key responsibilities:**
- Import styles (`base.css`, `forms.css`, tool CSS) and `report-output.js` component
- Track tool opens: `trackEvent('tool:{toolId}:opens')` as first line in `init()`
- Manage multi-item state — each item has its own `formState`
- Render item tabs (add, remove, switch, double-click to rename)
- Build UI (point-based: `renderToolForm()` | decision-tree: custom DOM)
- Wire all inputs to update `formState` → recalculate → update report
- Build template data with all `{{variable}}` keys needed by templates
- Set `reportEl.renderFn` to render FINDINGS + ADDITIONAL FINDINGS + IMPRESSION
- Additional Findings is study-level (outside item state)
- Wire parse button: replace (not merge) form state, remainder → Additional Findings
- For LI-RADS-style: include series/image number fields → `Observation 1 (Series 4, Image 127)`

**Report renderFn pattern:**
```js
reportEl.renderFn = (config, _data) => {
  const blocks = config.blocks || [];
  const sections = [];
  // FINDINGS per item
  const findings = allItemData.map((data) => renderBlocks(blocks, data, config.showPoints));
  sections.push('FINDINGS:\n' + findings.join('\n\n'));
  // ADDITIONAL FINDINGS (study-level)
  if (studyAdditionalFindings.trim())
    sections.push('ADDITIONAL FINDINGS:\n' + studyAdditionalFindings.trim());
  // IMPRESSION (combined)
  if (config.impression?.enabled)
    sections.push(renderReport(config.impression.template, { impressionSummary: ... }));
  return sections.join('\n\n');
};
```

---

## 8. Shared Styles (in `forms.css`)

These styles are shared across ALL tools — do NOT duplicate in tool CSS:
- Report output component (header, text, controls, edit bar, editable lines, toast)
- Hero bar (layout, title, ref link, summary badges)
- Step container layout (`#step-container`, `#organs-container` — flex column, `var(--space-sm)` gap)
- Tab bars (`.observation-tabs-bar`, `.nodule-tabs-bar`, `.mode-tabs-bar`)
- Step cards, choice buttons, benign-choice buttons
- Study findings (label, textarea)
- Parse panel (label, textarea, button, status)
- Unit toggle (`mm | cm` buttons)
- No-spinner class for number inputs

**Tool CSS should only contain:**
- Level badge colors (`data-level` attributes)
- Tool-specific section/card styles (tables, custom grids)
- Ancillary feature grid styles (if applicable)
- **Never add `#step-container` or `.mode-tabs-bar` styles** — these are centralized in forms.css

---

## 9. Reference Images (point-based tools only)

- Place SVGs in `public/images/{toolId}/`
- Use 200x150 viewBox, transparent background
- Dark theme: `#3a4a5a` for tissue, `#60a5fa` for outlines
- Cards without images get an empty placeholder (same background)
- Show/Hide images toggle renders automatically if any option has an `image`
- Decision-tree tools typically don't need images

---

## 10. Config Updates

### vite.config.js
**No manual update needed.** Vite config auto-discovers HTML files from `src/tools/*/` and `src/pages/`.

### src/data/tools-registry.js
```js
{
  id: '{toolId}',
  name: '{Tool Name}',
  description: '...',
  icon: 'XX',
  path: '/src/tools/{toolId}/{toolId}.html',
  status: 'active',
  bodyParts: ['Liver'],
  modalities: ['CT', 'MR'],
  specialties: ['Body Imaging'],
  cdeSetId: 'RDESXXX',
}
```

Landing page renders automatically from the registry — no HTML edits needed.

---

## 11. Design Principles

- **Efficiency first**: minimize clicks, scrolling, mouse mileage
- **Controls near content**: toggles/links next to what they affect
- **Tooltips over text**: use hover tooltips (from official lexicons), not inline gray descriptions
- **No number spinners**: all numeric inputs use `class="no-spinner"`
- **Unit toggle**: size inputs get mm/cm toggle, preference persists
- **Compact layout**: small cards, tight grids, inline rows for features
- **Dark theme**: all colors from CSS variables
- **Font consistency**: all labels same size/weight per toolui.md
- **Feature labels**: `text-xs` weight 500, indented under section headers
- **Buttons aligned**: use `min-width` on labels so Present/Absent buttons align vertically
- **Always-open sections**: don't use collapsible `<details>` — keep ancillary features visible
- **Series/Image numbers**: narrow text inputs (70px, no spinner, centered) for reference numbers

---

## 12. Verification Checklist

- [ ] All options selectable, score/category updates live
- [ ] Correct risk level/category for all feature combinations
- [ ] Size affects management recommendation (if applicable)
- [ ] All 3 report templates generate correct output
- [ ] Copy button copies plain text
- [ ] Multi-item tabs: add, remove, switch, rename (double-click)
- [ ] Each item maintains independent form state
- [ ] Report: per-item findings + study-level additional findings + combined impression
- [ ] Item label includes series/image numbers when provided
- [ ] Paste & parse auto-fills correct options
- [ ] Unparsed text goes to Additional Findings with semicolons
- [ ] Re-parse replaces (not appends) form state and additional findings
- [ ] Show/Hide images toggle works (point-based tools)
- [ ] Compact mode works (point-based tools)
- [ ] Block editor: toggle fields, reorder, show/hide points, WYSIWYG edit
- [ ] Section drag-and-drop syncs with report block order (point-based tools)
- [ ] Template customizations persist in localStorage
- [ ] Unit toggle (mm/cm) works and persists preference
- [ ] Hover tooltips on all feature labels
- [ ] No gray instruction text — tooltips only
- [ ] Build passes (`npm run build`)
- [ ] Tests pass (`npm run test:run`)
- [ ] Unit tests written for `calculator.js` (co-located as `calculator.test.js`)
- [ ] `trackEvent('tool:{toolId}:opens')` in `init()` function
- [ ] Paste & parse works via auto-generated rules (add manual overrides if specialized terminology needed)
- [ ] Synonym coverage checked (`npm run check-synonyms {toolId}`) — add missing synonyms to `SYNONYMS` in `parser.js` if needed
- [ ] CDE set ID and element IDs correct per radelement.org
- [ ] Tool registered in `tools-registry.js` with body parts, modalities, specialties
- [ ] HTML `<head>` includes favicon + canonical + OG + Twitter meta tags (copy from another tool page if unsure)
- [ ] Canonical URL reflects the correct `/src/tools/{toolId}/{toolId}.html` path
- [ ] Header uses `<img class="site-header__wordmark" srcset=...>` — not the old text `RadioLogicHQ` span
- [ ] Tool is listed in `public/sitemap.xml` (regenerate the sitemap if adding more than one tool at a time; the generator script is a one-liner in `python3` — see the commit that introduced `public/sitemap.xml`)
- [ ] Any new third-party script/API/CDN used by this tool is added to the CSP in `public/_headers` (connect-src / script-src / img-src as appropriate)
- [ ] **HL7 safety**: no `|`, `~`, `^`, `&`, or `\` in any template strings, option labels, or tooltips that flow into the rendered report. See the "HL7 safety" callout in section 5 for the full list. Grep: `grep -n "[\|~^&]" src/tools/{toolId}/*.js`

---

*Last updated: 2026-04-14. Update this doc each time a new tool is built or the framework changes.*
