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

Splits text into `right` / `left` regions by classifying each sentence against three regexes in `parser.js`: `BILATERAL_RE`, `RIGHT_RE`, `LEFT_RE`. All three share an **organ anchor list** and must stay in sync — look for the "Organ list is kept in sync" comment when extending.

**Anchor list** (Phase 1 + Phase 2): kidney, adrenal, ovary, breast, lung, hip, side, organ, knee, shoulder, elbow, wrist, ankle, hand, foot, joint, ventricle. Adding a new anchor is a parser.js edit to all three regexes.

**Modifier word:** `RIGHT_RE`/`LEFT_RE` allow one optional word between the side and the anchor via `(?:\w+\s+)?`, so `right lateral ventricle`, `right upper lobe lung`, `left middle lobe` all match. The anchor is still the disambiguator; widening to multiple modifier words raises false-positive risk.

### Bilateral phrasings

`BILATERAL_RE` recognizes six families. Matching sentences produce entries in **both** segments — callers never see a `'bilateral'` key:

| Form | Example |
|---|---|
| Prefix plural | `bilateral kidneys`, `both knees` |
| Adverb | `the kidneys are enlarged bilaterally` |
| Conjunction | `the right and left kidneys` |
| Postposed | `the kidneys each have`, `the knees both show` |
| Copula | `the kidneys are both enlarged` |
| Prepositional | `each of the kidneys`, `both of the breasts` |
| Distributive singular | `each kidney`, `each knee` |

A sentence containing both `right <organ>` and `left <organ>` (conjunction-like, e.g. `"the right and left kidneys both show..."`) is also treated as bilateral via a `hasRight && hasLeft` fallback in `classifySentenceLaterality` after `BILATERAL_RE`.

### Sentence splitter

`splitSentences` splits on `.`/`!`/`?` + whitespace + **uppercase letter**, or on newlines. The uppercase requirement preserves decimals like `"2.5 cm"` (next char lowercase). `"Dr. Smith"` abbreviations can split incorrectly but rarely appear in findings. Tools with non-standard delimiters (semicolons, comma-joined clauses) may miss segmentation — see idiom (d) in section 8 for the fallback.

### Sticky attribution rules

Sentences walked in order with a `currentSide` sticky state:

- **Explicit marker** (`right kidney`, `Left:`) — sets `currentSide`, routes here.
- **No marker** — inherits `currentSide`. If no sticky yet, goes to `ungrouped`.
- **`contralateral` / `the other kidney` / `opposite side`** — flips for **this sentence only**; sticky unchanged.
- **`ipsilateral` / `same side`** — reinforces current sticky.
- **Bilateral sentence** — routes to both sides; does NOT change `currentSide`.

`ungrouped` holds text before the first side-bearing sentence (typical home for report headers like `"CT abdomen with IV contrast"`).

---

## 7. ItemIndex segmenter

Splits text by numbered item markers. `itemLabel` defaults to `'item'` but should match the tool's canonical term (Nodule, Cyst, Lesion, Mass, Observation, Target).

```js
parseSegmentation: { type: 'itemIndex', itemLabel: 'Nodule' }
```

**Three marker forms** recognized by `segmentByItemIndex`:

| Form | Example | Regex |
|---|---|---|
| Explicit | `Nodule 1`, `nodule #1`, `Nodule 1:` | `\b${label}\s*#?\s*(\d+)\s*:?` |
| Word form | `first nodule`, …, `tenth nodule` | `\b(first\|…\|tenth)\s+${label}\b` |
| Numbered line | `1.`, `(2)` at line start | `(?:^\|\n)\s*(?:\((\d+)\)\|(\d+)\.)\s` |

All three produce segments keyed `item-<N>` with `index: N`. Word form is word-bounded so `"the nodule is first seen"` doesn't match. Same-index chunks are merged (concatenated with newline) — useful for follow-up pastes that re-mention a nodule.

### Bare-marker filter idiom

Numbered-line markers (`"1."`, `"2."`) can leak back into `unmatchedSentences` as short fragments. Every item-index handler filters them:

```js
const additional = unmatchedSentences
  .filter((s) => !/^\s*(?:\(\d+\)|\d+\.?)\s*$/.test(s))
  .join(' ');
```

The regex matches only pure whitespace + number; real content is always longer.

---

## 8. Handler idioms

Five canonical parse-handler patterns are in use across the 18 segmented tools. Idiom (a) is the canonical full example below; the other four reference the canonical tool to read when implementing each pattern.

### (a) Item-index drop-in — canonical example

**Used by:** tirads, lirads, lungrads, fleischner, bosniak, pirads, orads. All seven share `items[]` + `activeIndex` + `createItemState(num)` + tab rendering. The handler rebuilds the array from segments.

