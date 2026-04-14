# Parser Reference

Deep reference for `src/core/parser.js` — the paste-to-autofill engine
that powers every tool's "Parse Findings" button. Read this when:

- Adding parser coverage to a new tool
- Debugging why a dictation isn't filling the right field
- Extending the laterality or item-index segmenters
- Writing manual `parseRules` for specialized terminology

For the short version, `docs/newtool.md` has the minimal opt-in
example and `docs/gotchas.md` has the watch-out list. This file is
the full picture.

---

## 1. Overview

The parser takes a blob of free-text (typically a pasted dictation)
and populates a tool's `formState` by matching against two layers of
rules:

1. **Auto-generated rules** built by `buildParseRules(definition)`
   from the tool's declarative definition — labels, options, synonyms.
2. **Manual overrides** in the tool's `definition.parseRules` that
   add specialized terminology the auto-generator can't derive.

Text can optionally be split into per-region segments first (by side
or by item number) so each region's parsed result routes to a
separate part of the tool's state. This is the **segmentation layer**
and is opt-in per tool.

Two entry points live in `parser.js`:

- `parseFindings(text, definition)` — parse the whole blob as one
  region. Used by ~30 single-organ / single-finding tools.
- `parseSegmentedFindings(text, definition)` — split by the tool's
  `parseSegmentation` config, then run `parseFindings` per segment.
  Used by 18 tools (see the registry in section 10).

Both return a result shape that the tool's parse-button handler
consumes. See section 8 for the five canonical handler idioms in use.

---

## 2. Auto-generated parseRules (`buildParseRules`)

`buildParseRules(def)` walks the definition and derives parse rules
from the following fields. Tools that don't need specialized
terminology can set `parseRules: {}` and get reasonable coverage for
free.

| Definition field | Rule shape derived | Example |
|---|---|---|
| `sections[]` with `single-select` options | Keyword rule per option, values from `option.label` + synonyms | TI-RADS composition, shape, margin |
| `sections[]` with `multi-select` options | `{ multi: true, options: {...} }` — matches all found | TI-RADS echogenic foci |
| `primaryInputs[]` with `single-select` | Keyword rule from option labels | LI-RADS Couinaud segment |
| `primaryInputs[]` with `float` / `integer` | Regex `/(?:<label>)[:\s]*(\d*\.?\d+)\s*(?:<unit>)?/i` | "size 1.5 cm" |
| `categories[]` with `findings[]` (AAST style) | Multi-select rule over all finding labels under `selectedFindings` | AAST Kidney |
| `categories[]` flat list (BI-RADS style) | Single-select rule under `category` | BI-RADS |
| `grades[]` (VUR style) | Single-select rule under `grade` | VUR, hydronephrosis |
| `scores[]` (Deauville style) | Rule over labels + interpretations under `score` | Deauville |
| Named option groups (`t2Score`, `dwiScore`, `dce`, …) | Rule under the group's `id` | PI-RADS |
| `sideOptions[]`, `lateralityOptions[]` | Rule under `side` / `laterality` | Any paired tool |
| `modalityOptions[]` | Rule under `modality` | BI-RADS modality |
| `timingOptions[]` | Rule under `timing` | — |
| `idrfGroups[].factors[]` | Multi-select rule over factor labels under `selectedFactors` | IDRF |

Every derived keyword list is `[label, ...getSynonyms(label)]` — the
label itself plus any synonyms the SYNONYMS dictionary adds for
substrings of that label.

`parseRules` (manual) overrides auto-generated rules on the same
field key via `mergeRules(auto, manual)` — hand-written wins. This
is why ~36 tools mix auto-gen for most fields with a small manual
override for one or two specialized rules.

**Rule merge semantics:** the merge is a shallow `{...auto, ...manual}`
so a manual rule for `composition` replaces the entire auto-generated
rule, not just one option's keywords. If you want to extend rather
than replace, copy the auto-gen keywords into your manual rule and
add to them.

---

## 3. Manual parseRules — rule shapes

Three rule shapes are accepted by `parseFindings`:

### Pattern rule (numeric extraction)

```js
size: {
  pattern: /(\d*\.?\d+)\s*mm/,
  group: 1,
  transform: (m) => parseFloat(m[1]),
}
```

- `pattern` is a JS regex. Match is run via `normalized.match(pattern)`
  where `normalized` is the lowercased extracted text.
- `group` selects the capture group to read (defaults to 1).
- `transform` receives the full match object `m` and returns the
  final value. Use it for `parseFloat` / `parseInt` / unit conversion
  (e.g., cm→mm) / returning a composite object.
- **Use `\d*\.?\d+` not `\d+\.?\d*`** — the former correctly matches
  both `0.5` and `5`; the latter fails on `0.5`.
- The transform can return any type (number, string, object). The
  RAPNO `dimensions` rule returns `{ d1, d2 }` for example.

### Single-select options rule (keyword matching, longest wins)

```js
composition: {
  options: {
    cystic: ['cystic or almost completely cystic', 'predominantly cystic', 'cystic'],
    mixed:  ['mixed cystic and solid', 'partially cystic'],
    solid:  ['solid nodule', 'solid'],
  },
}
```

- Each option's value is an array of keyword strings.
- Parser tries every keyword across every option and picks the
  **longest** substring match across all options combined. This is
  the "longest-match wins" rule that disambiguates overlapping
  keywords (e.g., `'mixed cystic and solid'` at 22 chars beats bare
  `'cystic'` at 6 chars even though both substrings are present).
- If you add a short keyword and a longer competing phrase exists
  elsewhere, add an equally-long or longer variant to the right
  option so longest-match still picks correctly. See the
  lungrads/fleischner `part-solid nodule` fix as a canonical
  example of this failure mode.
