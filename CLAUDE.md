# RadioLogicHQ v1.2

Free radiology calculators with structured report output (PS360, PowerScribe One, RadAI Omni). Live at **radiologichq.com**.

## Commands
```
npm run dev                    # Vite dev server
npm run build                  # Production build to dist/
npm run preview                # Preview production build
npm run test                   # Vitest watch mode
npm run test:run               # Vitest single run (run before committing)
npm run check-synonyms <id>    # Check parser synonym coverage for a tool
npm run check-synonyms -- --all
```

## Architecture (one paragraph)
Vanilla ES6+ modules, no framework. Vite MPA with auto-discovered HTML entry points under `src/tools/*/` and `src/pages/`. Firebase backend (Auth + Firestore) for prefs / templates / saved reports / aggregate analytics. Cloudflare Pages hosting with one Pages Function (`functions/api/feedback.js`) for the in-site feedback widget. Dark reading-room theme by default.

## Key Directories
- `src/core/` — framework: engine, renderer, report, pill-editor, parser, storage, auth, auth-state, toast, firebase, clipboard, tool-name
- `src/components/` — `<report-output>`, `<auth-ui>`, `<feedback-widget>`
- `src/tools/{toolId}/` — one directory per calculator (42 tools)
- `src/pages/` — profile, privacy, guide
- `src/styles/` — `variables.css` (CSS custom properties), `base.css`, `forms.css` (shared), `tool-name.css` (tool hero)
- `src/data/` — `tools-registry.js` (metadata + **VALIDATED_TOOLS** set), CDE sets
- `src/assets/fonts/` — self-hosted Inter woff2 (GDPR: no Google Fonts CDN)
- `public/brand/` — logo + wordmark PNGs with responsive srcset variants
- `public/images/{toolId}/` — reference SVG diagrams per tool
- `public/favicon-{32,192,512}.png`, `apple-touch-icon.png` — navy `#1a1a2e` tile + white [R]
- `public/_headers` — Cloudflare response headers (CSP, HSTS, X-Frame-Options)
- `public/sitemap.xml`, `public/robots.txt` — SEO
- `functions/api/feedback.js` — Cloudflare Pages Function → GitHub Issues API
- `docs/` — see Docs Index below

## Docs Index
Read these on demand — don't load them unless they're relevant.

| File | When to read |
|---|---|
| `docs/tools.md` | Working with specific tools, CDE IDs, subspecialty breakdown, tool types, shared AAST/bone-age patterns |
| `docs/architecture.md` | Project structure, tech stack, data flow diagrams, Firestore schema, auth flow, security details |
| `docs/newtool.md` | Adding a new calculator — HTML template, definition format, parser rules, verification checklist |
| `docs/parser.md` | Writing or debugging parser rules, segmentation, or parse handlers — full reference for `parser.js`, both segmenter types, 5 handler idioms, 18-tool registry, pitfall case studies |
| `docs/test.md` | Writing tests — test-first rule for parser changes, decision table, canonical templates, coverage backlog. **Read before editing `parser.js`, `parseRules`, or a `calculator.js`.** |
| `docs/state.md` | Current project state, shipped features, pending roadmap, post-launch checklist |
| `docs/brand.md` | Voice/tone, logo and wordmark asset inventory, colors, typography, brand guide |
| `docs/compliance.md` | HIPAA / GDPR posture, Firestore schema, PHI policy, OWASP audit log, feedback widget data flow |
| `docs/toolui.md` | UI styling conventions — spacing, labels, tooltips |
| `docs/gotchas.md` | The long tail of watch-outs: parser synonyms, storage layer quirks, AbortController, hyphenated IDs, etc. |

