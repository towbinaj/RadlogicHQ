/**
 * BI-RADS (Breast Imaging Reporting and Data System) — definition.
 *
 * Reference: ACR BI-RADS v2025 Manual (Newell MS, Destounis SV, Leung JWT,
 *   DeMartini WB, Lee CH, Eby PR, eds.). American College of Radiology, 2025.
 *   Summary of changes: Minichetti P et al. BI-RADS v2025: Key Updates and
 *   Implications for Breast Imaging Practice. AJR 2026;227:e2635051.
 *   doi:10.2214/AJR.26.35051
 *
 * v2025 changes reflected here (category structure and malignancy-probability
 * thresholds are unchanged from the 2013 5th edition):
 * - Category 0 has two scenarios: additional imaging evaluation vs comparison
 *   with prior examinations ('0' and '0p'; both display and code as 0).
 * - Category 6: biopsy-proven malignancy before definitive local therapy,
 *   including during neoadjuvant therapy even with complete imaging response;
 *   timing and type of definitive treatment set by the multidisciplinary team.
 * - Category 4A/4B/4C now explicitly applies to MRI as well.
 * - Contrast-enhanced mammography (CEM) formally incorporated; DBT and
 *   synthetic mammography are part of mammography.
 * - Standardized clinical indication categories (optional here).
 * Lexicon descriptor changes do not affect this category-level tool.
 *
 * All report text is ASCII and free of HL7 delimiters.
 */

const NOT_IF_SUSPICIOUS = 'Do not use category 0 when a finding is already suspicious: assign category 4 or 5.';
const SUB4 = 'Subcategories 4A, 4B and 4C apply to mammography, ultrasound, CEM and (since v2025) MRI.';

export const biradsDefinition = {
  id: 'birads',
  name: 'BI-RADS',
  version: 'v2025',

  categories: [
    { id: '0', display: '0', label: '0 - Incomplete: Needs Additional Imaging Evaluation', management: 'Additional imaging evaluation needed', risk: 'N/A', title: NOT_IF_SUSPICIOUS },
    { id: '0p', display: '0', label: '0 - Incomplete: Needs Comparison with Prior Examinations', management: 'Comparison with prior examinations needed', risk: 'N/A', title: NOT_IF_SUSPICIOUS },
    { id: '1', label: '1 - Negative', management: 'Routine screening', risk: '0%' },
    { id: '2', label: '2 - Benign', management: 'Routine screening', risk: '0%' },
    { id: '3', label: '3 - Probably Benign', management: 'Short-interval follow-up (6 months)', risk: '<2%' },
    { id: '4a', display: '4A', label: '4A - Low Suspicion', management: 'Tissue diagnosis', risk: '2-10%', title: SUB4 },
    { id: '4b', display: '4B', label: '4B - Moderate Suspicion', management: 'Tissue diagnosis', risk: '10-50%', title: SUB4 },
    { id: '4c', display: '4C', label: '4C - High Suspicion', management: 'Tissue diagnosis', risk: '50-95%', title: SUB4 },
    { id: '5', label: '5 - Highly Suggestive of Malignancy', management: 'Tissue diagnosis', risk: '>95%' },
    { id: '6', label: '6 - Known Biopsy-Proven Malignancy', management: 'Definitive treatment as determined by the multidisciplinary team', risk: '100%',
      title: 'Biopsy-proven malignancy before definitive local therapy, including during neoadjuvant therapy, even with a complete imaging response. Definitive treatment is not necessarily surgical.' },
  ],

  modalityOptions: [
    { id: 'mammo', label: 'Mammography', title: 'Digital mammography, digital breast tomosynthesis (DBT) and synthetic mammography.' },
    { id: 'us', label: 'Ultrasound' },
    { id: 'mri', label: 'MRI' },
    { id: 'cem', label: 'Contrast-enhanced mammography', short: 'CEM' },
  ],

  // v2025 standardized clinical indication categories (optional).
  indicationOptions: [
    { id: 'screening', label: 'Screening' },
    { id: 'diagnostic', label: 'Diagnostic evaluation' },
    { id: 'known-cancer', label: 'Known breast cancer evaluation' },
  ],

  lateralityOptions: [
    { id: 'right', label: 'Right' },
    { id: 'left', label: 'Left' },
    { id: 'bilateral', label: 'Bilateral' },
  ],

  parseRules: {
    category: {
      options: {
        '0': ['incomplete', 'birads 0', 'bi-rads 0', 'additional imaging needed', 'additional imaging evaluation'],
        // Kept specific on purpose: v2025 reports open with a "comparison with
        // prior examinations" section, which must not read as category 0.
        '0p': [
          'pending comparison with prior', 'awaiting comparison with prior', 'awaiting prior',
          'pending prior', 'needs comparison with prior', 'need for comparison with prior',
          'prior examinations needed', 'prior exams needed',
        ],
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

    // Manual laterality rule (overrides auto-generated rule from
    // lateralityOptions). Picks the FIRST laterality mention in the
    // text so reports like "Left breast mass, BI-RADS 4b. Right breast
    // negative." attribute laterality to the left (the side where the
    // concerning finding is) rather than the right (where the negative
    // finding happens to be mentioned second). BI-RADS is a single-
    // category assessment by design, so first-match works for the
    // common case of "one finding side + the other side negative".
    laterality: {
      pattern: /\b(right|left|bilateral|both)\b/i,
      group: 1,
      transform: (m) => m[1].toLowerCase() === 'both' ? 'bilateral' : m[1].toLowerCase(),
    },
  },
};
