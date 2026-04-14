# Parser Reference

Deep reference for `src/core/parser.js` — the paste-to-autofill engine behind every tool's "Parse Findings" button. Read this when adding parser coverage to a new tool, debugging a dictation that isn't filling the right field, or extending the segmenters. `docs/newtool.md` has the minimal opt-in example; `docs/gotchas.md` has the short watch-out list.

---

## 1. Overview

The parser takes free-text (typically a pasted dictation) and populates `formState` by matching against two rule layers:

1. **Auto-generated rules** built by `buildParseRules(definition)` from the tool's declarative structure.
2. **Manual overrides** in `definition.parseRules` for specialized terminology.

Text can optionally be split into per-region segments (by side or item number) before matching — the **segmentation layer**, opt-in per tool.

Two entry points:

- `parseFindings(text, definition)` — whole blob as one region. Used by ~30 single-finding tools.
- `parseSegmentedFindings(text, definition)` — split by `parseSegmentation` config, run `parseFindings` per segment. Used by 18 tools (registry in section 10).

---

## 2. Auto-generated parseRules (`buildParseRules`)

`buildParseRules(def)` walks the definition and derives rules from these fields. Set `parseRules: {}` to get reasonable coverage for free.

| Definition field | Rule shape derived | Example |
|---|---|---|
| `sections[]` with `single-select` options | Keyword rule per option from `option.label` + synonyms | TI-RADS composition, shape |
| `sections[]` with `multi-select` options | `{ multi: true, options: {...} }` | TI-RADS echogenic foci |
| `primaryInputs[]` with `single-select` | Keyword rule from option labels | LI-RADS Couinaud segment |
| `primaryInputs[]` with `float` / `integer` | Regex `/(?:<label>)[:\s]*(\d*\.?\d+)\s*(?:<unit>)?/i` | "size 1.5 cm" |
| `categories[]` with `findings[]` (AAST style) | Multi-select over finding labels under `selectedFindings` | AAST Kidney |
| `categories[]` flat (BI-RADS style) | Single-select under `category` | BI-RADS |
| `grades[]` (VUR style) | Single-select under `grade` | VUR, hydronephrosis |
| `scores[]` (Deauville style) | Rule over labels + interpretations under `score` | Deauville |
| Named option groups (`t2Score`, `dwiScore`, `dce`, …) | Rule under the group's `id` | PI-RADS |
| `sideOptions[]`, `lateralityOptions[]` | Rule under `side` / `laterality` | Any paired tool |
| `modalityOptions[]` | Rule under `modality` | BI-RADS |
| `idrfGroups[].factors[]` | Multi-select under `selectedFactors` | IDRF |

Every derived keyword list is `[label, ...getSynonyms(label)]`.

**Merge semantics:** `mergeRules(auto, manual)` is a shallow `{...auto, ...manual}`. A manual rule for one field key **replaces** the entire auto-gen rule for that key, not just one option's keywords. To extend rather than replace, copy the auto-gen keywords into your manual rule first.

---

## 3. Manual parseRules — rule shapes

Three shapes accepted by `parseFindings`:

### Pattern rule (numeric extraction)

```js
size: {
  pattern: /(\d*\.?\d+)\s*mm/,
  group: 1,
  transform: (m) => parseFloat(m[1]),
}
```