## Critical Conventions
- Dark theme by default — colors from `src/styles/variables.css` CSS custom properties, never hardcoded
- Shared styles in `forms.css`; per-tool CSS is minimal overrides only
- Tooltips via hover `title` attribute, not inline gray text
- No number spinners (`class="no-spinner"`)
- Efficiency first: minimize clicks, scrolling, mouse mileage
- Validation badges: red warning = unvalidated, green check = validated. Add a tool ID to `VALIDATED_TOOLS` in `src/data/tools-registry.js` to flip it.

## Before Committing
1. `npm run test:run` — current full count must pass (165 tests as of Phase 2 rollout). If you added tests, the count goes up; if it went down, you broke something.
2. `npm run build` — must complete cleanly
3. `npm audit` — should report 0 vulnerabilities (check after dep upgrades)
4. Test any touched tool in the browser end-to-end (`npm run dev`)
5. **Test-first rule applies** for edits to `src/core/parser.js`, a tool's `definition.js` `parseRules`, or a `calculator.js`. Write the failing test in `parser.test.js` or `calculator.test.js` **before** the fix. See `docs/test.md` section 10 for the full policy.

## Critical Watch-Outs
These are the ones that will break things if ignored. For the longer list organized by topic, see `docs/gotchas.md`.

- **Firebase config** lives in `.env.local` (gitignored) AND must be mirrored in Cloudflare Pages env vars (`VITE_FIREBASE_*`)
- **Firestore security rules** in `firestore.rules` — deploy via Firebase Console; the codebase doesn't auto-push them
- **Storage API**: always use `setStored()` / `getStored()` / `removeStored()` — never raw `localStorage` calls. `removeStored()` cascades to Firestore.
- **`vite.config.js`** auto-discovers HTML entries — no manual updates needed when adding tools
- **AAST tools share calculator/templates** from `aast-liver/` — only `definition.js` is per-organ
- **`auth-state.js` holds shared auth state** to prevent a circular import between `auth.js` and `user-data.js`
- **Pages Functions are separate from Vite**: `functions/` is deployed by Cloudflare Pages directly, not bundled. Env vars live in Cloudflare Pages dashboard (Secrets for runtime tokens like `GITHUB_TOKEN`, Plaintext for `VITE_*` since they end up in the public bundle anyway).
- **CSP in `public/_headers`**: adding a new third-party script/API/CDN requires updating `script-src` / `connect-src` / `img-src` or the browser silently blocks it
- **`escapeHtml()` helper** in `src/components/report-output.js` — use it any time you interpolate user-controlled data into an `innerHTML` template literal
- **HL7 safety**: never write `|`, `~`, `^`, `&`, or `\` into report templates, option labels, or tooltips — they're HL7 v2 structural delimiters and will corrupt downstream ORU messages. `src/core/clipboard.js` `asciiSafe()` normalizes non-ASCII on copy as a backstop, but keep source text ASCII. See `docs/gotchas.md` "HL7 safety" section.
- **Google OAuth** requires `radiologichq.com` in Firebase Console → Authentication → Settings → Authorized domains (separate from the CSP whitelist)
- **Parse rules** are auto-generated from labels + SYNONYMS dict in `parser.js`. Hand-written `parseRules` in a tool's `definition.js` override the auto-generated ones. Run `npm run check-synonyms {toolId}` to audit coverage.
- **Segmented parsing**: tools with paired-organ or multi-item state can opt into `parseSegmentation: { type: 'laterality' }` or `{ type: 'itemIndex', itemLabel: 'Nodule' }` in their definition. Laterality is sentence-based with sticky attribution + contralateral flip — see the "Segmented Parsing" section in `docs/newtool.md`.
- **New tools must include `trackEvent('tool:{toolId}:opens')`** as the first line of their `init()` function

## Adding a New Tool
See `docs/newtool.md` for the complete checklist including HTML template, definition format, calculator patterns, and verification steps.

## Compliance One-Liner
No PHI stored. Aggregate-only analytics. CSP + HSTS + security headers. Firestore rules isolate user data. Full details in `docs/compliance.md`.
