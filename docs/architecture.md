# RadioLogicHQ v1.2 — Architecture

## Overview

RadioLogicHQ is a collection of 42 radiology calculators that output structured reports for PowerScribe 360, PowerScribe One, and RadAI Omni. Reports map to RSNA Common Data Elements (CDEs). The app supports five tool types: point-based scoring, decision-tree categorization, measurement calculators, category selectors, and response assessment tools.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla ES6+ modules, Web Components, HTML5, CSS3 |
| Build | Vite 8.0.8 (MPA mode — auto-discovers HTML entries from src/tools/ and src/pages/) |
| Test | Vitest (co-located *.test.js files) |
| Backend | Firebase (Firestore + Auth) |
| Auth | Email/password + Google OAuth + forgot password + change password |
| Serverless | Cloudflare Pages Functions (`functions/api/feedback.js` — creates GitHub issues from the in-site feedback widget) |
| Hosting | Cloudflare Pages (auto-deploy from GitHub), custom domain `radiologichq.com` |
| Fonts | Inter (self-hosted woff2 — no CDN) |
| Data | RadElement CDE sets (bundled JSON) |

## Architecture Diagram

```
Browser
├── Anonymous user → localStorage only
└── Logged-in user → localStorage + Firestore sync
      ├── Firebase Auth (email, Google OAuth)
      └── Firestore
            ├── profiles/{uid}
            ├── user_preferences/{uid}
            ├── user_templates/{uid_tool_tpl}
            ├── saved_reports/{id}
            └── analytics_aggregate/{counterId}

Browser → <feedback-widget> modal
      └── POST /api/feedback → Cloudflare Pages Function
            └── GitHub Issues API (towbinaj/radlogichq) via GITHUB_TOKEN secret

Cloudflare Pages → serves dist/ + public/ → auto-deploys on git push to main
      ├── Custom domain: radiologichq.com (+ www redirect)
      ├── Security headers from public/_headers (CSP, HSTS, X-Frame-Options)
      └── Runtime: Pages Functions under functions/ directory
```

## Project Structure

```
RadioLogicHQ/
├── src/
│   ├── core/                          # Shared framework
│   │   ├── firebase.js                # Firebase client init
│   │   ├── auth.js                    # Auth (sign in/up/out, Google, forgot, delete, updateUserPassword)
│   │   ├── auth-state.js              # Shared auth state (breaks circular dep between auth ↔ user-data)
│   │   ├── user-data.js               # Firestore CRUD (prefs, templates, reports, analytics, export, delete)
│   │   ├── storage.js                 # Smart storage: localStorage + Firestore sync + toast on failure
│   │   ├── toast.js                   # Lightweight toast notification
│   │   ├── engine.js                  # Point-based score calculator
│   │   ├── renderer.js                # Form builder from tool definitions
│   │   ├── report.js                  # Template engine ({{variable}}, {{#if}})
│   │   ├── pill-editor.js             # Pill editor data model + serialization
│   │   ├── parser.js                  # Text parser for paste-to-autofill
│   │   ├── clipboard.js               # Copy-to-clipboard
│   │   ├── tool-name.js               # Tool name overrides + auto-imports feedback-widget on tool pages
│   │   └── keyboard-shortcuts.js      # Number keys / arrows for step cards + tabs (opt-in via initKeyboardShortcuts)
│   ├── components/
│   │   ├── report-output.js           # <report-output> — pill editor, copy, save, history, share (+ escapeHtml helper)
│   │   ├── auth-ui.js                 # <auth-ui> — sign in/up modal
│   │   └── feedback-widget.js         # <feedback-widget> — floating bug-report button, self-inserts on import
│   ├── tools/                         # 42 tool directories
│   │   ├── tirads/                    # TI-RADS (point-based)
│   │   ├── lirads/                    # LI-RADS (decision-tree)
│   │   ├── aast-liver/                # AAST Liver (shared calculator for all AAST organs)
│   │   ├── bone-age/                  # Bone Age G&P (shared calculator for Sontag)
│   │   └── ...                        # 38 more tool directories
│   ├── pages/
│   │   ├── profile.html/js/css        # User profile, preferences, password change, data management
│   │   ├── privacy.html/js            # Privacy policy
│   │   └── guide.html/js              # User guide
│   ├── styles/
│   │   ├── variables.css              # CSS custom properties (dark theme)
│   │   ├── base.css                   # Global resets, layout, site-header (wordmark sizing)
│   │   └── forms.css                  # All shared styles (report, auth, pills, palette)
│   ├── data/
│   │   ├── tools-registry.js          # Central tool metadata + labels
│   │   └── cde-sets/                  # Bundled CDE JSON
│   └── assets/
│       └── fonts/                     # Self-hosted Inter woff2 (GDPR)
├── functions/
│   └── api/
│       └── feedback.js                # Cloudflare Pages Function → GitHub Issues API (uses GITHUB_TOKEN secret)
├── public/
│   ├── _headers                       # Cloudflare Pages response headers (CSP, HSTS, X-Frame-Options, etc.)
│   ├── favicon-32.png                 # Browser tab icon (navy tile + white [R])
│   ├── favicon-192.png                # Android/PWA icon
│   ├── favicon-512.png                # High-DPI / OpenGraph image
│   ├── apple-touch-icon.png           # iOS home-screen icon (180×180)
│   ├── sitemap.xml                    # SEO (52 URLs)
│   ├── robots.txt                     # SEO (allow *, disallow /api/)
│   ├── brand/                         # Brand assets
│   │   ├── logo-r-{white,black,blue}.png
│   │   ├── wordmark-{white,black,blue}.png           # full-res masters
│   │   └── wordmark-{white,black,blue}-{400,800,1200}.png   # srcset variants
│   └── images/{toolId}/               # Reference SVG diagrams per tool
├── firestore.rules                    # Firestore security rules
├── wrangler.jsonc                     # Cloudflare Pages config
├── .env.local                         # Firebase VITE_* env vars (gitignored; mirrored in Cloudflare Pages env vars)
└── docs/                              # This documentation
```

