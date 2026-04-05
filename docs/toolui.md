# Tool UI Style Guide

Reference this when styling new tools to maintain visual consistency across RadioLogicHQ. All values use CSS variables from `src/styles/variables.css`. Shared styles live in `src/styles/forms.css`.

*Last updated: 2026-04-05*

---

## Shared vs Tool-Specific CSS

**`src/styles/forms.css`** contains ALL shared styles:
- Report output component (header, text, controls, edit bar, editable lines, toast)
- Hero bar (layout, title, ref link, summary badges)
- Study findings, parse panel
- Unit toggle (mm/cm), no-spinner class
- Form controls (inputs, selects, textareas, buttons)

**`src/tools/{toolId}/{toolId}.css`** contains ONLY tool-specific styles:
- Level badge colors
- Section/card grid styles
- Step wizard styles (decision-tree tools)
- Ancillary feature grid
- Compact mode overrides (point-based tools)

**Never duplicate shared styles in tool CSS.**

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
- **Badge**: inline, `var(--space-xs) var(--space-md)` padding, label + value in a row
- **Badge label**: `var(--text-xs)`, uppercase, muted
- **Badge value**: `var(--text-lg)`, weight 700

---

## Multi-Item Tabs

- **Layout**: flex row, 4px gap, bottom border
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
- **Grid**: `repeat(auto-fill, minmax(100px, 1fr))`, 4px gap
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
- **Layout**: flex row, wrap, 4px gap
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

### Report Text
- **Padding**: `var(--space-sm) var(--space-md)`, max-height 400px scrollable
- **Font**: `var(--font-mono)`, `var(--text-sm)`, `line-height: 1.6`, `pre-wrap`

### Edit Mode (WYSIWYG)
- Report text becomes editable lines: drag handle + checkbox + contenteditable text
- Edit bar below: "Show points" toggle, Reset to Default, Done

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

## Responsive (≤768px)

- Layout: single column, report unsticks
- Option grid: `minmax(130px, 1fr)`
- Summary badges stack vertically
- Choice/step buttons wrap
- Ancillary grid: `1fr 1fr`

---

*Update this doc when new patterns emerge or existing ones change.*
