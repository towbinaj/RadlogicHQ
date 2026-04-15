# Test Discipline Reference

How RadioLogicHQ tests work, when to write tests, and the test-first rule for parser changes. This doc is the authoritative reference for test-writing behavior in this codebase. **Section 10 is the hard rule — read it first** if you're about to edit `src/core/parser.js`, a tool's `definition.js` parseRules, or a `calculator.js`.

---

## 1. Overview

Tests live in two places:

- **Core tests** in `src/core/*.test.js` — engine, parser, clipboard, pill-editor
- **Per-tool calculator tests** in `src/tools/<toolId>/calculator.test.js` — co-located with the `calculator.js` they test

Current state: **165 tests across 8 files** (`npm run test:run`). All tests use [Vitest](https://vitest.dev).

The test suite is the **only** safety net for parser regressions. There's no CI test gate yet, no pre-commit hook, and no end-to-end coverage — just the unit tests. That means:

1. Running `npm run test:run` before committing is the baseline discipline.
2. **Adding new tests when you change things** is the discipline that prevents silent regressions. Section 3 covers when this is required; section 10 states the hard rule.

---

## 2. Running tests

```sh
npm run test:run                      # full suite, single pass, ~1s
npm run test                          # watch mode (for TDD)
npx vitest src/core/parser            # just parser tests
npx vitest src/tools/tirads           # just one tool
npx vitest -t "bilateral"             # tests matching a pattern
npm run check-synonyms <toolId>       # synonym coverage audit for one tool
npm run check-synonyms -- --all       # audit every tool
```

Expected output: `Test Files  8 passed (8)` and `Tests  165 passed (165)`. Anything less means something broke.

**Before every commit** (enforced by convention, not by hook):

1. `npm run test:run` — must show 165/165 (or current full count)
2. `npm run build` — must complete cleanly

If you added tests, the count goes up. If the count went *down*, you accidentally removed tests — don't commit.

---

## 3. When to write a test

Not every change needs a test. Use this decision table.

| Change type | Test required? | Where | Discipline |
|---|---|---|---|
| New tool (new `calculator.js`) | **Yes** | New `calculator.test.js` co-located | Boundary cases + each risk category |
| Calculator logic change | **Yes** | Existing `calculator.test.js` (create if missing) | Cover the new branch |
| `src/core/parser.js` regex / segmenter / SYNONYMS edit | **Yes — test-first** | `parser.test.js` | Failing test before the fix lands |
| New tool `parseRules` (manual) | **Yes** | Tool's `calculator.test.js` or `parser.test.js` | Real-dictation sanity case |
| Bilateral state refactor | **Yes** | Tool's `calculator.test.js` | Both single-side and bilateral paths |
| New template block | No (manual browser check) | — | — |
| UI / CSS only | No (manual browser check) | — | — |
| Report template text change (HL7-safe) | No | — | Grep test for forbidden chars in `clipboard.test.js` |
| Docs-only | No | — | — |
| Dependency upgrade | No (CI would catch) | — | Run full suite + `npm audit` |
| Auth / Firestore wiring | No (integration-scoped) | — | Manual e2e in staging |

**The three always-required cases** are parser edits, new tools, and calculator logic changes. Everything else is judgment.

**Why test-first for parser.js specifically:** the segmenter's sentence-classification rules have subtle interactions — a regex tweak for one tool's dictation can silently break another tool's pattern. The test suite catches this, but only if the regression is encoded as a test. See section 10 for the hard rule and section 5 for how to write parser tests.

---

## 4. Test file layout

```
src/
├── core/
│   ├── engine.js
│   ├── engine.test.js          # 12 tests — point scoring, rule merging
│   ├── parser.js
│   ├── parser.test.js          # 79 tests — rules, segmenters, SYNONYMS
│   ├── clipboard.js
│   └── clipboard.test.js       # 20 tests — HL7 char sanitization
└── tools/
    ├── tirads/
    │   ├── calculator.js
    │   └── calculator.test.js  # 18 tests — TR levels, size thresholds
    ├── bosniak/
    │   └── calculator.test.js  # 10 tests
    ├── nascet/calculator.test.js    # 9
    ├── reimers/calculator.test.js   # 8
    └── aast-liver/calculator.test.js # 9
```

**Conventions:**

- **Co-location:** a tool's tests live next to the code they test, not in a separate `__tests__/` directory. When you refactor `calculator.js`, `calculator.test.js` is right there to update.
- **One `.test.js` per source file.** Don't split tests for `calculator.js` across multiple files.
- **Tool tests test `calculator.js`**, not the whole tool. UI / DOM / rendering is out of scope for unit tests — those are manual browser checks.
- **Parser tests live in `parser.test.js`**, not in per-tool files. A dictation-sanity test for TI-RADS lives in `parser.test.js` with other parser cases, using the tirads definition as input. This centralizes the parser test surface and makes it easy to verify that a change didn't break an unrelated tool.
- **File naming:** `calculator.test.js` for unit tests; `*.test.js` for core tests (no `.spec.js`, no `.test.jsx`).

Vitest auto-discovers files matching `**/*.test.js` — no config needed when adding a new file.

---

## 5. Writing parser tests

Parser tests live in `src/core/parser.test.js` and import from `./parser.js`:

```js
import { describe, it, expect } from 'vitest';
import {
  parseFindings,
  buildParseRules,
  parseSegmentedFindings,
  segmentByLaterality,
  segmentByItemIndex,
} from './parser.js';
```

Three kinds of parser tests to write, depending on what you're changing.

### 5a. Dictation-driven sanity tests (for new parseRules)

Use **real radiology text** — not synthetic strings — as the input. The parser is meant to handle actual dictations, so test data should reflect them.

Canonical pattern: import the tool definition, run `parseFindings` or `parseSegmentedFindings` against a dictation, assert on `formState` keys.

```js
import { tiradsDefinition } from '../tools/tirads/definition.js';

describe('TI-RADS parser integration', () => {
  it('parses a multi-nodule dictation into per-nodule segments', () => {
    const text =
      'Nodule 1: 2.5 cm solid hypoechoic nodule in the right lobe, ' +
      'taller-than-wide, with punctate echogenic foci. ' +
      'Nodule 2: 1.2 cm spongiform lesion in the left lobe.';
    const r = parseSegmentedFindings(text, tiradsDefinition);
    expect(r.segments).toHaveLength(2);
    expect(r.segments[0].formState).toMatchObject({
      composition: 'solid',
      echogenicity: 'hypoechoic',
      shape: 'taller-than-wide',
      'nodule-side': 'right',
      'nodule-size': 2.5,
    });
    expect(r.segments[1].formState).toMatchObject({
      composition: 'spongiform',
      'nodule-side': 'left',
    });
  });
});
```

**Use `toMatchObject` not `toEqual`** for formState assertions — `toMatchObject` only checks the keys you care about, so adding auto-gen rules later doesn't force you to update the test. Reserve `toEqual` for exhaustive-shape assertions.

### 5b. Segmenter unit tests (for regex/segmenter edits)

When you edit `RIGHT_RE` / `LEFT_RE` / `BILATERAL_RE` / `segmentByLaterality` / `segmentByItemIndex`, test at the segmenter level — don't go through `parseSegmentedFindings`. This isolates the regex behavior from parseRules behavior.

```js
describe('segmentByLaterality', () => {
  it('splits right/left kidney sentences', () => {
    const r = segmentByLaterality(
      'Right kidney shows mild hydronephrosis. Left kidney is normal.'
    );
    expect(r.segments).toHaveLength(2);
    expect(r.segments[0].key).toBe('right');
    expect(r.segments[1].key).toBe('left');
  });

  it('matches new MSK anchor: knee', () => {
    const r = segmentByLaterality('Right knee: grade 3. Left knee: grade 2.');
    expect(r.segments.map((s) => s.key)).toEqual(['right', 'left']);
  });

  it('contralateral flips for that sentence only', () => {
    const r = segmentByLaterality(
      'Right kidney shows grade 2. The contralateral kidney has grade 4. ' +
      'The kidney also has a simple cyst.'
    );
    // "The kidney also..." should inherit the ORIGINAL sticky side (right),
    // not the flipped side (left).
    expect(r.segments.find((s) => s.key === 'right').text)
      .toContain('also has a simple cyst');
  });
});
```

**One anchor per test.** Don't write a single "tests all MSK joints" test — write one test per anchor. When one breaks, the failure message tells you exactly which organ regressed.

### 5c. SYNONYMS regression tests

When you add or remove a SYNONYMS entry, add a test that asserts the substring-match behavior. The test should fail if someone re-introduces a false-positive.

```js
describe('SYNONYMS substring hygiene', () => {
  it('"us" is NOT a synonym for ultrasound (would false-match "suspicion")', () => {
    // BI-RADS had "moderate suspicion" auto-setting modality=us before commit 12e80bc
    const def = {
      modalityOptions: [
        { id: 'us', label: 'Ultrasound' },
        { id: 'mammo', label: 'Mammography' },
      ],
    };
    const result = parseFindings('moderate suspicion of malignancy', def);
    expect(result.formState.modality).toBeUndefined();
  });

  it('"cystic" still wins longest-match over "mixed cystic and solid"', () => {
    // TI-RADS cystic gap fix (commit 7a40ffd). Bare "cystic" is safe
    // because "mixed cystic and solid" (22 chars) always wins longest-
    // match when both are present.
    const result = parseFindings(
      '2 cm mixed cystic and solid nodule',
      tiradsDefinition
    );
    expect(result.formState.composition).toBe('mixed');
  });
});
```

### 5d. Test-first workflow for segmenter bugs

The rule from section 10: **failing test before the fix.** In practice:

```sh
# 1. Write the failing test first
npx vitest src/core/parser -t "matches new MSK anchor: knee"
#    → 1 failed. The test exists but the regex doesn't handle knee yet.

# 2. Make the fix in parser.js (add 'knee' to the organ list)
# 3. Re-run
npx vitest src/core/parser -t "matches new MSK anchor: knee"
#    → 1 passed.

# 4. Run the full parser suite to catch collateral regressions
npx vitest src/core/parser
#    → 79 passed. No collateral damage.

# 5. Run the full suite and commit
npm run test:run
```

This workflow caught real regressions during the Phase 2 rollout — several times the segmenter fix for one tool silently broke an unrelated laterality pattern until the full parser suite surfaced it.

---

## 6. Writing calculator tests

Per-tool calculator tests live in `src/tools/<toolId>/calculator.test.js` and import from `./calculator.js`:

```js
import { describe, it, expect } from 'vitest';
import { calculateTirads } from './calculator.js';
```

Three kinds of calculator tests:

### 6a. Threshold / boundary tests

Score → level mappings and numeric thresholds are the most regression-prone parts of a calculator. Test **every boundary**, including one point above and below.

```js
describe('calculateTirads', () => {
  it('0 points → TR1 Benign', () => {
    expect(calculateTirads(0, null).tiradsLevel).toBe(1);
  });

  it('2 points → TR2', () => {
    expect(calculateTirads(2, null).tiradsLevel).toBe(2);
  });

  it('3 points → TR3 (TR2→TR3 boundary)', () => {
    expect(calculateTirads(3, null).tiradsLevel).toBe(3);
  });

  it('7 points → TR5 (lower edge)', () => {
    expect(calculateTirads(7, null).tiradsLevel).toBe(5);
  });

  it('1 point → TR2 (fallback from undefined gap)', () => {
    expect(calculateTirads(1, null).tiradsLevel).toBe(2);
  });
});
```

Follow `src/tools/tirads/calculator.test.js` as the canonical example — 18 tests covering every TR level and size-threshold management rule.

### 6b. Bilateral branch tests (for tools refactored in Phase 2)

When a tool has both a single-side branch and a bilateral branch in its calculator (hydronephrosis, hip-dysplasia, kellgren-lawrence, fetal-ventricle), test **both paths**:

```js
import { calculateHydronephrosis } from './calculator.js';

describe('calculateHydronephrosis — bilateral', () => {
  it('returns combined gradeLabel when side=bilateral', () => {
    const fs = {
      side: 'bilateral',
      rightGrade: 'P2', leftGrade: 'P1',
      rightAprpd: 18, leftAprpd: 11,
    };
    const r = calculateHydronephrosis(fs, 'utd-postnatal');
    expect(r.bilateral).toBe(true);
    expect(r.gradeLabel).toContain('Right: UTD P2');
    expect(r.gradeLabel).toContain('Left: UTD P1');
    expect(r.aprpdLabel).toBe('Right 18 mm, Left 11 mm');
    // More severe side drives management.
    expect(r.management).toMatch(/further evaluation/i);
  });

  it('falls back to single-side shape when side=right', () => {
    const fs = { side: 'right', grade: 'P2', aprpd: 18 };
    const r = calculateHydronephrosis(fs, 'utd-postnatal');
    expect(r.bilateral).toBe(false);
    expect(r.sideLabel).toBe('Right');
    expect(r.gradeLabel).toBe('UTD P2 (Moderate)');
  });

  it('bilateral with only one side filled still categorizes', () => {
    const fs = { side: 'bilateral', rightGrade: 'P3', rightAprpd: 20 };
    const r = calculateHydronephrosis(fs, 'utd-postnatal');
    expect(r.bilateral).toBe(true);
    expect(r.rightGradeProvided).toBe(true);
    expect(r.leftGradeProvided).toBe(false);
    expect(r.level).toBe(4);
  });
});
```

The three tests cover: full bilateral happy path, single-side regression guard, bilateral-with-asymmetric-data edge case.

### 6c. Edge cases (null inputs, extreme values)

```js
describe('calculateTirads — edge cases', () => {
  it('handles null size', () => {
    const r = calculateTirads(5, null);
    expect(r.management).toBeDefined();
    expect(r.noduleSizeProvided).toBe(false);
  });

  it('handles size at exactly the 1 cm TR4 threshold', () => {
    expect(calculateTirads(4, 1.0).management).toMatch(/follow/i);
  });

  it('handles size well above all thresholds', () => {
    expect(calculateTirads(7, 10).management).toMatch(/FNA/i);
  });
});
```

**Rule of thumb:** if a calculator has an `if`/`else if`/`else` chain on a numeric threshold, every branch needs a test. The test count for a calculator is usually `≥ (branches × 2) + (edge cases)`.

---

## 7. Common idioms and helpers

A handful of small conventions that make the tests easier to read and less brittle.

**Use real dictations, not synthetic placeholders.** `"Nodule 1: 2.5 cm solid hypoechoic right lobe"` tells a reviewer exactly what dictation form the test verifies. `"test input 1"` tells them nothing.

**Assert on observable output, not internal state.** Test `result.gradeLabel === 'UTD P2 (Moderate)'`, not `formState._internalDerivedKey === 2`. When a refactor changes internal representation, observable-output tests survive; internal-state tests break.

**Prefer `toMatchObject` over `toEqual` for formState.** Auto-gen rules can add new keys to `formState` over time. `toMatchObject` only checks the keys you care about; `toEqual` forces you to chase every new auto-gen addition.

**Parametrized cases with `it.each`.** When testing many similar inputs (e.g., every TI-RADS point total mapping to a level), use `it.each` instead of copy-pasting blocks:

```js
it.each([
  [0, 1], [1, 2], [2, 2], [3, 3], [4, 4], [6, 4], [7, 5], [10, 5],
])('%d points → TR%d', (points, expected) => {
  expect(calculateTirads(points, null).tiradsLevel).toBe(expected);
});
```

One line per case, fewer braces, clearer signal when a boundary regresses.

**Group with `describe`.** Each public function gets its own `describe` block. Each risk category (happy path / boundaries / edge cases / bilateral) gets its own nested `describe`. Helps `-t` pattern filtering and gives failure messages a breadcrumb.

**Don't snapshot-test rendered templates.** Report output strings change frequently as templates evolve. Snapshot tests go stale, get blanket-updated without review, and stop catching regressions. Test specific template variables (`data.gradeLabel`, `data.management`) instead.

**`expect.closeTo(n, precision)` for floating-point comparisons.** `(18 / 40) * 100` doesn't equal exactly `45` in IEEE 754. Use `expect(pct).toBeCloseTo(45, 1)` for percentages and ratios.

---

## 8. Pitfalls

Test anti-patterns that creep in when nobody's watching. Call these out in review.

### Testing implementation details

Asserting on private helpers, internal state shapes, or implementation-specific intermediate values couples the test to the implementation. Every refactor breaks the test even when the observable behavior is unchanged.

**Wrong:**
```js
expect(calculator._normalizeInputInternal(fs)).toEqual({...});
```

**Right:**
```js
expect(calculateTirads(points, size).management).toMatch(/FNA/);
```

### Overly synthetic test data

```js
parseFindings('size: 1', tiradsDefinition);  // ← not a real dictation
```

The test passes, but you haven't verified the parser works on real radiology text. Use the kind of strings a radiologist would actually dictate.

### Missing the negative case

For every "feature X is detected when present" test, add a "feature X is NOT detected when absent" companion. The `us`/`suspicion` bug would have surfaced months earlier if there had been a `'us' should not match inside "moderate suspicion"` test from the start.

### Order-dependent tests

A test that only passes when run after another test means you're mutating shared state. Vitest runs tests in file order by default, but parallel mode and `--shard` don't guarantee it. Symptom: tests pass locally, fail in CI or when you run `npx vitest -t <pattern>` on a single test.

**Fix:** every test creates its own fixtures. Don't reuse module-level `let state` across tests.

### Snapshot brittleness

Snapshot tests of rendered reports get updated without review and stop catching anything. If you need rendered-output regression coverage, assert on a handful of specific substrings (`expect(report).toContain('Side: Bilateral')`), not the whole string.

### Passing tests on accidental truthiness

```js
expect(result.formState).toBeTruthy();  // ← always true; empty object is truthy
```

Use specific assertions: `toMatchObject`, `toEqual({})`, `toHaveProperty('composition', 'solid')`.

### Over-mocking

Mocking `parseFindings` in a calculator test means you're testing the mock, not the real integration. Calculator tests should call the real calculator; parser tests should call the real parser. Mocks are mostly for Firebase / network / time — not for our own pure functions.

---

## 9. Coverage status + backlog

### Current state (165 tests, 8 files)

| File | Tests | Coverage |
|---|---|---|
| `src/core/parser.test.js` | 79 | `parseFindings`, `buildParseRules`, `SYNONYMS`, `extractText`, `splitSentences`, `segmentByLaterality`, `segmentByItemIndex`, `parseSegmentedFindings` |
| `src/core/clipboard.test.js` | 20 | HL7 character sanitization, `asciiSafe()`, ASCII_MAP transformations |
| `src/tools/tirads/calculator.test.js` | 18 | `getTiradsLevel`, `getManagement`, `calculateTirads` — every TR level, size thresholds, edge cases |
| `src/core/engine.test.js` | 12 | `calculateScore`, point summation, section rule merging |
| `src/tools/bosniak/calculator.test.js` | 10 | Category classification, enhancement branches |
| `src/tools/nascet/calculator.test.js` | 9 | Stenosis percentage calculation |
| `src/tools/aast-liver/calculator.test.js` | 9 | Grade assignment by finding set |
| `src/tools/reimers/calculator.test.js` | 8 | Migration percentage, bilateral branches |

### Tools without `calculator.test.js` (43)

A backlog for incremental retrofit. Each tool needs at least boundary tests for its main scoring/categorization function, and bilateral tests for the refactored ones.

**Phase 2 refactor tools** (highest priority — bilateral state refactor shipped with no tests):

- `hydronephrosis` — bilateral UTD/SFU grade branches (commit `06c811b`)
- `hip-dysplasia` — bilateral Graf/AAOS branches (commit `a466f33`)
- `kellgren-lawrence` — bilateral KL grade branches (commit `ee55036`)
- `fetal-ventricle` — bilateral widths + flow-text fallback (commit `6e6515b`)
- `adrenal-washout` — HU extraction proximity rules (commit `43f89d5`)
- `vur`, `vur-nm` — laterality parse handlers (commit `c7f6932`)
- `aast-kidney` — Set/array conversion in `applyParsedToSide` (commit `e49ee76`)

**Multi-item parse tools** (shipped parser changes with only ad-hoc verification):

- `lirads`, `lungrads`, `fleischner`, `bosniak` *(has tests but not for new parseRules)*, `pirads`, `orads`, `recist`, `mrecist`, `rapno`

**Decision-tree tools** (never had tests):

- `cadrads`, `nascet` *(has tests)*, `sah-grade`, `aspects`, `nirads`, `salter-harris`, `gmh`

**Measurement tools**:

- `agatston`, `leglength`, `scoliosis`, `kyphosis`, `pectus`, `reimers` *(has tests)*, `fetal-biometry`, `fetal-cc`, `fetal-pf`, `fetal-lung`

**Oncologic response**:

- `deauville`, `lugano`, `curie`, `idrf`, `pretext`

**MSK / orthopedic**:

- `bone-age`, `bone-age-sontag`

**Other RADS**:

- `birads`, `balthazar`

**AAST family**:

- `aast-spleen`, `aast-pancreas`, `aast-multi`

### Retrofit priority order

1. **Phase 2 refactor tools first** (bilateral branches with zero coverage — highest regression risk).
2. **Tools with manual parseRules** (second-highest risk — parser change + no test).
3. **Decision-tree tools** (small calculators but no coverage means any refactor flies blind).
4. **Measurement tools** (straightforward threshold tests, mechanical to write).

---

## 10. Test discipline — the hard rule

The rest of this doc explains how to write tests. This section is the commitment about **when you must**. Everything above is advice; this section is policy.

### The test-first rule

If the edit you're about to make falls into any of these categories, you write a failing test **before** the fix lands.

- **`src/core/parser.js`** — any edit to `RIGHT_RE` / `LEFT_RE` / `BILATERAL_RE`, `SYNONYMS`, `buildParseRules`, `parseFindings`, `segmentByLaterality`, `segmentByItemIndex`, `parseSegmentedFindings`, `splitSentences`, `extractText`, or `getSynonyms`.
- **A tool's `definition.js` `parseRules`** — adding, removing, or modifying any rule in the hand-written `parseRules` object.
- **A tool's `calculator.js`** — any change to scoring, categorization, threshold logic, or state-shape branching (e.g., adding a bilateral branch).

### The test-required rule

These don't strictly require test-first, but **must not be committed without a test landing alongside**:

- **New tool** — `calculator.test.js` co-located, covering the main scoring/categorization function + boundary cases.
- **Bilateral state refactor** — both single-side and bilateral paths of the calculator must have tests before the refactor commit is pushed.

### The enforced rule

Before every commit:

1. `npm run test:run` → must show full green (currently 165/165).
2. `npm run build` → must complete cleanly.

If you added tests, the count goes up. If the count went *down*, you removed or broke tests — don't commit until you understand why.

### Exceptions

- **Docs-only commits** don't need tests.
- **Pure refactors** (renaming, reformatting, whitespace) don't need new tests — but the existing suite must still pass, and if no tests exist for the refactored code, consider whether to add them *after* the refactor.
- **UI / CSS / HTML template changes** don't need unit tests — manual browser check instead (`npm run dev`, exercise the feature, verify end-to-end).
- **Emergency hotfixes** for production issues can ship without a test *if* a follow-up commit with the test lands in the same session.

### Why this rule exists

The Phase 2 parser rollout (batches A/B/C) shipped 18 tools' worth of changes to `src/core/parser.js` and 10+ tools' `parseRules` **with zero new tests**. Every change was verified by ad-hoc `node -e "..."` one-liners that got thrown away after the commit. The full parser test suite (79 tests) caught some regressions but only because the existing coverage happened to overlap with the new behavior.

The regressions that *weren't* caught (discovered during sanity checks that should have been tests):

- `'us'` substring matching inside `'suspicion'` (BI-RADS false positive)
- `'solid nodule'` beating `'part-solid'` on longest-match (lungrads/fleischner)
- `'cystic'` overlapping with `'mixed cystic and solid'` (TI-RADS)
- MSK organ anchors missing from laterality regex (kellgren-lawrence)
- HU extraction matching across comma-separated phrases (adrenal-washout)
- Modifier-word regex missing `"right lateral ventricle"` (fetal-ventricle)

Each of these **should have been a failing test before the fix**. Each of them cost extra round-trips to discover via manual sanity-check scripts. Some of them shipped to production because the sanity check didn't cover the edge case.

The test-first rule makes the regression-catching mechanism **explicit** — instead of relying on `node -e` scripts that disappear after the commit, the assertion lives in `parser.test.js` forever and the next developer who breaks it gets a clear failure message.

### When you (Claude) are editing parser.js

At the start of any edit to `src/core/parser.js`:

1. State which section(s) of this doc apply to the edit.
2. Write the failing test in `parser.test.js` first and run it to confirm it fails.
3. Make the fix in `parser.js`.
4. Re-run the specific test (`npx vitest parser -t "<test name>"`) to confirm it passes.
5. Run the full parser suite (`npx vitest parser`) to check for collateral damage.
6. Run the full test suite (`npm run test:run`) before committing.
7. The commit message names the test file and test case that was added.

This workflow is slower than "edit, verify manually, commit" — but every step after #2 is fast (~1s for the filtered test, <1s for the full parser suite). The slowness is a feature: it forces you to think about the failure mode before fixing it, which is how you catch the collateral-damage cases that ad-hoc scripts miss.

### Retroactive coverage is welcome

The 43-tool backlog in section 9 is a list of commits that shipped without tests during Phase 2. Writing tests for those commits **after the fact** is a legitimate follow-up and should be welcomed — it's how the debt gets paid down.

A retroactive-test commit should:

- Reference the original commit (`commit 06c811b shipped bilateral hydronephrosis without tests; this adds them`).
- Include at least the three canonical bilateral tests from section 6b.
- Not be bundled with new functional changes — a test-only commit is easier to review.

### What a "failing test before the fix" commit looks like

Two-commit pattern is sometimes cleaner for large parser changes:

```
commit <A>  test(parser): failing test for MSK knee anchor in laterality segmenter
commit <B>  feat(parser): add MSK joint anchors to laterality regex (fixes <A>)
```

`<A>` fails the suite (test exists, fix doesn't). `<B>` lands the fix and the test passes. A bisect between them cleanly isolates the behavioral change.

For small parser fixes, one-commit is fine — just make sure the commit message names both the test and the fix, and verify the test was added in the same commit via `git show`.

---

*Last updated: Phase 2 parser rollout retrospective. Test-first rule
introduced retroactively after identifying 6 regressions that
should have been caught by tests during the rollout itself.*