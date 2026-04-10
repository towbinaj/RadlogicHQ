/**
 * RAPNO definition — variant configs and option enums.
 *
 * References:
 *   HGG: Erker C et al. Lancet Oncol 2020;21(6):e317-e329.
 *   LGG: Fangusaro J et al. Lancet Oncol 2020;21(6):e305-e316.
 *   DIPG/DMG: Cooney TM et al. Lancet Oncol 2020;21(6):e330-e336.
 *   Medulloblastoma: Warren KE et al. Neuro Oncol 2018;20(1):13-23.
 */

export const VARIANTS = {
  hgg: {
    id: 'hgg',
    label: 'HGG',
    fullName: 'High-Grade Glioma',
    sequence: 'T1 post-contrast',
    hasMinorResponse: true,
    prThreshold: -50,    // ≥50% decrease = PR
    minrThreshold: -25,  // 25–49% decrease = Minor Response
    pdThreshold: 25,     // ≥25% increase from nadir = PD
  },
  lgg: {
    id: 'lgg',
    label: 'LGG',
    fullName: 'Low-Grade Glioma',
    sequence: 'T2/FLAIR',
    hasMinorResponse: true,
    prThreshold: -50,
    minrThreshold: -25,
    pdThreshold: 25,
  },
  dipg: {
    id: 'dipg',
    label: 'DIPG/DMG',
    fullName: 'Diffuse Intrinsic Pontine / Midline Glioma',
    sequence: 'T2/FLAIR',
    hasMinorResponse: false,
    prThreshold: -25,    // ≥25% decrease = PR (lower threshold)
    minrThreshold: null,
    pdThreshold: 25,
  },
  medullo: {
    id: 'medullo',
    label: 'Medulloblastoma',
    fullName: 'Medulloblastoma & Leptomeningeal Seeding',
    sequence: 'T1 post-contrast',
    hasMinorResponse: false,
    prThreshold: -50,
    minrThreshold: null,
    pdThreshold: 25,
  },
};

export const rapnoDefinition = {
  id: 'rapno',
  name: 'RAPNO',

  nonTargetOptions: [
    { id: 'absent', label: 'Absent (CR)' },
    { id: 'present', label: 'Present (non-CR/non-PD)' },
    { id: 'progression', label: 'Unequivocal progression' },
  ],

  newLesionOptions: [
    { id: 'no', label: 'No' },
    { id: 'yes', label: 'Yes' },
  ],

  clinicalStatusOptions: [
    { id: 'stable', label: 'Stable' },
    { id: 'improved', label: 'Improved' },
    { id: 'worsened', label: 'Worsened' },
  ],

  steroidOptions: [
    { id: 'stable-decreased', label: 'Stable / Decreased' },
    { id: 'increased', label: 'Increased' },
  ],

  parseRules: {},
};
