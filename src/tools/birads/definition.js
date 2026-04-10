/**
 * BI-RADS (Breast Imaging Reporting and Data System) — definition.
 *
 * Reference: ACR BI-RADS Atlas, 5th Edition (2013).
 */

export const biradsDefinition = {
  id: 'birads',
  name: 'BI-RADS',

  categories: [
    { id: '0', label: '0 — Incomplete', management: 'Additional imaging evaluation needed', risk: 'N/A' },
    { id: '1', label: '1 — Negative', management: 'Routine screening', risk: '0%' },
    { id: '2', label: '2 — Benign', management: 'Routine screening', risk: '0%' },
    { id: '3', label: '3 — Probably Benign', management: 'Short-interval follow-up (6 months)', risk: '<2%' },
    { id: '4a', label: '4a — Low Suspicion', management: 'Tissue diagnosis', risk: '2–10%' },
    { id: '4b', label: '4b — Moderate Suspicion', management: 'Tissue diagnosis', risk: '10–50%' },
    { id: '4c', label: '4c — High Suspicion', management: 'Tissue diagnosis', risk: '50–95%' },
    { id: '5', label: '5 — Highly Suggestive of Malignancy', management: 'Tissue diagnosis', risk: '>95%' },
    { id: '6', label: '6 — Known Biopsy-Proven Malignancy', management: 'Surgical excision when clinically appropriate', risk: '100%' },
  ],

  modalityOptions: [
    { id: 'mammo', label: 'Mammography' },
    { id: 'us', label: 'Ultrasound' },
    { id: 'mri', label: 'MRI' },
  ],

  lateralityOptions: [
    { id: 'right', label: 'Right' },
    { id: 'left', label: 'Left' },
    { id: 'bilateral', label: 'Bilateral' },
  ],

  parseRules: {},
};
