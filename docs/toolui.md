# Tool UI Style Guide

Reference this when styling new tools to maintain visual consistency across RadlogicHQ. All values use CSS variables from `src/styles/variables.css`.

*Last updated: 2026-04-05*

---

## Page Layout

- **Two-column grid**: `3fr 2fr` — input column wider than output column
- **Column gap**: `var(--space-md)` (16px)
- **Report output**: sticky, stays visible while scrolling input column

```css
.tool-layout {
  grid-template-columns: 3fr 2fr;
  gap: var(--space-md);
}
.tool-layout__output {
  position: sticky;
  top: var(--space-lg);
}
```

---

## Hero Bar

- **Layout**: flex row, title left, score/level badges right
- **Title**: `var(--text-xl)` (1.25rem), weight 600
- **Reference link**: superscript, `var(--text-xs)`, accent color, full citation in `title` tooltip
- **Summary badges**: inline, `var(--space-xs) var(--space-md)` padding, border, flex row with label + value
- **Badge label**: `var(--text-xs)`, uppercase, muted color
- **Badge value**: `var(--text-lg)`, weight 700

```css
.tool-hero { padding: var(--space-md) 0 var(--space-sm); }
.tool-hero__text h1 { font-size: var(--text-xl); }
.tool-hero__ref { font-size: var(--text-xs); vertical-align: super; color: var(--text-accent); }
```

---

## Item Tabs (Nodule 1, Nodule 2, +, −)

- **Tab bar**: flex row, 4px gap, bottom border, `var(--space-sm)` vertical padding
- **Tab buttons**: `var(--text-sm)`, weight 500, surface background, border
- **Active tab**: white text, accent background
- **Add button**: dashed border, success color
- **Remove button**: dashed border, danger color, `margin-left: auto`
- **Rename**: double-click tab to rename

---

## Primary Inputs (Side, Size)

- **Layout**: flex row, `var(--space-md)` gap, `align-items: end`
- **Card padding**: `var(--space-sm) var(--space-md)` — compact height
- **Labels**: `var(--text-sm)`, weight 600, `var(--text-primary)` color
- **Inputs**: `var(--text-sm)` font size
- **Same visual weight as section labels** — consistent typography

---

## Score Sections (Finding Cards)

### Container Spacing
- **Between sections**: `var(--space-sm)` (8px) gap via `.sections-container`
- **Between primary inputs and sections**: `var(--space-sm)` gap via `#tool-input`
- **Section padding**: `var(--space-sm) var(--space-md)` (8px 16px)

### Section Header
- **Layout**: flex row, title left (`margin-right: auto`), points badge right
- **Title**: `var(--text-sm)`, weight 600
- **Points badge**: `var(--text-xs)`, muted bg, transitions to accent when has points
- **Drag handle**: `var(--text-sm)`, opacity 0 → 0.6 on section hover, `cursor: grab`
- **Header bottom margin**: `var(--space-sm)`

### Option Cards Grid
- **Grid**: `repeat(auto-fill, minmax(100px, 1fr))`, 4px gap
- **Card**: `var(--bg-input)` background, 2px transparent border, `var(--radius-md)` corners
- **Card hover**: border becomes `var(--border-color)`, bg becomes `var(--bg-elevated)`
- **Card selected**: border `var(--accent)`, bg `var(--accent-subtle)`

### Option Card Images
- **Height**: 56px fixed
- **Background**: `var(--bg-primary)` (matches empty placeholder)
- **Image padding**: 2px
- **Empty placeholder**: same `var(--bg-primary)` background, no text

### Option Card Body
- **Padding**: `4px var(--space-sm)`
- **Layout**: flex row, `align-items: baseline`
- **Label**: `var(--text-xs)`, weight 500, `line-height: 1.2`, `flex: 1`
- **Points**: `0.65rem`, muted color, weight 600, `white-space: nowrap`
- **Selected points**: accent color

---

## Show/Hide Images Toggle

- **Position**: inline link between primary inputs and first score section
- **Font**: `var(--text-xs)`, accent color
- **Alignment**: `text-align: right`
- **No border/background** — just a text link
- **Hover**: opacity 0.8, underline

---

## Compact Mode (`body.compact`)

