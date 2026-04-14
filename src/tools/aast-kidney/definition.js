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

  // Hand-written parseRules to match typical radiology dictation phrasings,
  // since the AAST finding labels themselves are too long to appear literally
  // in dictated reports (e.g. "Subcapsular, nonexpanding" never appears
  // verbatim; dictators write "subcapsular hematoma").
  //
  // The original label is kept as the first keyword in each option so that
  // machine-generated text containing the exact label still matches.
  parseRules: {
    selectedFindings: {
      multi: true,
      options: {
        // ---- Hematoma ----
        'sub-nonexpanding': [
          'Subcapsular, nonexpanding',
          'subcapsular hematoma',
          'sub-capsular hematoma',
          'subcapsular blood',
        ],
        'perirenal-nonexpanding': [
          'Perirenal, nonexpanding',
          'perirenal hematoma',
          'perinephric hematoma',
          'perirenal blood',
          'perinephric blood',
        ],

        // ---- Laceration ----
        'lac-lt1': [
          '<1 cm depth, no urinary extravasation',
          'superficial laceration',
          'shallow laceration',
          'minor laceration',
          'small laceration',
          'subcentimeter laceration',
          'less than 1 cm laceration',
        ],
        'lac-gt1': [
          '>1 cm depth, no collecting system rupture or urinary extravasation',
          'deep laceration',
          'large laceration',
          'major laceration',
          'greater than 1 cm laceration',
        ],

        // ---- Vascular injury ----
        'contained': [
          'Contained vascular injury (pseudoaneurysm / AVF)',
          'pseudoaneurysm',
          'arteriovenous fistula',
          'renal avf',
          'contained vascular injury',
        ],
        'active-sub': [
          'Active bleeding confined to Gerota fascia',
          'active bleeding confined to gerota',
          'contained active bleeding',
          'active extravasation within gerota',
        ],
        'active-beyond': [
          'Active bleeding beyond Gerota fascia into retroperitoneum',
          'active bleeding beyond gerota',
          'active extravasation into retroperitoneum',
          'retroperitoneal bleeding',
        ],

        // ---- Collecting System and Parenchyma ----
        'urine-extrav': [
          'Laceration with urinary extravasation',
          'urinary extravasation',
          'urinoma',
          'urine leak',
        ],
        'lac-pelvis': [
          'Laceration extending into renal pelvis with urinary extravasation',
          'renal pelvis laceration',
          'laceration into renal pelvis',
          'pelvicalyceal injury',
          'collecting system rupture',
        ],
        'devasc-segmental': [
          'Segmental renal artery or vein injury with devascularization',
          'segmental devascularization',
          'segmental renal artery injury',
          'segmental renal vein injury',
          'segmental infarct',
        ],
        'shattered': [
          'Shattered kidney',
          'shattered',
          'fragmented kidney',
        ],
        'devasc-main': [
          'Main renal artery or vein laceration / avulsion / thrombosis',
          'main renal artery laceration',
          'main renal artery avulsion',
          'main renal artery thrombosis',
          'main renal vein laceration',
          'main renal vein thrombosis',
          'renal pedicle injury',
        ],
        'devascularized': [
          'Devascularized kidney with active bleeding',
          'devascularized kidney',
          'global devascularization',
        ],
      },
    },
  },
  parseSegmentation: { type: 'laterality' },
};
