# RadioLogicHQ — Tool Catalog

42 active radiology calculators. Each maps to a directory under `src/tools/{toolId}/`.
For architecture and adding new tools, see `architecture.md` and `newtool.md`.

## Tools by Category

### RADS Systems
- **TI-RADS** — thyroid nodule risk (CDE: RDES152)
- **LI-RADS** — liver HCC categorization (CDE: RDES5)
- **PI-RADS** — prostate MRI risk stratification
- **O-RADS** — ovarian-adnexal mass US risk
- **Lung-RADS** — lung cancer screening CT
- **BI-RADS** — breast imaging classification (mammo, US, MRI)
- **CAD-RADS** — coronary artery disease CTA (2.0 with modifiers)
- **NI-RADS** — post-treatment head & neck surveillance

### Oncologic
- **RECIST 1.1** — solid tumor response (unidimensional)
- **mRECIST** — HCC enhancing tumor response
- **RAPNO** — pediatric neuro-oncology response (HGG/LGG/DIPG/Medulloblastoma)
- **Deauville** — PET/CT lymphoma response
- **Lugano** — lymphoma staging (I-IV, Hodgkin/NHL)
- **MIBG Score** — Curie/SIOPEN neuroblastoma scoring
- **IDRF** — neuroblastoma image-defined risk factors
- **PRETEXT** — pediatric hepatoblastoma staging (CDE: RDES358)

### Trauma
- **AAST Liver** — 2018 liver injury grading with vascular criteria
- **AAST Spleen** — 2018 spleen injury grading with vascular criteria
- **AAST Kidney** — 2018 kidney injury grading with vascular criteria
- **AAST Pancreas** — 2018 pancreas injury grading with ductal criteria
- **ASPECTS** — MCA territory stroke CT scoring
- **SAH Grading** — Hunt-Hess + Modified Fisher scales

### Body Imaging
- **Adrenal Washout** — absolute and relative washout percentages
- **Bosniak v2019** — cystic renal mass classification
- **Fleischner 2017** — incidental pulmonary nodule management
- **Balthazar / CTSI** — pancreatitis CT severity index
- **NASCET** — carotid stenosis percentage

### Cardiac
- **CAD-RADS** — coronary CTA (see RADS above)
- **Agatston Score** — coronary calcium risk stratification

### MSK / Pediatric
- **Scoliosis** — Cobb angle, multi-curve, Risser, skeletal maturity
- **Kyphosis / Lordosis** — thoracic/lumbar Cobb angles, Scheuermann
- **Reimers' Index** — proximal femoral migration percentage
- **Leg Length** — lower extremity discrepancy (total/segmental modes)
- **Salter-Harris** — pediatric physeal fracture classification (I-V)
- **Kellgren-Lawrence** — osteoarthritis grading (0-4)
- **Hip Dysplasia** — Graf (US) / AAOS classification
- **Bone Age (G&P)** — Greulich & Pyle atlas comparison
- **Bone Age (Sontag)** — ossification center count method
- **Pectus Excavatum** — PI, CI, DI, mCCI, Sternal Torsion Angle

### Pediatric GU / Neuro
- **Hydronephrosis** — UTD (postnatal/antenatal) / SFU grading
- **VUR (VCUG)** — vesicoureteral reflux Grades I-V
- **VUR (Nuclear)** — radionuclide cystography (mild/moderate/severe)
- **GMH Grading** — germinal matrix hemorrhage (Papile I-IV)

## Tool Types

All tools use the shared `<report-output>` component (pill editor, copy, save, history) and share auth, storage, parser, clipboard. They differ in how input is collected and how scores are computed:

- **Point-based** (TI-RADS) — scored sections with option card grids, `renderToolForm()`, `calculateScore()` sums points. Each section has a color-coded risk level.
- **Decision-tree** (LI-RADS, Bosniak, Fleischner) — step-by-step wizard with custom DOM, custom calculator. Decision table lookup, not point summation.
- **Measurement** (Reimers, NASCET, Leg Length, Pectus) — numeric inputs → computed values via formulas (ratios, percentages, differences).
- **Category select** (AAST, Salter-Harris, BI-RADS, KL) — pick findings from a grid → auto-grade to highest category.
- **Response assessment** (RECIST, mRECIST, RAPNO) — measurement table → % change → response category (CR/PR/SD/PD).

## Shared Calculators

### AAST organs
AAST Liver, Spleen, Kidney, and Pancreas share `calculator.js` and `templates.js` from `src/tools/aast-liver/`. Each organ has only its own `definition.js` with organ-specific findings.

### Bone age
Bone Age (Sontag) imports its calculator from `src/tools/bone-age/` (G&P).

## Validation Status

Each tool shows a validation badge next to its name — red warning triangle for unvalidated, green check for validated. Controlled by the `VALIDATED_TOOLS` set in `src/data/tools-registry.js`. See comments in that file for the criteria to flip a tool from unvalidated → validated.

Currently: **all 42 tools are unvalidated** pending clinical review.