- Match runs via `normalized.match(pattern)` (lowercased text).
- `group` selects the capture group (default 1). `transform` receives the full match object and returns any type (number, string, object — RAPNO's `dimensions` rule returns `{ d1, d2 }`).
- **Use `\d*\.?\d+` not `\d+\.?\d*`** — the former matches both `0.5` and `5`.

### Single-select options (keyword matching, longest wins)

```js
composition: {
  options: {
    cystic: ['cystic or almost completely cystic', 'predominantly cystic', 'cystic'],
    mixed:  ['mixed cystic and solid', 'partially cystic'],
    solid:  ['solid nodule', 'solid'],
  },
}
```

- Parser picks the **longest** substring match across all options combined. `'mixed cystic and solid'` (22 chars) beats bare `'cystic'` (6 chars) even though both match.
- Matching is `normalized.includes(kw.toLowerCase())` — **no word boundaries**. See section 4 for why this matters.
- When adding a short keyword, add an equally-long or longer variant to any competing option first. Canonical pitfall: lungrads/fleischner `'solid nodule'` beating `'part-solid'` — fix in commit `6a0f7dd`.

### Multi-select options (all that match)

```js
anc_hcc: {
  multi: true,
  options: {
    restrictedDiffusion: ['restricted diffusion', 'low adc'],
    mosaicArchitecture:  ['mosaic architecture'],
  },
}
```

- Every option with a matching keyword is collected; value stored as a string array of option IDs.
- AAST `selectedFindings` is the canonical auto-gen multi rule.

### Avoiding substring overlap (negative lookbehind)

When one keyword is a substring of another (`enhanced` inside `unenhanced`), use pattern form with negative lookbehind: `pattern: /(?<!un)\benhanced\b[\s:]*(-?\d+\.?\d*)\s*hu/i`. See `adrenal-washout/definition.js` for the full three-phase contrast pattern and section 11 for the proximity-constraint pitfall.

---

## 4. SYNONYMS dictionary

The `SYNONYMS` const at the top of `parser.js` is a ~123-entry map from **substring key** to **synonym array**:

```js
const SYNONYMS = {
  hypoechoic: ['hypo-echoic', 'hypoechogenic'],
  ultrasound: ['sonography', 'sonographic'],
  present:    ['positive', 'identified', 'seen', 'noted'],
  // ...
};
```

`getSynonyms(label)` adds a key's synonym array to the result when the key is a **substring** of the lowercased label. An option labeled `"Hyperechoic or isoechoic"` picks up synonyms for both `hyperechoic` and `isoechoic` automatically.

### The substring trap

Both synonym lookup and parser rule matching use `.includes()`, so **short initialisms are dangerous**. The old entry `ultrasound: ['us', ...]` fired `'us'` inside `'s(us)picion'`, `'gluteus'`, `'musculus'` — a real BI-RADS regression where "moderate suspicion" auto-set `modality=us`. `'us'` and `'mr'` were removed from SYNONYMS in commit `12e80bc`; tools that need bare abbreviation detection should add a `\b`-bounded regex rule in their own `parseRules`.

### Safety rules for SYNONYMS entries

- **≥4 characters** as a floor. Shorter strings substring-match into too many common words.
- **Prefer multi-word phrases** (`'ground-glass nodule'` over `'ggn'`).
- **Check cross-matches** — `male: ['m', 'boy']` fires on labels containing `'female'` too. Name keys conservatively.
- **Start at the tool level.** Add synonyms to a tool's `parseRules` first; only promote to SYNONYMS when genuinely cross-tool.

Run `npm run check-synonyms -- --all` to audit coverage.

---

## 5. Segmentation overview

Paired organs, multi-nodule workups, and multi-lesion response tools can opt in so a single paste routes each region to the right slot:

```js
parseSegmentation: { type: 'laterality' }
parseSegmentation: { type: 'itemIndex', itemLabel: 'Nodule' }
```

No field → plain `parseFindings`, unchanged behavior.

### `parseSegmentedFindings` return shape

```js
const { segments, ungrouped, unmatchedSentences, remainder } =
  parseSegmentedFindings(text, definition);
```

Each `segments[i]`:

```js
{
  key: 'right' | 'left' | `item-${N}`,
  label: 'Right' | 'Left' | `<itemLabel> <N>`,
  index: N,            // itemIndex only
  text: '<raw>',
  formState, matched, unmatched, remainder,  // parseFindings output
}
```

- `ungrouped` is the same shape (minus `key`/`label`/`index`), holding text before the first marker or with no markers. Used as the single-item/single-side fallback bucket.
- `unmatchedSentences` is an array of sentences where `parseFindings` matched zero rules, built by per-sentence re-parsing. Tools drop these into Additional Findings so clinical context ("CT abdomen performed with IV contrast", negative findings, free-text) is preserved verbatim rather than stripped as parser garbage.

Sections 6–7 cover the two segmenter types; section 8 covers the handler idioms that consume the result.

---

## 6. Laterality segmenter

The laterality segmenter splits text into `right` and `left` regions
by classifying each sentence independently against three regex
patterns at the top of `parser.js`: `BILATERAL_RE`, `RIGHT_RE`,
`LEFT_RE`.

### Organ list

All three regexes share an organ anchor list. A sentence only counts
as "right-sided" or "left-sided" if the side word is followed by an
organ name from this list:

**Abdominal/pelvic/thoracic** (Phase 1): kidney, adrenal, ovary,
breast, lung, hip, side, organ

**MSK joints** (Phase 2 added in commits `ee55036`/`6e6515b`):
knee, shoulder, elbow, wrist, ankle, hand, foot, joint, ventricle

To add a new anchor for a new tool, edit the three regexes together
— they must stay in sync or bilateral detection desyncs from
left/right detection. Look for the "Organ list is kept in sync"
comment in `parser.js`.

### Modifier word between side and organ

`RIGHT_RE` and `LEFT_RE` allow one **optional modifier word** between
the side word and the organ anchor:

```js
/\b(?:the\s+)?right\s+(?:\w+\s+)?(?:kidney|...|ventricle|...)s?\b/
```

This lets natural phrasings match without adding every combination
to the anchor list:

- `right lateral ventricle` ✓ (fetal-ventricle)
- `right upper lobe lung` ✓
- `right main pulmonary artery` — doesn't match because `artery` isn't
  in the anchor list, but `lung` is absent here anyway
- `right arm bone fracture with knee findings` — matches on the
  `knee` anchor, correct for an MSK tool

The anchor word is still the disambiguator. Adding `(?:\w+\s+)?`
widens acceptable phrasings without broadening false-positive risk.

### Bilateral phrasings

`BILATERAL_RE` recognizes six families of "both sides" dictation
patterns. Sentences matching any of these produce entries in **both**
the right and left segments; callers never see a `'bilateral'` key:

| Form | Example |
|---|---|
| Prefix plural | `bilateral kidneys`, `both knees` |
| `bilaterally` adverb | `the kidneys are enlarged bilaterally` |
| Conjunction | `the right and left kidneys`, `left and right breasts` |
| Postposed plural | `the kidneys each have`, `the knees both show` |
| Copula | `the kidneys are both enlarged`, `knees have each` |
| Prepositional | `each of the kidneys`, `both of the breasts` |
| Distributive singular | `each kidney`, `each knee` |

When both `right <organ>` and `left <organ>` appear in the same
sentence as a conjunction ("the right and left kidneys both show
..."), the entire sentence is treated as bilateral. This is checked
**after** `BILATERAL_RE` via a separate `hasRight && hasLeft` fallback
in `classifySentenceLaterality`.

### Sentence splitter

`splitSentences(text)` is the tokenizer. It splits on:

- Period / `!` / `?` followed by whitespace **and an uppercase letter**
- Newlines (any count)

The uppercase-letter requirement is deliberate: it preserves decimal
measurements like `"2.5 cm"` (the next char is lowercase) while still
splitting real sentence boundaries. The cost is that `"Dr. Smith"`
style abbreviations followed by capitalized names will split
incorrectly, but these rarely appear in findings text.

Decimals like `0.5`, `1.2`, `12.5` are always preserved. If a tool
uses non-standard sentence delimiters (e.g., semicolons or comma-
joined clauses for per-side measurements), the segmenter may miss
them — see section 8 idiom (d) for the flow-text fallback pattern.

### Sticky attribution + contralateral flip

Sentences are walked in order, maintaining a `currentSide` sticky
state:

1. A sentence with an **explicit** right/left marker sets
   `currentSide` and gets routed to that side.
2. A sentence with **no marker** inherits `currentSide`. If there's
   no sticky side yet (text before the first marker), the sentence
   goes to `ungrouped`.
3. A sentence with `contralateral`, `the other kidney`, or `the
   opposite side` **flips the side for that sentence only**.
   `currentSide` stays pointing at the previous explicit side, so
   the next plain sentence still inherits the original side — not
   the flipped one.
4. A sentence with `ipsilateral` or `the same side` reinforces
   `currentSide` (routes the sentence there without changing the
   sticky state).
5. A `bilateral` sentence routes to both sides but **does not**
   change `currentSide` — an explicit side later in the text can
   still take over.

`ungrouped` collects everything before the first side-bearing
sentence. This is where report headers like `"CT abdomen performed
with IV contrast"` land, and tools route it to whichever bucket
their handler defines as the default (usually the currently-active
side or a no-op fallback).

---

## 7. ItemIndex segmenter

The item-index segmenter splits text by numbered item markers:

```js
parseSegmentation: { type: 'itemIndex', itemLabel: 'Nodule' }
```

`itemLabel` defaults to `'item'` but should be set to the tool's
canonical term (Nodule, Cyst, Lesion, Mass, Observation, Target).

### Marker patterns

Three marker forms are recognized by `segmentByItemIndex`:

| Form | Example | Regex |
|---|---|---|
| Explicit | `Nodule 1`, `nodule #1`, `Nodule 1:` | `\b${label}\s*#?\s*(\d+)\s*:?` (case-insensitive) |
| Word form | `first nodule`, `second nodule`, ... `tenth nodule` | `\b(first\|second\|...\|tenth)\s+${label}\b` |
| Numbered line | `1.`, `(2)`, `3.` at line start | `(?:^\|\n)\s*(?:\((\d+)\)\|(\d+)\.)\s` |

All three produce segments keyed `item-<N>` with an `index: N` field.
The handler typically maps the index directly to a label like
`Nodule ${seg.index}`.

The word form is case-insensitive and bounded by word boundaries,
so `"the nodule is first seen"` does NOT match (no `first nodule` in
that order).

The numbered-line form is anchored to start-of-text or newline so
inline `"1."` in flowing prose doesn't get mis-segmented. But it
does leak the bare marker (`"1."`, `"2."`) into the downstream
sentence splitter as an extra short sentence — see the bare-marker
filter idiom below.

### Same-index deduping

If the same index appears more than once (e.g., `"Nodule 1: ...
Nodule 1: additional note"`), the two chunks are **merged** into a
single segment for that index, text concatenated with a newline.
This is usually what you want for follow-up pastes where a nodule
is re-mentioned.

### Bare-marker filter idiom

Numbered-line markers (`"1."`, `"2."`) get consumed by the
segmenter but can leak back into `unmatchedSentences` as fragments
that should NOT show up in Additional Findings. Every item-index
handler in the codebase filters them out before joining:

```js
const additional = unmatchedSentences
  .filter((s) => !/^\s*(?:\(\d+\)|\d+\.?)\s*$/.test(s))
  .join(' ');
```

The regex matches any sentence that's nothing but whitespace + a
numbered marker (`"1"`, `"1."`, `"(2)"`). Real content sentences are
always longer than this, so the filter never drops useful text.

---

## 8. Handler idioms

Five canonical parse-handler patterns are in use across the 18
segmented tools. Pick the one that matches your tool's state shape.

### (a) Item-index drop-in

Used by: **tirads, lirads, lungrads, fleischner, bosniak, pirads,
orads**. All seven share a state shape of `items[]` + `activeIndex`
+ `createItemState(num)` factory + tab rendering. The handler
rebuilds the array from segments.

```js
parseBtn.addEventListener('click', () => {
  const text = parseInput.value.trim();
  if (!text) return;
  const { segments, ungrouped, unmatchedSentences } =
    parseSegmentedFindings(text, toolDefinition);

  let matchedFieldCount = 0;

  if (segments.length > 0) {
    // Multi-item paste: rebuild items[] from segments.
    items = segments.map((seg) => ({
      id: seg.index,
      label: `${itemName} ${seg.index}`,
      formState: { ...seg.formState },
    }));
    activeIndex = 0;
    matchedFieldCount = segments.reduce((n, s) => n + s.matched.length, 0);
  } else if (ungrouped.formState && Object.keys(ungrouped.formState).length > 0) {
    // Single-item paste: replace active item's formState (old behavior).
    const fs = items[activeIndex].formState;
    for (const key of Object.keys(fs)) delete fs[key];
    Object.assign(fs, ungrouped.formState);
    matchedFieldCount = ungrouped.matched.length;
  }

  const additional = unmatchedSentences
    .filter((s) => !/^\s*(?:\(\d+\)|\d+\.?)\s*$/.test(s))
    .join(' ');
  additionalFindingsEl.value = additional;
  studyAdditionalFindings = additional;

  renderItemTabs();
  buildUI();
});
```

Key points: **replace** items (not merge), index labels come from
`seg.index` (so "Nodule 2" keeps its label even if it's first in
the paste), fall through to ungrouped for simple single-item pastes.

### (b) Laterality drop-in (state already bilateral)

Used by: **vur, vur-nm, reimers**. These tools already track per-
side state (`rightGrade` / `leftGrade`, `rightM1` / `leftM1`, etc.)
before segmentation was added — no refactor was needed, just a new
parse handler.

```js
parseBtn.addEventListener('click', () => {
  const text = parseInput.value.trim();
  if (!text) return;
  const { segments, ungrouped, unmatchedSentences } =
    parseSegmentedFindings(text, toolDefinition);

  // Replace semantics: clear per-side fields first.
  formState.rightGrade = null;
  formState.leftGrade = null;

  for (const seg of segments) {
    if (seg.key === 'right' && seg.formState.grade) {
      formState.rightGrade = seg.formState.grade;
    } else if (seg.key === 'left' && seg.formState.grade) {
      formState.leftGrade = seg.formState.grade;
    }
  }

  // Auto-switch side mode based on what matched.
  if (formState.rightGrade && formState.leftGrade) {
    formState.side = 'bilateral';
  } else if (formState.rightGrade) {
    formState.side = 'right';
  } else if (formState.leftGrade) {
    formState.side = 'left';
  }

  additionalFindingsEl.value = unmatchedSentences.join(' ');
  buildUI();
});
```

The tool's pre-existing bilateral UI already renders per-side cards,
so no UI changes are needed. Ungrouped fallback (not shown) applies
single-side pastes to whichever side is currently selected.

### (c) Laterality with bilateral state refactor

Used by: **hydronephrosis, hip-dysplasia, kellgren-lawrence,
fetal-ventricle**. These tools started as single-side + toggle and
needed a full refactor to track both sides independently. The
refactor touches five files: `definition.js` (add segmentation),
`calculator.js` (bilateral branch), `templates.js` (conditional
rendering), tool controller (state + UI + handler), and sometimes
the CSS.

**State:** add per-side keys alongside the flat ones so single-side
mode is unchanged:

```js
const formState = {
  grade: null, side: null, aprpd: null,
  rightGrade: null, leftGrade: null,
  rightAprpd: null, leftAprpd: null,
};
```

**UI:** factor the per-side card into a helper that takes the
formState key names, then call it once in single-side mode and twice
in bilateral:

```js
function buildUI() {
  // ... side toggle card

  if (formState.side === 'bilateral') {
    stepContainer.appendChild(buildGradeCard('Right kidney', 'rightGrade', 'rightAprpd'));
    stepContainer.appendChild(buildGradeCard('Left kidney',  'leftGrade',  'leftAprpd'));
  } else {
    stepContainer.appendChild(buildGradeCard('Grade', 'grade', 'aprpd'));
  }
}

function buildGradeCard(title, gradeKey, aprpdKey) {
  // ... reads formState[gradeKey] / formState[aprpdKey]
  // ... writes formState[gradeKey] / formState[aprpdKey] on change
}
```

**Calculator:** add a `bilateral` branch that reads the per-side
fields and returns combined display strings:

```js
if (side === 'bilateral') {
  return {
    gradeLabel: `Right: ${rInfo.label}, Left: ${lInfo.label}`,
    aprpdLabel: `Right ${rightAprpd} mm, Left ${leftAprpd} mm`,
    management: primarySide.management,  // more-severe side drives recommendation
    bilateral: true,
    // ... per-side detail fields for templates that want granular rendering
    rightGradeLabel: rInfo.label,
    leftGradeLabel: lInfo.label,
  };
}
// Single-side branch unchanged.
```

**Templates:** use `{{#if}}` / `{{#unless}}` conditionals so the
same block definitions work for both modes:

```js
// Block template: hides trailing colon when bilateral mode sets
// description to empty string
{ id: 'grade', template: '{{gradeLabel}}{{#if description}}: {{description}}{{/if}}' }

// Impression template: omits sideLabel prefix in bilateral mode
// because gradeLabel already embeds "Right: ..., Left: ..."
const IMP = '{{#unless bilateral}}{{sideLabel}} {{/unless}}{{gradeLabel}}.';
```

**Handler:** routes segment formState to per-side keys, auto-switches
`side`, and copies to flat fields when only one side matched:

```js
const sidesTouched = new Set();
for (const seg of segments) {
  if (seg.key === 'right') {
    if (seg.formState.grade) formState.rightGrade = seg.formState.grade;
    if (seg.formState.aprpd != null) formState.rightAprpd = seg.formState.aprpd;
    sidesTouched.add('right');
  } else if (seg.key === 'left') {
    if (seg.formState.grade) formState.leftGrade = seg.formState.grade;
    if (seg.formState.aprpd != null) formState.leftAprpd = seg.formState.aprpd;
    sidesTouched.add('left');
  }
}

// Auto-switch mode and copy flat fields for single-sided parses.
if (sidesTouched.has('right') && sidesTouched.has('left')) {
  formState.side = 'bilateral';
} else if (sidesTouched.has('right')) {
  formState.side = 'right';
  formState.grade = formState.rightGrade;
  formState.aprpd = formState.rightAprpd;
} else if (sidesTouched.has('left')) {
  formState.side = 'left';
  formState.grade = formState.leftGrade;
  formState.aprpd = formState.leftAprpd;
}
```

Hydronephrosis was the first tool to ship this pattern (commit
`06c811b`) and remains the cleanest reference. Read its four files
back-to-back when doing a bilateral refactor on a new tool.

### (d) Flow-text bilateral fallback

Used by: **fetal-ventricle**. Dictations like `"Bilateral
ventriculomegaly, right 13 mm, left 12 mm."` are one sentence — the
laterality segmenter doesn't split them because the period is at
the end, not between the right and left clauses. The result is
`segments: []` + `ungrouped.formState.side = 'bilateral'` with only
one `width` value captured (the first number).

The fallback pattern scans `ungrouped.text` directly for
side-prefixed measurements when the segmenter missed them:

```js
if (segments.length === 0 && ungrouped.formState.side === 'bilateral') {
  const rMatch = ungrouped.text.match(/\bright[\s:,]*(\d*\.?\d+)\s*mm/i);
  const lMatch = ungrouped.text.match(/\bleft[\s:,]*(\d*\.?\d+)\s*mm/i);
  if (rMatch) formState.rightWidth = parseFloat(rMatch[1]);
  if (lMatch) formState.leftWidth = parseFloat(lMatch[1]);
  if (rMatch || lMatch) formState.width = null;  // clear the misleading flat value
}
```

This is intentionally **targeted and tool-specific** — a general
solution would require a semantic parser or more intrusive
segmenter logic. The fallback only fires when segmentation
genuinely failed and there's clear side-prefixed data in the text.

### (e) Per-target measurement routing (RECIST family)

Used by: **recist, mrecist, rapno**. These oncology response tools
track per-target measurements across timepoints (`baseline`,
`current`, `nadir`). A paste typically represents the **current**
study; baseline and nadir carry over from prior reports.

The handler routes parsed `size` to `current`, leaves `baseline`
and `nadir` null, caps at `MAX_TARGETS = 5`, and collects
study-level fields (`nonTarget`, `newLesion`, `clinicalStatus`)
from wherever they appear:

```js
if (segments.length > 0) {
  targets = segments.slice(0, MAX_TARGETS).map((seg) => ({
    label: `Target ${seg.index}`,
    organ: seg.formState.organ || '',
    baseline: null,
    current: seg.formState.size != null ? seg.formState.size : null,
    nadir: null,
  }));

  // Study-level fields: first-match wins.
  for (const key of ['nonTarget', 'newLesion']) {
    for (const src of [...segments.map((s) => s.formState), ungrouped.formState]) {
      if (src && src[key]) { formState[key] = src[key]; break; }
    }
  }
}
```

RAPNO additionally extracts bidimensional measurements
(`dimensions: { d1, d2 }`) via a custom transform and routes them
to `curD1`/`curD2`. See `src/tools/rapno/definition.js` for the
bidimensional pattern form:

```js
dimensions: {
  pattern: /(\d*\.?\d+)\s*(?:mm)?\s*[x\u00d7]\s*(\d*\.?\d+)\s*mm/,
  group: 0,
  transform: (m) => ({ d1: parseFloat(m[1]), d2: parseFloat(m[2]) }),
}
```

The transform returns an object — the parser doesn't care about the
shape of the returned value, only that it's stored in
`formState[inputId]`.

---

## 9. Testing

Parser tests live in `src/core/parser.test.js` — **79 tests** as of
this writing, covering:

- `parseFindings` basic rules (pattern / options / multi)
- `buildParseRules` auto-generation against sample definitions
- `SYNONYMS` substring expansion
- `extractText` (plain / XML / RadAI structured report formats)
- `splitSentences` edge cases (decimals, newlines, abbreviations)
- `segmentByLaterality` — sticky attribution, contralateral flip,
  interleaved sentence bouncing, partial bilateral, conjunction
  form, postposed/copula/distributive/prepositional bilateral
  phrasings
- `segmentByItemIndex` — explicit / word form / numbered line,
  same-index merging, `itemLabel` configurability
- `parseSegmentedFindings` — the `parseSegmentation` opt-in path
  + per-segment `parseFindings` invocation

**Test-first for segmenter bugs.** Every new segmentation failure
mode that ships should land with a failing test in this file
before the fix lands. The laterality segmenter in particular has
fiddly sentence-classification rules where a regression in one
pattern can silently break a different pattern — the test suite
is the only thing that catches this.

**Run locally:**

```sh
npm run test:run           # full suite (all 165 tests, <1s)
npx vitest parser          # just parser tests
```

**Synonym audit:**

```sh
npm run check-synonyms tirads        # one tool
npm run check-synonyms -- --all       # every tool
```

Reports which labels have synonym coverage and which don't.
Labels with no synonyms still work for parsing (the label itself
is always included as a keyword), but adding synonyms improves
robustness against dictation variants.

---

## 10. Opted-in tool registry

18 tools currently opt in to `parseSegmentation`. Add yours here
when you wire up a new tool.

### Item-index (10 tools)

| Tool | `itemLabel` | Handler idiom | Notes |
|---|---|---|---|
| `tirads` | Nodule | (a) drop-in | First to ship; reference for others |
| `lirads` | Observation | (a) drop-in | Also has benignAssessment manual rules |
| `lungrads` | Nodule | (a) drop-in | Required `part-solid nodule` keyword fix |
| `fleischner` | Nodule | (a) drop-in | Shared parser fix with lungrads |
| `bosniak` | Cyst | (a) drop-in | cm→mm unit transform in size pattern |
| `pirads` | Lesion | (a) drop-in | Auto-gen covers named option groups (t2Score, dwiScore, dce) |
| `orads` | Mass | (a) drop-in | Pelvic ovary-adnexa |
| `recist` | Target | (e) per-target | Sizes → `current`; organ free-text; MAX_TARGETS=5 |
| `mrecist` | Target | (e) per-target | Couinaud segment location; HCC-specific non-target keywords |
| `rapno` | Target | (e) per-target | Bidimensional `dimensions: { d1, d2 }` transform |

### Laterality (8 tools)

| Tool | Per-side state | Handler idiom | Notes |
|---|---|---|---|
| `aast-kidney` | `{ right: {...}, left: {...} }` | Custom (AAST Set handling) | First laterality tool; `selectedFindings` Set conversion |
| `vur` | `rightGrade` / `leftGrade` | (b) drop-in | VCUG variant |
| `vur-nm` | `rightGrade` / `leftGrade` | (b) drop-in | Nuclear medicine variant |
| `reimers` | `rightM1` / `rightM2` / `leftM1` / `leftM2` | (b) drop-in | Already bilateral pre-refactor |
| `hydronephrosis` | Flat + `rightGrade` / `leftGrade` / `rightAprpd` / `leftAprpd` | (c) refactor | Reference for bilateral refactor pattern |
| `hip-dysplasia` | Flat + per-side grade + `rightAlpha` / `leftAlpha` / `rightBeta` / `leftBeta` | (c) refactor | Graf mode only has angles; AAOS doesn't |
| `kellgren-lawrence` | Flat + `rightGrade` / `leftGrade` | (c) refactor | Joint type stays study-level |
| `fetal-ventricle` | Flat + `rightWidth` / `leftWidth` | (c) refactor + (d) fallback | Flow-text fallback for one-sentence bilateral dictations |

### Not segmented (single-item or single-side by design)

Tools that explicitly **don't** want segmentation even though they
have a `side` or `laterality` field:

- `adrenal-washout` — unilateral by clinical convention; side is
  metadata only. Has manual HU extraction rules for the three
  contrast phases with negative-lookbehind on `enhanced` to avoid
  `unenhanced` substring overlap.
- `birads` — single category per assessment by design. Manual
  `laterality` rule picks the first right/left/bilateral mention
  (not longest-match) so "Left breast mass, Right breast negative"
  attributes to the left.

---

## 11. Common pitfalls / FAQ

### "My `parseFindings` call corrupted an AAST tool's state"

`parseFindings` returns `selectedFindings` as an **array**, but
AAST tool `formState` uses a `Set`. Directly `Object.assign`-ing
the parsed result replaces the Set with an array and breaks the
UI's `.has()` checks — a latent bug in most AAST tools that
doesn't fire only because the auto-generated rules rarely match
AAST's long specific finding labels.

**Fix:** convert on the way in.

```js
if (Array.isArray(parsed.selectedFindings)) {
  formState.selectedFindings = new Set(parsed.selectedFindings);
}
```

See `src/tools/aast-kidney/aast-kidney.js` `applyParsedToSide()`
for the canonical implementation.

### "Adding `'us'` as a synonym for Ultrasound broke everything"

This is the incident that led to removing `'us'` and `'mr'` from
SYNONYMS in commit `12e80bc`. The parser uses substring matching,
not word boundaries, so `'us'` fires inside `'s(us)picion'`,
`'gluteus'`, `'musculus'`, `'fibr(us)'`, and many other common
words.

**Don't add short initialisms to SYNONYMS.** If your tool
genuinely needs to detect bare `"US"` or `"MR"` in dictations,
add a regex-pattern rule with explicit `\b` boundaries in the
tool's own `parseRules`:

```js
modality: {
  pattern: /\bUS\b(?!\w)/,    // Word-bounded "US"
  transform: () => 'us',
}
```

### "Longest-match picked the wrong option"

Longest-match is calculated across **all options in a single
rule**. If option A has a keyword `'solid nodule'` (12 chars) and
option B has `'part-solid'` (10 chars), parsing `"part-solid
nodule"` picks A — the longer keyword wins even though the
shorter one is semantically more specific.

This bit lungrads and fleischner during Batch A rollout when
`"part-solid nodule"` dictations were parsed as `solid` instead
of `partSolid`. The fix was to add a longer keyword to partSolid:

```js
partSolid: [
  'part-solid nodule',  // 17 chars — longer than 'solid nodule' (12)
  'part solid nodule',
  'part-solid',
  'part solid',
],
```

**General rule:** when you add a keyword that's a substring of a
keyword in a competing option, add an equally-long or longer
variant to the correct option first.

### "Bare `'cystic'` now matches inside `'mixed cystic and solid'`"

This one's safe because of the same longest-match rule. TI-RADS
has:

```js
cystic: ['cystic or almost completely cystic', 'predominantly cystic', 'cystic'],
mixed:  ['mixed cystic and solid', 'partially cystic'],
```

Parsing `"mixed cystic and solid nodule"` finds:

- `'cystic'` (6 chars) in the `cystic` option ✓
- `'mixed cystic and solid'` (22 chars) in the `mixed` option ✓

Longest wins → `mixed`. Bare `cystic` only triggers when nothing
longer matches (e.g., `"1.5 cm cystic nodule"` → `cystic`). This
is the TI-RADS "cystic gap fix" from commit `7a40ffd`.

The inline comment in `src/tools/tirads/definition.js` documents
this invariant explicitly so future editors don't accidentally
shorten the competing keywords.

### "My HU extraction rule is matching numbers across commas"

Adrenal-washout's three HU phases (`unenhanced`, `enhanced`,
`delayed`) need tight proximity constraints between the phase
label and the number, or they match across phrase boundaries.

**Wrong:**

```js
unenhanced: {
  pattern: /\b(?:unenhanced|...)\b[\s:]*(-?\d+)\s*hu|(-?\d+)\s*hu\s*,?\s*(?:on\s+)?\bunenhanced\b/i,
  //                                                        ^^^^^^^
  // This allows comma + whitespace between the number and the label,
  // so "8 HU, portal venous" leaks the "8" into the unenhanced bucket
  // because "8 HU, ... unenhanced" still matches.
}
```

**Right:** require whitespace-only connection in the number → label
branch (no comma separator):

```js
unenhanced: {
  pattern: /\b(?:unenhanced|...)\b[\s:]*(-?\d+)\s*hu|(-?\d+)\s*hu\s+(?:on\s+|at\s+)?\bunenhanced\b/i,
  //                                                        ^^^
  // \s+ only, no comma; phrase-level proximity preserved.
}
```

See `src/tools/adrenal-washout/definition.js` for the full three-
phase pattern set and commit `43f89d5` for the incident history.

### "My parse handler rebuilds the state array and the tabs don't update"

After the handler finishes, you need to call both `renderItemTabs()`
and `buildUI()` (in that order). A common regression is forgetting
the tab re-render — the state is correct but the tab row still
shows the old count. See any of the idiom-(a) tools for the
canonical ending:

```js
renderItemTabs();
buildUI();
```

### "The laterality segmenter isn't picking up my tool's organ"

The organ list in `RIGHT_RE` / `LEFT_RE` / `BILATERAL_RE` is a
fixed vocabulary. Sentences like `"Right wrist: Grade 2"` won't
segment if `wrist` isn't in the list.

**Fix:** add the anchor to all three regexes (search for "Organ
list is kept in sync" in `parser.js`). Add a failing test in
`src/core/parser.test.js` for the new anchor first, then update
the regex until it passes. The Phase 2 MSK rollout (knee /
shoulder / elbow / wrist / ankle / hand / foot / joint / ventricle)
is the canonical reference for this.

### "The modifier word regex lets through too much"

`(?:\w+\s+)?` between the side word and the organ anchor allows
**one** optional word. This is deliberately narrow — two or more
intervening words won't match. Phrases like `"right posterior
upper lobe lung"` would not be recognized as right-sided without
additional tweaks.

If a tool genuinely needs multi-word modifiers, widen the regex
to `(?:\w+\s+){0,3}?` (non-greedy, up to 3 words). Test carefully:
widening raises false-positive risk for unrelated sentences that
happen to contain both a side word and an organ anchor far apart.
