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

  parseRules: {
    category: {
      options: {
        '0': ['incomplete', 'birads 0', 'bi-rads 0', 'additional imaging needed'],
        '1': ['negative', 'birads 1', 'bi-rads 1', 'no finding'],
        '2': ['benign', 'birads 2', 'bi-rads 2', 'benign finding'],
        '3': ['probably benign', 'birads 3', 'bi-rads 3', 'short-interval follow-up', 'short interval follow-up'],
        '4a': ['low suspicion', 'birads 4a', 'bi-rads 4a'],
        '4b': ['moderate suspicion', 'birads 4b', 'bi-rads 4b'],
        '4c': ['high suspicion', 'birads 4c', 'bi-rads 4c'],
        '5': ['highly suggestive', 'birads 5', 'bi-rads 5'],
        '6': ['known malignancy', 'biopsy-proven', 'birads 6', 'bi-rads 6'],
      },
    },
  },
};