- Substring matching is `normalized.includes(keyword.toLowerCase())`
  — **no word boundaries**. See section 4 for why this matters.

### Multi-select options rule (all that match)

```js
anc_hcc: {
  multi: true,
  options: {
    restrictedDiffusion: ['restricted diffusion', 'low adc'],
    mosaicArchitecture: ['mosaic architecture', 'mosaic appearance'],
  },
}
```

- `multi: true` flips the rule to multi-match — every option whose
  keyword list matches the text gets added to a returned array.
- Values stored in `formState[inputId]` as a string array of option IDs.
- AAST `selectedFindings` is the canonical auto-generated multi rule.

### Pattern-with-negative-lookbehind (avoiding substring overlap)

When one keyword is a substring of another (e.g., `enhanced` inside
`unenhanced`), use a negative lookbehind in the pattern form:

```js
enhanced: {
  pattern: /(?<!un)\benhanced\b[\s:]*(-?\d+\.?\d*)\s*hu/i,
  group: 1,
  transform: (m) => parseFloat(m[1]),
}
```

This is used extensively in `adrenal-washout/definition.js` to
separate the three contrast phases. See section 11 for the full
proximity/ordering story from that tool.

---

## 4. SYNONYMS dictionary

The `SYNONYMS` const at the top of `parser.js` is a ~123-entry map
from **substring key** to **synonym array**:

```js
const SYNONYMS = {
  hypoechoic: ['hypo-echoic', 'hypoechogenic'],
  ultrasound: ['sonography', 'sonographic'],
  present:    ['positive', 'identified', 'seen', 'noted', 'demonstrated'],
  // ...
};
```

`getSynonyms(label)` iterates every key and adds that key's synonym
array to the result if the key is a **substring** of the lowercased
label. So an option labeled `"Hyperechoic or isoechoic"` picks up
synonyms for both `hyperechoic` and `isoechoic` automatically.

### The substring trap (us / mr removal)

Because both the synonym keyword matching AND the parser's rule
matching use substring (`.includes()`), **short initialisms are
dangerous**. The entry

```js
ultrasound: ['us', 'sonography', 'sonographic']
```

would cause any tool with "Ultrasound" in an option label to inherit
`'us'` as a keyword. Then the parser's substring match on `'us'`
would fire inside `'s(us)picion'`, `'gluteus'`, `'musculus'`,
`'fibr(us)'`, etc. — the BI-RADS tool surfaced this when a dictation
mentioning "moderate suspicion" auto-set modality to `us`.

`'us'` and `'mr'` were removed from the SYNONYMS dict in commit
`12e80bc`. Tools that genuinely need to detect the bare `"US"` or
`"MR"` abbreviations should add a regex rule with explicit `\b`
boundaries to their own `parseRules`, not synonyms.

### Rules for adding new SYNONYMS entries safely

1. **Keywords must be ≥4 characters** as a floor. Shorter strings
   substring-match into too many common words.
2. **Prefer multi-word phrases** over bare terms. `'ground-glass
   nodule'` is safer than `'ggn'`; `'portal venous phase'` is safer
   than `'pv'`.
3. **Check cross-matches** — your new key is a substring too, so it
   fires on every label that contains it. The `male: ['m', 'boy']`
   entry activates on labels like `'female'` and `'hemale'`. Name
   the key conservatively.
4. **Add synonyms at the tool level first** via manual `parseRules`.
   Only promote to SYNONYMS when the synonym is genuinely cross-tool
   (e.g., every tool with "hypoechoic" wants "hypo-echoic" as an
   alias).
5. **Run `npm run test:run`** — the parser tests exercise many real
   dictations and will catch obvious regressions.
6. **Run `npm run check-synonyms -- --all`** — audits every tool's
   synonym coverage and reports which labels have no synonyms.

---

## 5. Segmentation overview

Tools that track more than one independent finding set — paired
organs, multi-nodule workups, multi-lesion response assessment —
opt in to the **segmentation layer** so a single paste routes each
region to the right slot.

### Opt-in

Add `parseSegmentation` to the definition:

```js
// Laterality (paired organs)
parseSegmentation: { type: 'laterality' }

// Item-index (multi-item)
parseSegmentation: { type: 'itemIndex', itemLabel: 'Nodule' }
```

No field → the tool falls back to plain `parseFindings` and behaves
exactly as before.

### The `parseSegmentedFindings` API

```js
const {
  segments,           // array — one per detected region
  ungrouped,          // single — text before first marker / no marker
  unmatchedSentences, // array — sentences where parser matched zero rules
  remainder,          // legacy — combined remainder string
} = parseSegmentedFindings(text, definition);
```

Each `segments[i]` looks like:

```js
{
  key: 'right' | 'left' | `item-${N}`,
  label: 'Right' | 'Left' | `<itemLabel> <N>`,
  index: N,            // present for itemIndex only
  text: '<raw segment text>',
  formState: { ... },  // parseFindings output on this segment's text
  matched: [...],
  unmatched: [...],
  remainder: '...',
}
```

`ungrouped` is the same shape minus `key`/`label`/`index`. It holds
text that appeared before the first side marker or that had no
markers at all. Tools use it as the fallback bucket for simple
single-side / single-item pastes.

`unmatchedSentences` is built by running each sentence through
`parseFindings` independently and collecting the ones with zero
matches. Tools drop these into Additional Findings so clinical
context ("CT abdomen and pelvis with IV contrast", negative
findings, free-text observations) is preserved verbatim rather than
stripped as parser garbage.

Sections 6 and 7 cover the two segmenter types in detail. Section 8
covers the handler idioms that consume the returned shape.

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
