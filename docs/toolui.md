# Tool UI Style Guide

Reference this when styling new tools to maintain visual consistency across RadioLogicHQ. All values use CSS variables from `src/styles/variables.css`. Shared styles live in `src/styles/forms.css`.

*Last updated: 2026-04-14*

---

## Shared vs Tool-Specific CSS

**`src/styles/forms.css`** contains ALL shared styles:
- Report output component (header, text, controls, edit bar, editable lines, toast)
- Hero bar (layout, title, ref link, summary badges)
- Step container layout (`#step-container`, `#organs-container` — flex column, `var(--space-sm)` gap)
- Tab bars (`.observation-tabs-bar`, `.nodule-tabs-bar`, `.mode-tabs-bar`)
- Step cards, choice/benign-choice buttons
- Study findings, parse panel
- Unit toggle (mm/cm), no-spinner class
- Form controls (inputs, selects, textareas, buttons)

**`src/tools/{toolId}/{toolId}.css`** contains ONLY tool-specific styles:
- Level badge colors
- Tool-specific tables, grids, measurement layouts
- Ancillary feature grid
- Compact mode overrides (point-based tools)

**Never duplicate shared styles in tool CSS.** In particular, `#step-container`, `.mode-tabs-bar`, and tab bar styles are centralized — do not redefine them per tool.

---

## Page Layout

- **Two-column grid**: `3fr 2fr` — input wider than output
- **Column gap**: `var(--space-md)` (16px)
- **Report output**: sticky, stays visible while scrolling
- **Container**: max-width 1400px

---

## Hero Bar

- **Layout**: flex row, title left, badge(s) right
- **Title**: `var(--text-xl)`, weight 600
- **Reference link**: superscript `Ref`, `var(--text-xs)`, accent color, full citation in `title` tooltip
- **Validation badge**: injected by `src/core/tool-name.js` after the Ref link — red warning triangle if the tool is not in `VALIDATED_TOOLS` (default), green check circle if it is. 22px, hover tooltip explains status. See *Validation Badges* section below.
- **Badge**: inline, `var(--space-xs) var(--space-md)` padding, label + value in a row
- **Badge label**: `var(--text-xs)`, uppercase, muted
- **Badge value**: `var(--text-lg)`, weight 700

---

## Multi-Item Tabs

- **Layout**: flex row, `var(--space-xs)` gap, bottom border
- **Tab**: `var(--text-sm)`, weight 500, surface background
- **Active**: white text, accent background
- **Add (+)**: dashed border, success color
- **Remove (−)**: dashed border, danger color, `margin-left: auto`
- **Rename**: double-click tab

---

## Primary Inputs (Location, Size, Series, Image)

- **Layout**: flex row, `var(--space-md)` gap, `align-items: end`
- **Card padding**: `var(--space-sm) var(--space-md)`
- **Labels**: `var(--text-sm)`, weight 600, primary color
- **Inputs**: `var(--text-sm)` font size
- **Size input**: `class="no-spinner"`, with `unit-toggle` (mm | cm)
- **Series/Image inputs**: `type="text"`, `inputmode="numeric"`, 70px width, centered, no spinner
- **Unit toggle**: small inline button group next to size input, persists to localStorage

---

## Score Sections — Point-Based Tools (TI-RADS pattern)

### Container
- `#tool-input` and `.sections-container`: flex column, `var(--space-sm)` gap

### Section Card
- **Padding**: `var(--space-sm) var(--space-md)`
- **Draggable**: drag handle (≡) appears on hover, opacity 0 → 0.6

### Section Header
- **Layout**: flex row, handle + title left (`margin-right: auto`), points badge right
- **Title**: `var(--text-sm)`, weight 600
- **Points badge**: `var(--text-xs)`, transitions to accent when has points

### Option Cards Grid
- **Grid**: `repeat(auto-fill, minmax(100px, 1fr))`, `var(--space-xs)` gap
- **Card**: `var(--bg-input)`, 2px transparent border, `var(--radius-md)`
- **Hover**: border `var(--border-color)`, bg `var(--bg-elevated)`
- **Selected**: border `var(--accent)`, bg `var(--accent-subtle)`

### Option Card Images
- **Height**: 56px fixed
- **Background**: `var(--bg-primary)` (empty placeholders match)
- **No-image cards**: get empty placeholder div, same background

### Option Card Body
- **Padding**: `4px var(--space-sm)`, flex row, baseline
- **Label**: `var(--text-xs)`, weight 500, `flex: 1`
- **Points**: `0.65rem`, muted, `white-space: nowrap`
- **Selected points**: accent color

