# RadioLogicHQ — Brand Guide

*Use this document to inform all branding, design, copy, and marketing decisions.*

---

## Identity

**Name:** RadioLogicHQ
**Tagline options:**
- "Evidence-based radiology tools"
- "Structured reporting, standardized"
- "Radiology calculators built on Common Data Elements"

**What it is:** A free, open, evidence-based collection of radiology calculators that generate structured reports for clinical reporting systems. Built by radiologists, for radiologists and trainees.

**What it is NOT:** An EHR, a PACS viewer, a billing tool, or a patient-facing app.

---

## Mission

To standardize and simplify radiology structured reporting by providing free, open-access calculators grounded in published evidence and RSNA Common Data Elements.

---

## Audience

### Primary
- **Radiology trainees** (residents, fellows) learning scoring systems and structured reporting
- **Practicing radiologists** who want fast, accurate calculators integrated into their reporting workflow

### Secondary
- **Radiology educators** using the tools for teaching TI-RADS, LI-RADS, and other scoring systems
- **Researchers** interested in CDE-standardized data collection
- **Radiology IT/informatics** teams evaluating structured reporting tools

---

## Brand Values

| Value | Meaning |
|-------|---------|
| **Evidence-based** | Every calculator is grounded in published literature. References are linked, not hidden. |
| **Open access** | Free to use. No paywall. No ads. Tools work without an account. |
| **Standards-driven** | Reports map to RSNA Common Data Elements (CDEs). Interoperability matters. |
| **Efficient** | Designed for mid-workflow use. Minimal clicks, minimal scrolling, maximal speed. |
| **Privacy-first** | No PHI stored. HIPAA and GDPR compliant by design. |
| **Educational** | Tooltips sourced from official lexicons. Every tool links to its reference paper. |

---

## Voice & Tone

### Writing style
- **Academic but accessible** — use proper medical terminology but don't assume expertise in every subspecialty
- **Concise** — radiologists are busy. Say it in fewer words.
- **Authoritative** — cite sources. Link to references. Show the evidence.
- **Practical** — focus on clinical utility, not features for features' sake

### Examples

**Good:** "TI-RADS scoring based on Tessler et al. JACR 2017"
**Bad:** "Our amazing AI-powered thyroid calculator!"

**Good:** "Paste your findings to auto-fill scoring"
**Bad:** "Leverage our intelligent text parsing engine"

**Good:** "No patient data stored. Ever."
**Bad:** "We take your privacy seriously and employ industry-leading security measures..."

---

## Visual Identity

### Current palette (dark theme)
| Role | Color | Hex |
|------|-------|-----|
| Background primary | Deep navy | `#1a1a2e` |
| Background surface | Dark blue-gray | `#1e2a45` |
| Text primary | Light gray | `#e8e8e8` |
| Text secondary | Medium gray | `#a0a8b8` |
| Accent / interactive | Blue | `#3b82f6` |
| Success / benign | Green | `#34d399` |
| Warning / suspicious | Gold | `#fbbf24` |
| Danger / malignant | Red | `#f87171` |

### Why dark theme?
Radiology reading rooms are dark environments. A dark UI reduces eye strain and feels native to the workflow. The color palette mimics the ambient lighting of a PACS workstation.

### Typography
- **Font:** Inter (self-hosted, no CDN)
- **Weights:** 400 (body), 500 (labels), 600 (headings), 700 (badges)
- **Monospace:** JetBrains Mono / Fira Code / Consolas (report output)

### Risk level color coding
| Level | Color | Meaning |
|-------|-------|---------|
| Green | `#34d399` | Benign / low risk |
| Gold | `#fbbf24` | Intermediate / mildly suspicious |
| Orange | `#fb923c` | Moderately suspicious |
| Red | `#f87171` | Highly suspicious / malignant |

This four-color scale is consistent across all tools (TI-RADS TR1-5, LI-RADS LR1-5).

### Logo concept
Not yet designed. Considerations:
- Should work at small sizes (favicon, tab icon)
- Must be legible on dark background
- Current placeholder: blue "R" square in auth modal
- Could incorporate: radio waves, crosshairs, anatomical abstract, or simply clean typography

---

## Content Principles

### Tool pages
- Tool name as `<h1>` — short, no "ACR" prefix (just "TI-RADS", "LI-RADS")
- Superscript "Ref" link to the primary reference paper
- Hover tooltips for all medical terminology (sourced from official lexicons)
- No marketing copy on tool pages — just the calculator and report

### Landing page
- Tool cards with color-coded labels (body part, modality, specialty)
- No hero section, no tagline, no description block — tools are the content
- Clean grid, dark theme, immediate access

### Report output
- Three formats: PowerScribe 360, PowerScribe One, RadAI Omni
- Pill-based WYSIWYG editor for customization
- PHI disclaimer always visible
- Copy button is the primary action

### References
- Every tool links to its defining publication
- Full citation in the `title` tooltip of the "Ref" link
- CDE set IDs link to radelement.org

---

## Competitive Positioning

| Feature | RadioLogicHQ | Other radiology calculators |
|---------|-------------|---------------------------|
| **Cost** | Free | Often paywalled or ad-supported |
| **Structured report output** | PS360 + PS1 + RadAI | Usually just a score number |
| **CDE mapping** | RSNA CDEs with element IDs | Rarely |
| **Customizable templates** | Pill-based WYSIWYG editor | No |
| **Multi-item scoring** | Nodule tabs, independent scoring | Usually single item |
| **Text parsing** | Paste findings to auto-fill | No |
| **Privacy** | No PHI, no tracking, no ads | Variable |
| **Open access** | Works without account | Often requires registration |
| **Evidence-based** | Linked references, lexicon tooltips | Sometimes |

---

## Future brand considerations
- Custom domain: radiologichq.com
- Favicon / app icon
- Open Graph images for social sharing
- Conference poster / presentation materials
- "Built on RSNA Common Data Elements" badge
- Possible light theme option (for non-reading-room use)

---

*This document should evolve as the product matures. Update it when the visual identity, audience, or positioning changes.*