## Data Flow

### Storage Layer (`storage.js`)
```
getStored(key) → localStorage (synchronous, instant)
setStored(key, value) → localStorage + background Firestore sync (if logged in, toast on failure)
removeStored(key) → localStorage + Firestore deletion (if logged in, toast on failure)
getSizeUnit(toolId) → per-tool unit || global defaultUnit || 'mm'
trackEvent(id) → Firestore atomic increment (fire-and-forget, silent on failure)
```

PREF_KEYS synced to Firestore: compact, sectionOrder:tirads, sizeUnit:*, defaultTemplate, defaultUnit, mode:curie, mode:leglength, mode:hydronephrosis, mode:hip-dysplasia, favorites, hiddenTools.

On login: Firestore preferences pulled into localStorage.
On sign-out: prefsCache cleared to prevent user data bleed.

### Report Generation Flow
```
Tool Definition → Form Inputs → formState
                                   ↓
                     engine.js / calculator.js
                                   ↓
                              calcResult
                                   ↓
                     buildTemplateData() → templateData
                                   ↓
               ┌─────────────────────────────────┐
               │  Has editorContent?              │
               │  YES → renderEditorContent()     │
               │  NO  → renderBlocks() (fallback) │
               └─────────────────────────────────┘
                                   ↓
                          Report Output Text
                                   ↓
                     Copy to clipboard / Save to history
```

### Pill Editor Data Model
```js
editorContent: [
  { type: 'text', value: 'FINDINGS:\nComposition: ' },
  { type: 'pill', blockId: 'composition', display: '{{composition}}' },
  { type: 'text', value: ' (' },
  { type: 'pill', blockId: 'compositionPoints', display: '{{compositionPoints}}' },
  { type: 'text', value: ' pts)\n' },
  ...
]
```
- Pills are non-editable inline spans with `contentEditable="false"`
- Free text is typed around pills
- Serialized from DOM via `serializeDOM()`, deserialized via `deserializeToDOM()`
- Migration from block-based config via `blocksToEditorContent()`

### Auth Flow
```
Click "Sign In" → Modal opens
  → Email/password or Google OAuth → Firebase Auth
  → On success: ensureProfile(), migrateLocalStorageToCloud()
  → Auth state change → listeners notified → UI updates
```

## Firestore Schema

### profiles/{uid}
| Field | Type |
|-------|------|
| email | string |
| displayName | string |

### user_preferences/{uid}
| Field | Type |
|-------|------|
| preferences | map (compact, sizeUnits, sectionOrder, etc.) |

