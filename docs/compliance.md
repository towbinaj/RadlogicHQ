# RadioLogicHQ Compliance Documentation

*Last updated: 2026-04-14*

## HIPAA Compliance

RadioLogicHQ is designed as a **clinical reference tool**, not a medical record system. It does NOT store Protected Health Information (PHI).

### What is NOT stored
- Patient names, MRNs, accession numbers, dates of birth
- Individual timestamps for report generation
- IP addresses in application data
- Individual user activity logs
- Any data that could identify a patient

### What IS stored
| Data | Location | PHI? |
|------|----------|------|
| User email + display name | Firestore `profiles` | PII, not PHI |
| Tool preferences (compact mode, units) | Firestore `user_preferences` | No |
| Custom report templates | Firestore `user_templates` | No |
| Saved report text (classification output) | Firestore `saved_reports` | No — scoring criteria only |
| Aggregate usage counters | Firestore `analytics_aggregate` | No — no user association |

### Safeguards
- PHI disclaimer displayed on every report output: "Do not include patient-identifying information"
- Saved reports contain only classification criteria (TI-RADS scores, LI-RADS categories, measurements)
- Analytics use Firestore atomic `increment()` — no read-modify-write, no user tracking
- Firestore security rules restrict data to owning user (RLS equivalent). Verified by OWASP audit 2026-04-14 — no IDOR or over-permissive rules.
- All data encrypted in transit (HTTPS/TLS, HSTS preload 1y) and at rest (Firestore default)
- No server-side logging of user activity
- Strict Content Security Policy (`public/_headers`) + X-Frame-Options DENY + Referrer-Policy — defense-in-depth against XSS / clickjacking / referer leakage
- Stored-XSS remediation (commit 602547f): all user-controlled content is HTML-escaped before innerHTML insertion via `escapeHtml()` helper in `src/components/report-output.js`

### Known residual risk
- **Free-text input fields** in calculator forms (nodule descriptions, notes, textareas) could theoretically contain PHI if a user pastes patient data into them. The only control is the PHI disclaimer — there is no server-side PHI pattern detection. If HIPAA coverage becomes a hard requirement, adding regex-based MRN/DOB/name detection at the Firestore write layer (or the `saveReport` call site) would close this gap.
- **Saved report text** in Firestore is sourced from the rendered report output, which includes whatever the user types into free-text fields. Same residual risk as above.

### Firebase Auth
Firebase Auth (managed by Google) automatically stores:
- Email, hashed password, OAuth tokens
- Account creation and last sign-in timestamps
- IP address of last sign-in

These are managed by Google's infrastructure and governed by their Data Processing Addendum. The application does not access or display these values.

### BAA Status
No Business Associate Agreement (BAA) is currently in place with Google Cloud. This is acceptable because RadioLogicHQ does not intentionally store or process PHI. If PHI protection is desired as a safety net (in case users inadvertently enter patient data), upgrading to Firebase Blaze plan enables BAA coverage at no additional cost for the free usage tier.

---

## GDPR Compliance

### Legal Basis for Processing
- **Consent** — provided at account creation (checkbox required)
- **Legitimate interest** — essential functionality (preferences, templates)

### Data Subject Rights (implemented)
| Right | Implementation |
|-------|---------------|
| Access (Art. 15) | "Export My Data" on profile page — downloads all data as JSON |
| Rectification (Art. 16) | Users can edit profile info, templates, preferences at any time |
| Erasure (Art. 17) | "Delete Account" on profile page — cascades all Firestore docs + Auth account |
| Portability (Art. 20) | JSON export of all user data |
| Withdraw consent | Account deletion removes all data |

### Third-Party Data Transfers
| Party | Purpose | Data Sent |
|-------|---------|-----------|
| Google Firebase (Firestore) | Database | Profiles, preferences, templates, reports, counters |
| Google Firebase (Auth) | Authentication | Email, password hash, OAuth tokens, sign-in IP |
| Cloudflare Pages | Hosting + serverless Functions | Page requests (static), feedback widget POSTs (transient, rate-limited) |
| GitHub (via Pages Function) | Bug/feature issue tracking | Feedback widget submissions (content, page path, hashed IP, optional email) |

### What We Eliminated
- **Google Fonts CDN** — fonts self-hosted locally. No user IP sent to Google on page load.
- **Google Analytics** — not used. No `measurementId`, no `getAnalytics()` call.
- **Tracking pixels** — none.
- **Cookies** — none set by application. Firebase Auth uses IndexedDB, not cookies.
- **Third-party scripts** — none beyond Firebase SDK (whitelisted in CSP `script-src`).

