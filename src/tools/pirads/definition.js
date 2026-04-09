/**
 * PI-RADS v2.1 — Prostate Imaging Reporting and Data System.
 * Zone-dependent decision tree on MRI.
 * Reference: Turkbey B et al. Radiology 2019;292(2):320-333.
 */
export const piradsDefinition = {
  id: 'pirads',
  name: 'PI-RADS v2.1',
  version: '1.0.0',
  description:
    'Prostate Imaging Reporting and Data System v2.1 — MRI-based risk stratification for clinically significant prostate cancer.',
  cdeSetId: null,

  primaryInputs: [
    {
      id: 'location',
      label: 'Zone / Location',
      inputType: 'single-select',
      options: [
        { id: 'pz', label: 'Peripheral zone (PZ)' },
        { id: 'tz', label: 'Transition zone (TZ)' },
        { id: 'cz', label: 'Central zone (CZ)' },
        { id: 'afs', label: 'Anterior fibromuscular stroma (AFS)' },
      ],
    },
    {
      id: 'size',
      label: 'Size',
      inputType: 'float',
      min: 0.1,
      max: 100,
      step: 0.1,
      unit: 'mm',
      unitToggle: true,
      placeholder: 'e.g., 15',
    },
  ],

  // T2-weighted scoring (1-5)
  t2Score: {
    id: 't2Score',
    label: 'T2-Weighted',
    options: [
      { id: '1', label: '1', tooltip: 'Uniform hyperintense signal (normal)' },
      { id: '2', label: '2', tooltip: 'Linear/wedge-shaped or diffuse mild hypointensity, or indistinct margin with adjacent normal-appearing prostate' },
      { id: '3', label: '3', tooltip: 'Heterogeneous or non-circumscribed, moderate hypointensity (PZ); heterogeneous with obscured margins (TZ)' },
      { id: '4', label: '4', tooltip: 'Circumscribed, homogeneous moderate hypointense focus <1.5 cm (PZ); lenticular or non-circumscribed, homogeneous, moderately hypointense <1.5 cm (TZ)' },
      { id: '5', label: '5', tooltip: '≥1.5 cm or definite extraprostatic extension/invasive behavior (PZ); same as 4 but ≥1.5 cm or extraprostatic extension (TZ)' },
    ],
  },

  // DWI scoring (1-5)
  dwiScore: {
    id: 'dwiScore',
    label: 'DWI / ADC',
    options: [
      { id: '1', label: '1', tooltip: 'No abnormality on ADC and high b-value DWI' },
      { id: '2', label: '2', tooltip: 'Indistinct hypointense on ADC' },
      { id: '3', label: '3', tooltip: 'Focal mildly/moderately hypointense on ADC and iso/mildly hyperintense on high b-value DWI' },
      { id: '4', label: '4', tooltip: 'Focal markedly hypointense on ADC and markedly hyperintense on high b-value DWI; <1.5 cm' },
      { id: '5', label: '5', tooltip: 'Same as 4 but ≥1.5 cm or definite extraprostatic extension/invasive behavior' },
    ],
  },

  // DCE (positive or negative)
  dce: {
    id: 'dce',
    label: 'DCE (Dynamic Contrast Enhancement)',
    options: [
      { id: 'negative', label: 'Negative', tooltip: 'No early or contemporaneous enhancement, or diffuse/multifocal enhancement not corresponding to a focal finding on T2W or DWI' },
      { id: 'positive', label: 'Positive', tooltip: 'Focal, earlier than or contemporaneous with enhancement of adjacent normal prostatic tissue, corresponding to suspicious finding on T2W and/or DWI' },
    ],
  },

  // EPE
  epe: {
    id: 'epe',
    label: 'Extraprostatic Extension (EPE)',
    options: [
      { id: 'absent', label: 'Absent' },
      { id: 'present', label: 'Present', tooltip: 'Broad capsular contact, irregularity, direct tumor extension, or seminal vesicle invasion' },
    ],
  },

  parseRules: {
    'size': {
      pattern: /(\d*\.?\d+)\s*mm/,
      group: 1,
      transform: (m) => parseFloat(m[1]),
    },
    'location': {
      options: {
        'pz': ['peripheral zone', 'pz'],
        'tz': ['transition zone', 'tz'],
        'cz': ['central zone', 'cz'],
        'afs': ['anterior fibromuscular', 'afs'],
      },
    },
  },
};
