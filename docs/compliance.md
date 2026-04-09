# RadioLogicHQ Compliance Documentation

*Last updated: 2026-04-05*

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
- Firestore security rules restrict data to owning user (RLS equivalent)
- All data encrypted in transit (HTTPS/TLS) and at rest (Firestore default)
- No server-side logging of user activity

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
| Cloudflare Pages | Hosting | No user data (static file hosting only) |

### What We Eliminated
- **Google Fonts CDN** — fonts self-hosted locally. No user IP sent to Google on page load.
- **Google Analytics** — not used. No `measurementId`, no `getAnalytics()` call.
- **Tracking pixels** — none.
- **Cookies** — none set by application. Firebase Auth uses IndexedDB, not cookies.
- **Third-party scripts** — none beyond Firebase SDK.

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