### Feedback Widget Data Flow (`<feedback-widget>` → `functions/api/feedback.js`)
Added 2026-04-14. Users can submit bug reports / feature requests / questions via a floating button on every page. Data handling:

| Field | Purpose | Stored where | PII? |
|-------|---------|--------------|------|
| Subject, body, type | User feedback content | GitHub issue body + title | PII only if user chooses to include personal info |
| Email (optional) | Contact for replies | GitHub issue body (if user provided) | PII, user-volunteered |
| Page path | Which page the user was on | GitHub issue body | No |
| User agent | Browser/OS identification | GitHub issue body, truncated to 200 chars | No |
| IP address | Rate limiting and abuse trace | **Hashed** (SHA-256, 12-char truncation) in issue body | Pseudonymized — raw IP is discarded after hashing |

- Raw IPs are **never** stored or logged beyond the duration of the request. Only a truncated SHA-256 hash is persisted, which is sufficient for abuse tracking across related reports but cannot be reversed to recover the source IP.
- Honeypot field rejects automated bots (empty field = real user; filled = bot, silently rejected with a fake success).
- Length validation prevents abuse: subject 3–100 chars, body 10–2000 chars.
- Per-IP rate limit: 5 submissions per 60 seconds (best-effort, in-memory).
- GitHub markdown injection is prevented by escaping `` ` * _ < > `` in all user-supplied text before rendering into the issue body.

### Privacy Policy
Located at `/src/pages/privacy.html`. Covers:
- Data collected and purpose
- Firebase as data processor (links to Google DPA)
- HIPAA statement
- GDPR rights and how to exercise them
- Data retention and security
- Children (not intended for under-16)
- Contact information

### Consent Flow
1. User clicks "Sign Up"
2. Consent checkbox appears: "I agree to the Privacy Policy" (links to privacy page)
3. Checkbox must be checked before account creation proceeds
4. Unchecked submission shows error: "Please agree to the Privacy Policy"

---

## Data Retention
- Data retained as long as account is active
- Account deletion permanently removes all Firestore documents for that user
- Firebase Auth account is deleted
- localStorage is cleared
- No backups of deleted user data are retained by the application

## Incident Response
- No PHI is stored, so HIPAA breach notification requirements do not apply
- If a security incident affecting user PII (email) occurs, affected users would be notified per GDPR Article 34

## Audit Log
This document serves as the compliance audit record. Update it whenever:
- New data fields are added to Firestore
- New third-party services are integrated
- The privacy policy is modified
- Data processing practices change

### 2026-04-14 — OWASP Top 10 security sweep
Full audit conducted across `src/`, `functions/`, `firestore.rules`, HTML entries, and `package.json`. Results:

**Critical findings (fixed in commit 602547f):**
- Stored XSS in pill palette render — user-entered form data reached `innerHTML` without escaping. Fixed via `escapeHtml()` helper in `src/components/report-output.js`.

**High findings (fixed in commit 602547f):**
- No Content Security Policy — added `public/_headers` with strict `script-src`, whitelisted Firebase Auth/Firestore endpoints in `connect-src`, `frame-ancestors 'none'`.
- Vite 8.0.3 CVEs (GHSA-p9ff-h696-f583, GHSA-v2wj-q39q-566r, GHSA-4w7w-66w2-5vf9) — dev-server path traversal / `server.fs.deny` bypass / arbitrary file read. Upgraded to 8.0.8. Production was unaffected (static hosting).

**Medium findings (fixed in commit 602547f):**
- No rate limit on `/api/feedback` — added per-IP 5/min soft cap with module-level Map.
- Defense-in-depth escape of `section.label` in pill popover — already safe (author-controlled) but wrapped in `escapeHtml()` to close a future attack vector.

**Low findings (fixed in commit 602547f):**
- Verbose error logging in feedback function was echoing GitHub API response bodies to Cloudflare logs. Trimmed to status only.

**Items reviewed and confirmed secure (no action needed):**
- Firestore security rules properly isolate user data; no IDOR or over-permissive reads.
- Analytics counters are truly aggregate (no user ID, no timestamp, no IP).
- No hardcoded secrets in the repo.
- `package-lock.json` present; `npm audit` reports 0 vulnerabilities post-upgrade.
- Template shareCode is brute-force resistant (8-char UUID slice).
- No source maps, debug endpoints, or unused routes exposed in production.