### user_templates/{uid_tool_tpl}
| Field | Type |
|-------|------|
| userId | string |
| toolId | string |
| templateId | string |
| config | map (blocks, editorContent, pillStates, etc.) |
| shareCode | string (null if not shared) |

### saved_reports/{id}
| Field | Type |
|-------|------|
| userId | string |
| toolId | string |
| reportText | string |
| label | string |
| *(no timestamp, no IP)* | |

### analytics_aggregate/{counterId}
| Field | Type |
|-------|------|
| count | number (atomic increment) |

## Security

### Firestore Rules
- Users can only read/write their own profiles, preferences, templates, reports
- Shared templates readable by anyone (via shareCode)
- Analytics counters publicly readable/writable (aggregate only, no PII)
- Verified by OWASP audit — no IDOR or over-permissive rules

### HTTP Security Headers (`public/_headers`)
- **Content-Security-Policy**: strict `script-src 'self'` + Google APIs (OAuth + Firebase); `connect-src` whitelists Firebase Auth / Firestore endpoints; `frame-ancestors 'none'`; `style-src 'self' 'unsafe-inline'` (relaxation for runtime-injected component styles)
- **Strict-Transport-Security**: 1y preload
- **X-Frame-Options**: DENY (clickjacking)
- **X-Content-Type-Options**: nosniff
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: camera, microphone, geolocation, interest-cohort all disabled
- **COOP**: same-origin-allow-popups (needed for Google OAuth popup)

### XSS Defense
- `escapeHtml()` helper in `src/components/report-output.js` wraps any user-controlled content that lands in `innerHTML` template literals (pill palette truncValue, item labels, section labels)
- CSP is the defense-in-depth layer that would contain any future XSS

### Feedback Pipeline (`functions/api/feedback.js`)
- Honeypot field rejects naive bots silently
- Length validation: subject 3–100, body 10–2000
- Per-IP rate limit: 5 submissions per 60s (best-effort, module-level Map)
- PII-free logging: IPs are SHA-256 hashed and truncated to 12 chars before going into the issue body
- Markdown escape on all user text to prevent injection into the rendered GitHub issue
- GITHUB_TOKEN stored as Cloudflare Pages Secret (not Plaintext)

### HIPAA
- No PHI stored anywhere intentionally
- PHI disclaimer on every report output
- No individual timestamps or IP logging
- Free-text form fields are a theoretical PHI surface — UI warning is the only control, not a technical block
- See `docs/compliance.md`

### GDPR
- Self-hosted fonts (no Google Fonts CDN)
- Privacy policy page
- Account deletion + data export
- Signup consent required
- See `docs/compliance.md`

## Tool Architecture

### Point-Based (TI-RADS)
```
definition.js → sections with options + points
    ↓
renderer.js → option card grids with drag reorder
    ↓
engine.js → calculateScore() → sums points per section
    ↓
calculator.js → maps score to risk level + management
    ↓
templates.js → block/pill definitions for report
```

### Decision-Tree (LI-RADS, Bosniak, Fleischner)
```
definition.js → steps, major features, ancillary features
    ↓
lirads.js → custom step wizard UI (not renderer.js)
    ↓
calculator.js → decision table lookup (not engine.js)
    ↓
templates.js → block/pill definitions for report
```

### Category Select (AAST, Salter-Harris, BI-RADS, KL)
```
definition.js → categories with findings + grades
    ↓
tool.js → benign-choice buttons (multi-select within category)
    ↓
calculator.js → highest grade from selected findings
    ↓
templates.js → block definitions for report
```
AAST organs share calculator/templates from `aast-liver/`.

### Measurement (Reimers, NASCET, Leg Length, Pectus)
```
definition.js → minimal (option lists)
    ↓
tool.js → numeric inputs, auto-computed results
    ↓
calculator.js → formulas (ratios, percentages, differences)
    ↓
templates.js → block definitions for report
```

### Response Assessment (RECIST, mRECIST, RAPNO)
```
definition.js → response thresholds, non-target/new-lesion options
    ↓
tool.js → target lesion table + assessment inputs
    ↓
calculator.js → sum measurements → % change → response category
    ↓
templates.js → block definitions for report
```

All types share: report-output component (reads defaultTemplate preference), pill editor, parser, storage, auth.
