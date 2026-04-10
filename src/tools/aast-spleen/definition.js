/**
 * AAST Spleen Injury Scale (2018 revision) — definition.
 *
 * Reference: Kozar RA et al. J Trauma Acute Care Surg 2018;85(6):1119-1122.
 */

export const aastSpleenDefinition = {
  id: 'aast-spleen',
  name: 'AAST Spleen',
  organ: 'Spleen',

  categories: [
    {
      id: 'hematoma',
      label: 'Hematoma',
      findings: [
        { id: 'sub-lt10', label: 'Subcapsular, <10% surface area', grade: 1 },
        { id: 'sub-10-50', label: 'Subcapsular, 10–50% surface area', grade: 2 },
        { id: 'intra-lt5cm', label: 'Intraparenchymal, <5 cm', grade: 2 },
        { id: 'sub-gt50', label: 'Subcapsular, >50% or ruptured', grade: 3 },
        { id: 'intra-gte5cm', label: 'Intraparenchymal, \u22655 cm or expanding', grade: 3 },
      ],
    },
    {
      id: 'laceration',
      label: 'Laceration',
      findings: [
        { id: 'lac-lt1', label: '<1 cm parenchymal depth', grade: 1 },
        { id: 'lac-1-3', label: '1–3 cm parenchymal depth', grade: 2 },
        { id: 'lac-gt3', label: '>3 cm parenchymal depth', grade: 3 },
      ],
    },
    {
      id: 'disruption',
      label: 'Devascularization',
      findings: [
        { id: 'devasc-gt25', label: '>25% devascularization', grade: 4 },
        { id: 'shattered', label: 'Shattered spleen / complete devascularization', grade: 5 },
      ],
    },
    {
      id: 'vascular',
      label: 'Vascular Injury',
      findings: [
        { id: 'pseudoaneurysm', label: 'Pseudoaneurysm or arteriovenous fistula', grade: 4 },
        { id: 'extrav-contained', label: 'Active bleeding — contained within capsule', grade: 4 },
        { id: 'extrav-peritoneal', label: 'Active bleeding — extending into peritoneum', grade: 5 },
      ],
    },
  ],

  parseRules: {},
};