### Show/Hide Images Toggle
- Inline text link, `var(--text-xs)`, accent color, `text-align: right`
- Renders automatically if any option has an `image`

### Compact Mode (`body.compact`)
- Images hidden, grid becomes `1fr 1fr`, 3px gap
- Section padding reduces, descriptions hidden
- Layout columns become `1fr 1fr`

---

## Step Cards — Decision-Tree Tools (LI-RADS pattern)

### Step Container
- `#step-container`: flex column, `var(--space-sm)` gap

### Step Card
- **Padding**: `var(--space-sm) var(--space-md)`
- **Disabled**: opacity 0.25, pointer-events none (stays in DOM — no layout shift)

### Question
- `var(--text-sm)`, weight 600, primary color

### Choice Buttons (benign assessment)
- **Layout**: flex row, wrap, `var(--space-xs)` gap
- **Button**: `var(--text-xs)`, weight 500, secondary color, `var(--bg-input)`, border
- **Active**: white, accent background
- **Tooltips**: `title` attribute with definition — NO inline gray text

### Result Badge
- Always takes space (`min-height: 1.4em`, `opacity: 0`)
- Visible via `step-card__result--visible` class (`opacity: 1`)
- **No `hidden` attribute** — prevents layout jumping

### Yes/No Buttons
- Same style as choice buttons: `var(--text-xs)`, `var(--space-xs) var(--space-md)` padding

---

## Major Features — Decision-Tree Tools

- **Layout**: compact inline rows (label left, buttons right)
- **Indented**: `padding-left: var(--space-md)` under section header
- **Label**: `var(--text-xs)`, weight 500, primary color, `cursor: help`
- **Label width**: `min-width: 200px` — aligns all buttons vertically
- **Tooltip**: on the label itself via `title` attribute
- **Buttons**: Present/Absent, same step-btn style
- **No stacked layout** — label and buttons on one line

---

## Ancillary Features — Decision-Tree Tools

- **Always open** — no `<details>` collapse, no caret
- **Section title**: `var(--text-xs)`, weight 600, secondary color
- **Groups separated**: `var(--space-md)` gap between Special Categories, Favoring Upgrade, Favoring Downgrade
- **Card grid**: `repeat(auto-fill, minmax(120px, 1fr))`, 3px gap
- **Card**: `var(--text-xs)`, weight 500, `var(--bg-input)`, 2px transparent border
- **Selected**: white text, accent background
- **Tooltips**: `title` on each card from official lexicon

---

## Report Output Panel

### Header
- **Padding**: `var(--space-sm) var(--space-md)`
- **Background**: `var(--bg-secondary)`
- **Title**: `var(--text-base)`, weight 600
- **Controls**: flex row — template selector, Edit, Copy

### Report Text (view mode)
- **Padding**: `var(--space-sm) var(--space-md)`, max-height 400px scrollable
- **Font**: `var(--font-mono)`, `var(--text-sm)`, `line-height: 1.6`, `pre-wrap`
- Rendered from the tool's template; in edit mode this same `<pre>` becomes the pill editor surface.

### Edit Mode — Pill Editor
The editor is **pill-based WYSIWYG**, not line-based. See `src/components/report-output.js` and `src/core/pill-editor.js` for the data model.

- **Editor surface**: the `.report-output__text` `<pre>` gains the `pill-editor` class and becomes `contentEditable`. Users type free text around inline pill tokens.
- **Pill tokens**: `.pill` spans with `contentEditable="false"`, colored background per pill kind, each representing a structured data field (e.g. `{{composition}}`). Clicking a pill opens a popover; dragging a pill moves it.
- **Pill palette panel**: `.report-output__pill-palette` shows on the right side during edit. Groups are *Findings / Scores / Other*, each with `.pill-palette__item` draggable entries. Current live value is previewed via `.pill-palette__item-value` (truncated to 20 chars, HTML-escaped via `escapeHtml`).
- **Pill popover**: `.pill-popover` — opened with the pencil icon on a selected pill. Lets the user:
  - Edit display aliases per option value
  - Toggle the pill's visibility in the report
  - Add custom options (`+ New field` in the palette creates new pill types)
  - Remove custom options
- **Edit bar**: below the report — "Show points" toggle (point-based tools), "Save as Template", "Reset to Default", "Done".
- **Serialization**: DOM → `editorContent` array of `{ type: 'text' | 'pill', ... }` nodes via `serializeDOM()`. `editorContent` is created lazily on first edit; before that, rendering falls back to the block-based template.
- **Leak prevention**: the editor uses an `AbortController` to drop event listeners on re-render — don't remove this without an equivalent cleanup.

### Copy Toast
- Fixed bottom-right, success color, opacity transition

---

## Additional Findings (Study-Level)

