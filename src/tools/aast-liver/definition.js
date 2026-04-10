/**
 * AAST Liver Injury Scale (2018 revision) — definition.
 *
 * Reference: Kozar RA et al. J Trauma Acute Care Surg 2018;85(6):1119-1122.
 *
 * Each finding maps to a grade. The highest grade from all selected findings
 * determines the overall grade. Multiple Grade I/II injuries → advance to III.
 */

export const aastLiverDefinition = {
  id: 'aast-liver',
  name: 'AAST Liver',
  organ: 'Liver',

  categories: [
    {
      id: 'hematoma',
      label: 'Hematoma',
      findings: [
        { id: 'sub-lt10', label: 'Subcapsular, <10% surface area', grade: 1 },
        { id: 'sub-10-50', label: 'Subcapsular, 10–50% surface area', grade: 2 },
        { id: 'intra-lt10cm', label: 'Intraparenchymal, <10 cm', grade: 2 },
        { id: 'sub-gt50', label: 'Subcapsular, >50% or ruptured', grade: 3 },
        { id: 'intra-gt10cm', label: 'Intraparenchymal, >10 cm or expanding', grade: 3 },
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
      label: 'Parenchymal Disruption',
      findings: [
        { id: 'disrupt-25-75', label: '25–75% hepatic lobe (1–3 Couinaud segments)', grade: 4 },
        { id: 'disrupt-gt75', label: '>75% hepatic lobe (>3 Couinaud segments)', grade: 5 },
      ],
    },
    {
      id: 'vascular',
      label: 'Vascular Injury',
      findings: [
        { id: 'extrav-contained', label: 'Active bleeding — contained (intraparenchymal)', grade: 4 },
        { id: 'extrav-peritoneal', label: 'Active bleeding — extending into peritoneum', grade: 4 },
        { id: 'juxtahepatic', label: 'Juxtahepatic venous injury (IVC / central hepatic veins)', grade: 5 },
        { id: 'pseudoaneurysm', label: 'Pseudoaneurysm or arteriovenous fistula', grade: 5 },
      ],
    },
  ],

  parseRules: {},
};
