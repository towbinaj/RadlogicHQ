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