- **Images hidden**: `.option-card__image { display: none }`
- **Grid**: `1fr 1fr` (two columns)
- **Card gap**: 3px
- **Card radius**: `var(--radius-sm)`
- **Card body padding**: `3px var(--space-sm)`
- **Section padding**: `var(--space-xs) var(--space-sm)`
- **Description hidden**
- **Layout columns**: `1fr 1fr` (equal split)

---

## Report Output Panel

### Header
- **Padding**: `var(--space-sm) var(--space-md)`
- **Background**: `var(--bg-secondary)`
- **Title**: `var(--text-base)`, weight 600
- **Controls**: flex row, `var(--space-sm)` gap
- **Template selector**: `var(--text-sm)`, min-width 140px

### Report Text
- **Padding**: `var(--space-sm) var(--space-md)`
- **Max height**: 400px, scrollable
- **Font**: `var(--font-mono)`, `var(--text-sm)`, `line-height: 1.6`
- **White space**: `pre-wrap`

### Edit Mode (WYSIWYG)
- **Editable lines**: flex row, 3px vertical padding, transparent bottom border
- **Drag handle**: `var(--text-base)`, muted color, 14px width
- **Toggle checkbox**: flex-shrink 0
- **Editable text**: `var(--font-mono)`, `var(--text-sm)`, 1px transparent border
- **Text focus**: accent border, `var(--bg-input)` background
- **Empty/conditional**: muted color, italic

### Edit Bar
- **Background**: `var(--bg-secondary)`
- **Padding**: `var(--space-sm) var(--space-md)`
- **"Show points" toggle**: `var(--text-xs)`, secondary color, `margin-right: auto`
- **Hint text**: `var(--text-xs)`, muted color

### Copy Toast
- **Position**: fixed, bottom-right
- **Background**: `var(--success)`
- **Animation**: opacity 0→1, translateY 10px→0

---

## Additional Findings (Study-Level)

- **Label**: `var(--text-sm)`, weight 600, primary color — **must match section label style**
- **Textarea**: `var(--text-sm)`, no placeholder text
- **Card padding**: `var(--space-sm) var(--space-md)`

---

## Parse Panel

- **Position**: below report output, `margin-top: var(--space-md)`
- **Label**: `var(--text-sm)`, weight 600, primary color
- **Textarea**: `var(--text-sm)`, 3 rows, placeholder "Paste report text to auto-fill..."
- **Parse button**: `var(--text-xs)` font, `var(--space-xs) var(--space-md)` padding, primary style
- **Status text**: `var(--text-xs)`, muted → success color on match

---

## Typography Consistency Rules

All labels across the tool must have the same visual weight:

| Element | Font Size | Weight | Color |
|---------|-----------|--------|-------|
| Section titles | `var(--text-sm)` | 600 | `var(--text-primary)` |
| Primary input labels | `var(--text-sm)` | 600 | `var(--text-primary)` |
| Additional Findings label | `var(--text-sm)` | 600 | `var(--text-primary)` |
| Paste Findings label | `var(--text-sm)` | 600 | `var(--text-primary)` |
| Option card labels | `var(--text-xs)` | 500 | `var(--text-primary)` |
| Points text | `0.65rem` | 600 | `var(--text-muted)` |
| Descriptions | `var(--text-xs)` | 400 | `var(--text-muted)` |

---

## Drag-and-Drop Conventions

- **Drag handle**: ≡ character, appears on hover (opacity transition)
- **Dragging state**: opacity 0.3 (form sections) or 0.2 (report lines)
- **Dragover state**: accent border highlight
- **Drop**: reorders array, re-renders, persists to localStorage
- **Bidirectional sync**: form section reorder ↔ report block reorder

---

## Color Coding for Risk Levels

Use data attributes on level badges and apply colors:

```css
[data-level="1"], [data-level="2"] { color: var(--success); }   /* Green — benign/not suspicious */
[data-level="3"]                    { color: var(--warning); }   /* Yellow — mildly suspicious */
[data-level="4"]                    { color: #fb923c; }          /* Orange — moderately suspicious */
[data-level="5"]                    { color: var(--danger); }    /* Red — highly suspicious */
```

Adapt the scale per tool (e.g., BI-RADS, LI-RADS may have different level counts).

---

## Responsive (≤768px)

- Layout switches to single column
- Report output unsticks
- Option grid: `minmax(130px, 1fr)`
- Summary badges stack vertically
- Report header stacks vertically