```js
parseBtn.addEventListener('click', () => {
  const text = parseInput.value.trim();
  if (!text) return;
  const { segments, ungrouped, unmatchedSentences } =
    parseSegmentedFindings(text, toolDefinition);

  if (segments.length > 0) {
    // Multi-item paste: rebuild items[] from segments.
    // Index labels come from seg.index so "Nodule 2" keeps its label
    // even if it's first in the paste.
    items = segments.map((seg) => ({
      id: seg.index,
      label: `${itemName} ${seg.index}`,
      formState: { ...seg.formState },
    }));
    activeIndex = 0;
  } else if (ungrouped.formState && Object.keys(ungrouped.formState).length > 0) {
    // Single-item paste: replace active item's formState.
    const fs = items[activeIndex].formState;
    for (const key of Object.keys(fs)) delete fs[key];
    Object.assign(fs, ungrouped.formState);
  }

  additionalFindingsEl.value = unmatchedSentences
    .filter((s) => !/^\s*(?:\(\d+\)|\d+\.?)\s*$/.test(s))
    .join(' ');

  renderItemTabs();  // MUST come before buildUI() or tabs show stale count
  buildUI();
});
```

**Key points:** replace items (not merge), fall through to ungrouped for single-item pastes, apply the bare-marker filter from section 7, re-render tabs before rebuilding the form. Canonical reference: `src/tools/tirads/tirads.js`.

### (b) Laterality drop-in — state already bilateral

**Used by:** vur, vur-nm, reimers. These tools already tracked per-side state (`rightGrade`/`leftGrade`, `rightM1`/`leftM1`) before segmentation shipped; no refactor, just a new handler.

Shape: clear per-side fields, walk `segments`, route each to `rightX` or `leftX` based on `seg.key`, auto-switch `formState.side` based on what matched (`rightX + leftX → 'bilateral'`, single side → `'right'`/`'left'`). Canonical reference: `src/tools/vur/vur.js` parse handler (commit `c7f6932`).

### (c) Laterality with bilateral state refactor

**Used by:** hydronephrosis, hip-dysplasia, kellgren-lawrence, fetal-ventricle. Tools that started as single-side + toggle and got a full bilateral refactor. Touches five files:

- **`definition.js`** — add `parseSegmentation: { type: 'laterality' }`.
- **`calculator.js`** — add a `bilateral` branch reading per-side fields, returning combined display strings like `"Right: ${rInfo.label}, Left: ${lInfo.label}"` + `bilateral: true` flag.
- **`templates.js`** — use `{{#if fieldX}}…{{/if}}` / `{{#unless bilateral}}…{{/unless}}` conditionals so the same block definitions work for both modes. Typical impression: `'{{#unless bilateral}}{{sideLabel}} {{/unless}}{{gradeLabel}}.'`
- **Tool controller** — formState gains per-side keys alongside the flat ones (flat keys stay as single-side source of truth). `buildUI()` conditionally calls a `buildXCard(title, keyA, keyB)` helper once in single-side mode or twice in bilateral. Side toggle change triggers `buildUI()` (not `update()`) because the card count changes.
- **Handler** — walks segments into per-side keys with a `sidesTouched` Set, then auto-switches `formState.side` and **copies per-side values back to flat fields** when only one side matched (so the single-side UI picks them up).

Canonical reference: `src/tools/hydronephrosis/` — read `definition.js`, `calculator.js`, `templates.js`, and `hydronephrosis.js` back-to-back. Shipped in commit `06c811b`.

### (d) Flow-text bilateral fallback

**Used by:** fetal-ventricle. Dictations like `"Bilateral ventriculomegaly, right 13 mm, left 12 mm."` are one sentence, so the laterality segmenter doesn't split them — result is `segments: []` with `ungrouped.formState.side = 'bilateral'` and only one captured value (the first number).

The fallback scans `ungrouped.text` for side-prefixed measurements when segmentation failed:

```js
if (segments.length === 0 && ungrouped.formState.side === 'bilateral') {
  const rMatch = ungrouped.text.match(/\bright[\s:,]*(\d*\.?\d+)\s*mm/i);
  const lMatch = ungrouped.text.match(/\bleft[\s:,]*(\d*\.?\d+)\s*mm/i);
  if (rMatch) formState.rightWidth = parseFloat(rMatch[1]);
  if (lMatch) formState.leftWidth = parseFloat(lMatch[1]);
  if (rMatch || lMatch) formState.width = null;
}
```

Targeted and tool-specific — a general fix would need semantic parsing. Only fires when segmentation genuinely failed.

### (e) Per-target measurement routing — RECIST family

**Used by:** recist, mrecist, rapno. Oncology response tools with per-target measurements across timepoints (`baseline`, `current`, `nadir`). A paste represents the **current** study; baseline and nadir carry over from prior reports.

Handler routes parsed `size` to `target.current`, leaves `baseline`/`nadir` null, caps at `MAX_TARGETS = 5`, and collects study-level fields (`nonTarget`, `newLesion`, `clinicalStatus`) from the first segment (or `ungrouped`) that has them.

RAPNO additionally extracts bidimensional measurements via a custom transform:

```js
dimensions: {
  pattern: /(\d*\.?\d+)\s*(?:mm)?\s*[x\u00d7]\s*(\d*\.?\d+)\s*mm/,
  group: 0,
  transform: (m) => ({ d1: parseFloat(m[1]), d2: parseFloat(m[2]) }),
}
```

The transform returns an object — `formState[inputId]` accepts any type. Handler routes `dimensions.d1`/`dimensions.d2` to `curD1`/`curD2`. Canonical references: `src/tools/recist/recist.js` + `src/tools/rapno/definition.js`.

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