- **Separate from item state** — shared across all items
- **Label**: `var(--text-sm)`, weight 600, primary color
- **Textarea**: no placeholder text, 2 rows
- **In report**: separate `ADDITIONAL FINDINGS:` section between findings and impression

---

## Parse Panel

- Below report output, `margin-top: var(--space-md)`
- **Label**: `var(--text-sm)`, weight 600, primary color
- **Textarea**: 3 rows, placeholder "Paste report text to auto-fill..."
- **Parse button**: `var(--text-xs)`, primary style
- **Status**: `var(--text-xs)`, muted → success on match

---

## Typography Rules

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Section titles (point-based) | `var(--text-sm)` | 600 | primary |
| Step questions (decision-tree) | `var(--text-sm)` | 600 | primary |
| Primary input labels | `var(--text-sm)` | 600 | primary |
| Additional Findings label | `var(--text-sm)` | 600 | primary |
| Paste Findings label | `var(--text-sm)` | 600 | primary |
| Major feature labels | `var(--text-xs)` | 500 | primary |
| Option card labels | `var(--text-xs)` | 500 | primary |
| Ancillary card labels | `var(--text-xs)` | 500 | secondary |
| Points text | `0.65rem` | 600 | muted |
| Hints/tooltips only | `var(--text-xs)` | — | via `title` attr |

**No inline gray description text.** Use hover tooltips exclusively.

---

## Number Inputs

- All number inputs use `class="no-spinner"` — no up/down arrows
- CSS hides WebKit and Firefox spinners globally
- Series/Image fields: `type="text"` with `inputmode="numeric"`, 70px, centered

---

## Color Coding for Risk Levels

```css
[data-level="1"], [data-level="2"] { color: var(--success); }   /* Green */
[data-level="3"]                    { color: var(--warning); }   /* Yellow */
[data-level="4"]                    { color: #fb923c; }          /* Orange */
[data-level="5"]                    { color: var(--danger); }    /* Red */
[data-level="6"], [data-level="7"]  { color: var(--danger); }    /* Red (LR-M, LR-TIV) */
```

---

## Validation Badges

Every tool shows a validation status badge next to its name on the landing card and in the tool page hero.

### Placement
- **Tool card** (`src/main.js` `renderCard()`): injected before the tool's display name inside `<h2 class="tool-card__title">`.
- **Tool page hero** (`src/core/tool-name.js`): injected into `.tool-hero__text h1`, inserted *after* the `.tool-hero__ref` link (or at end of h1 if no ref link). Runs in `tool-name.js` so every tool gets it for free without per-tool wiring.

### Sizing (from `src/styles/base.css`)
- `.validation-badge` — 18px × 18px default, `cursor: help`
- `.tool-hero__text .validation-badge` — 22px × 22px, `margin-left: var(--space-sm)` for extra prominence on tool pages
- `.tool-card__title .validation-badge` — 18px, `margin-right: 6px`, `translateY(-1px)` for baseline alignment

### Variants
- **`.validation-badge--warn`** — `color: var(--danger)` (red). Icon: warning triangle with exclamation mark. Hover tooltip: *"Not yet validated. This tool has not been clinically reviewed or tested by the RadioLogicHQ team. Independently verify all scores and recommendations before any clinical use."*
- **`.validation-badge--ok`** — `color: var(--success)` (green). Icon: check circle. Hover tooltip: *"Clinically validated. This tool has been reviewed and tested by the RadioLogicHQ team against its reference literature."*

### Controlling validation status

All validation state lives in a single `VALIDATED_TOOLS` Set in `src/data/tools-registry.js`. Default is empty (all tools unvalidated). To flip a tool to validated:

```js
export const VALIDATED_TOOLS = new Set([
  'tirads',  // add a tool ID here
]);
```

The `isValidated(toolId)` helper reads the set, and `validationBadgeHtml(toolId)` returns the appropriate SVG snippet with the right class, title, and aria-label. Both helpers are exported from `tools-registry.js`. Use `validationBadgeHtml()` anywhere you need to render the badge — don't build the SVG by hand.

### Criteria for flipping a tool to validated

Documented in the comments above `VALIDATED_TOOLS`:
- Unit tests present and passing
- Scoring logic reviewed against the primary reference paper
- Report output reviewed by a practicing radiologist
- Parse rules tested with real-world finding text
- Edge cases and boundary values verified

---

## Responsive (≤768px)

- Layout: single column, report unsticks
- Option grid: `minmax(130px, 1fr)`
- Summary badges stack vertically
- Choice/step buttons wrap
- Ancillary grid: `1fr 1fr`

---

*Update this doc when new patterns emerge or existing ones change.*
