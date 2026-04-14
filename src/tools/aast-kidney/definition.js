/**
 * AAST Kidney Injury Scale (2018 revision) — definition.
 *
 * Reference: Kozar RA et al. J Trauma Acute Care Surg 2018;85(6):1119-1122.
 */

export const aastKidneyDefinition = {
  id: 'aast-kidney',
  name: 'AAST Kidney',
  organ: 'Kidney',

  categories: [
    {
      id: 'hematoma',
      label: 'Hematoma',
      findings: [
        { id: 'sub-nonexpanding', label: 'Subcapsular, nonexpanding', grade: 1 },
        { id: 'perirenal-nonexpanding', label: 'Perirenal, nonexpanding', grade: 2 },
      ],
    },
    {
      id: 'laceration',
      label: 'Laceration',
      findings: [
        { id: 'lac-lt1', label: '<1 cm depth, no urinary extravasation', grade: 2 },
        { id: 'lac-gt1', label: '>1 cm depth, no collecting system rupture or urinary extravasation', grade: 3 },
      ],
    },
    {
      id: 'vascular',
      label: 'Vascular Injury',
      findings: [
        { id: 'contained', label: 'Contained vascular injury (pseudoaneurysm / AVF)', grade: 3 },
        { id: 'active-sub', label: 'Active bleeding confined to Gerota fascia', grade: 4 },
        { id: 'active-beyond', label: 'Active bleeding beyond Gerota fascia into retroperitoneum', grade: 4 },
      ],
    },
    {
      id: 'collecting',
      label: 'Collecting System and Parenchyma',
      findings: [
        { id: 'urine-extrav', label: 'Laceration with urinary extravasation', grade: 4 },
        { id: 'lac-pelvis', label: 'Laceration extending into renal pelvis with urinary extravasation', grade: 4 },
        { id: 'devasc-segmental', label: 'Segmental renal artery or vein injury with devascularization', grade: 4 },
        { id: 'shattered', label: 'Shattered kidney', grade: 5 },
        { id: 'devasc-main', label: 'Main renal artery or vein laceration / avulsion / thrombosis', grade: 5 },
        { id: 'devascularized', label: 'Devascularized kidney with active bleeding', grade: 5 },
      ],
    },
  ],

  parseRules: {},
};
