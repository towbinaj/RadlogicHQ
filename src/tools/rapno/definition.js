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
    fullName: 'Medulloblastoma and Leptomeningeal Seeding',
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

  // Multi-target pastes like "Target 1: ... Target 2: ..." (or numbered
  // markers) split into per-target segments so each maps to its own
  // target row in the bidimensional table.
  parseSegmentation: { type: 'itemIndex', itemLabel: 'Target' },

  parseRules: {
    // Bidimensional measurement. Accepts all common forms:
    //   "20 x 15 mm"    (single trailing unit)
    //   "20 mm x 15 mm" (unit on both values)
    //   "20 × 15 mm"    (multiplication sign U+00D7)
    // Returns { d1, d2 }; the handler routes to curD1 / curD2.
    dimensions: {
      pattern: /(\d*\.?\d+)\s*(?:mm)?\s*[x\u00d7]\s*(\d*\.?\d+)\s*mm/,
      group: 0,
      transform: (m) => ({ d1: parseFloat(m[1]), d2: parseFloat(m[2]) }),
    },

    // Single-dimension fallback (only used if `dimensions` doesn't match).
    // Routes to curD1 in the handler; curD2 stays null for user to fill.
    size: {
      pattern: /(\d*\.?\d+)\s*mm/,
      group: 1,
      transform: (m) => parseFloat(m[1]),
    },

    // Per-target brain region. IDs feed directly into target.location.
    location: {
      options: {
        'Frontal lobe': ['frontal lobe', 'frontal'],
        'Parietal lobe': ['parietal lobe', 'parietal'],
        'Temporal lobe': ['temporal lobe', 'temporal'],
        'Occipital lobe': ['occipital lobe', 'occipital'],
        'Pons': ['pons', 'pontine'],
        'Medulla': ['medulla', 'medullary'],
        'Cerebellum': ['cerebellum', 'cerebellar'],
        'Thalamus': ['thalamus', 'thalamic'],
        'Basal ganglia': ['basal ganglia', 'basal ganglion'],
        'Corpus callosum': ['corpus callosum', 'callosal'],
        'Brainstem': ['brain stem', 'brainstem'],
        'Spinal cord': ['spinal cord', 'intramedullary'],
      },
    },

    nonTarget: {
      options: {
        'absent': ['non-target absent', 'non-target cr', 'nontarget absent', 'nontarget cr', 'no non-target', 'complete response non-target'],
        'present': ['non-target present', 'nontarget present', 'residual non-target'],
        'progression': ['non-target progression', 'nontarget progression', 'unequivocal non-target progression'],
      },
    },
    newLesion: {
      options: {
        'no': ['no new lesion', 'no new lesions', 'no new tumor', 'no new tumors'],
        'yes': ['new lesion', 'new lesions', 'new tumor', 'new enhancement', 'new nodule'],
      },
    },
    clinicalStatus: {
      options: {
        'stable': ['clinically stable', 'neurologically stable'],
        'improved': ['clinically improved', 'neurologically improved'],
        'worsened': ['clinically worsened', 'neurologically worsened', 'clinical decline'],
      },
    },
    steroidDose: {
      options: {
        'stable-decreased': ['stable steroids', 'decreased steroids', 'reduced steroids', 'steroid taper', 'off steroids'],
        'increased': ['increased steroids', 'steroid increase', 'escalated steroids'],
      },
    },
  },
};
