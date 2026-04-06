# RadioLogicHQ v1.1 — Architecture

## Overview

RadioLogicHQ is a collection of radiology calculators that output structured reports for PowerScribe 360, PowerScribe One, and RadAI Omni. Reports map to RSNA Common Data Elements (CDEs). The app supports two tool types: point-based scoring (TI-RADS) and decision-tree categorization (LI-RADS).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla ES6+ modules, Web Components, HTML5, CSS3 |
| Build | Vite 8 (MPA mode — one HTML entry per tool/page) |
| Backend | Firebase (Firestore + Auth) |
| Auth | Email/password + Google OAuth + forgot password |
| Hosting | Netlify (auto-deploy from GitHub) |
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

Netlify → serves dist/ → auto-deploys on git push
```

## Project Structure

```
RadioLogicHQ/
├── src/
│   ├── core/                          # Shared framework
│   │   ├── firebase.js                # Firebase client init
│   │   ├── auth.js                    # Auth (sign in/up/out, Google, forgot, delete)
│   │   ├── user-data.js              # Firestore CRUD (prefs, templates, reports, analytics, export, delete)
│   │   ├── storage.js                 # Smart storage: localStorage + Firestore sync
│   │   ├── engine.js                  # Point-based score calculator
│   │   ├── renderer.js               # Form builder from tool definitions
│   │   ├── report.js                  # Template engine ({{variable}}, {{#if}})
│   │   ├── pill-editor.js            # Pill editor data model + serialization
│   │   ├── parser.js                  # Text parser for paste-to-autofill
│   │   ├── cde.js                     # CDE mapping registry
│   │   └── clipboard.js              # Copy-to-clipboard
│   ├── components/
│   │   ├── report-output.js           # <report-output> — pill editor, copy, save, history, share
│   │   └── auth-ui.js                # <auth-ui> — sign in/up modal
│   ├── tools/
│   │   ├── tirads/                    # TI-RADS (point-based)
│   │   └── lirads/                    # LI-RADS (decision-tree)
│   ├── pages/
│   │   ├── profile.html/js/css        # User profile, preferences, data management
│   │   └── privacy.html/js            # Privacy policy
│   ├── styles/
│   │   ├── variables.css              # CSS custom properties (dark theme)
│   │   ├── base.css                   # Global resets, layout, self-hosted fonts
│   │   └── forms.css                  # All shared styles (report, auth, pills, palette)
│   ├── data/
│   │   ├── tools-registry.js          # Central tool metadata + labels
│   │   └── cde-sets/                  # Bundled CDE JSON
│   └── assets/
│       └── fonts/                     # Self-hosted Inter woff2 (GDPR)
├── public/images/{toolId}/            # SVG reference diagrams
├── firestore.rules                    # Firestore security rules
├── netlify.toml                       # Netlify build config
├── .env.local                         # Firebase config (gitignored)
└── docs/                              # This documentation
```

## Data Flow

### Storage Layer (`storage.js`)
```
getStored(key) → localStorage (synchronous, instant)
setStored(key, value) → localStorage + background Firestore sync (if logged in)
removeStored(key) → localStorage + Firestore deletion (if logged in)
trackEvent(id) → Firestore atomic increment (fire-and-forget)
```

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

### HIPAA
- No PHI stored anywhere
- PHI disclaimer on every report output
- No individual timestamps or IP logging
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

### Decision-Tree (LI-RADS)
```
definition.js → steps, major features, ancillary features
    ↓
lirads.js → custom step wizard UI (not renderer.js)
    ↓
calculator.js → decision table lookup (not engine.js)
    ↓
templates.js → block/pill definitions for report
```

Both types share: report-output component, pill editor, parser, storage, auth.
