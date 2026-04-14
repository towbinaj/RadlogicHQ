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
