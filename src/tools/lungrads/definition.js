/**
 * Lung-RADS v2022 — Lung Cancer Screening CT.
 * Decision-tree classification.
 * Reference: ACR Lung-RADS v2022 Assessment Categories.
 */
export const lungradsDefinition = {
  id: 'lungrads',
  name: 'Lung-RADS v2022',
  version: '1.0.0',
  description:
    'Lung-RADS v2022 — structured reporting for lung cancer screening CT.',
  cdeSetId: null,

  primaryInputs: [
    {
      id: 'location',
      label: 'Lobe',
      inputType: 'single-select',
      options: [
        { id: 'rul', label: 'Right upper lobe' },
        { id: 'rml', label: 'Right middle lobe' },
        { id: 'rll', label: 'Right lower lobe' },
        { id: 'lul', label: 'Left upper lobe' },
        { id: 'lll', label: 'Left lower lobe' },
        { id: 'lingula', label: 'Lingula' },
      ],
    },
    {
      id: 'size',
      label: 'Size (long axis)',
      inputType: 'float',
      min: 0.1,
      max: 100,
      step: 0.1,
      unit: 'mm',
      unitToggle: true,
      placeholder: 'e.g., 6',
    },
  ],

  noduleType: {
    id: 'noduleType',
    label: 'Nodule Type',
    options: [
      { id: 'solid', label: 'Solid', tooltip: 'Completely solid attenuation' },
      { id: 'partSolid', label: 'Part-Solid', tooltip: 'Mixed ground glass and solid components — measure solid component separately' },
      { id: 'groundGlass', label: 'Ground Glass (GGN)', tooltip: 'Pure ground glass nodule — no solid component' },
    ],
  },

  // Solid component size for part-solid nodules
  solidSize: {
    id: 'solidSize',
    label: 'Solid Component Size (mm)',
  },

  // Prior comparison
  priorComparison: {
    id: 'priorComparison',
    label: 'Prior Comparison',
    options: [
      { id: 'none', label: 'No Prior' },
      { id: 'new', label: 'New Nodule', tooltip: 'Not present on prior CT' },
      { id: 'stable', label: 'Stable', tooltip: 'Unchanged from prior' },
      { id: 'growing', label: 'Growing', tooltip: 'Increased in size compared to prior' },
      { id: 'slowGrowing', label: 'Slowly Growing', tooltip: 'GGN/part-solid growing slowly over multiple CTs' },
    ],
  },

  // Additional suspicious features
  suspicious: {
    id: 'suspicious',
    label: 'Additional Suspicious Features',
    options: [
      { id: 'none', label: 'None' },
      { id: 'present', label: 'Present', tooltip: 'Spiculation, lymphadenopathy, pleural involvement, or other features raising concern for malignancy' },
    ],
  },

  // Multi-nodule pastes like "Nodule 1: ... Nodule 2: ..." (or numbered
  // "1. ... 2. ...") split into per-nodule segments so each maps to its
  // own nodule tab.
  parseSegmentation: { type: 'itemIndex', itemLabel: 'Nodule' },

  parseRules: {
    'size': {
      pattern: /(\d*\.?\d+)\s*mm/,
      group: 1,
      transform: (m) => parseFloat(m[1]),
    },
    'location': {
      options: {
        'rul': ['right upper lobe', 'rul'],
        'rml': ['right middle lobe', 'rml'],
        'rll': ['right lower lobe', 'rll'],
        'lul': ['left upper lobe', 'lul'],
        'lll': ['left lower lobe', 'lll'],
        'lingula': ['lingula'],
      },
    },
    'noduleType': {
      options: {
        // 'part-solid nodule' must be longer than 'solid nodule' so
        // longest-match picks partSolid for "part-solid nodule" dictations.
        'solid': ['solid nodule', 'solid'],
        'partSolid': ['part-solid nodule', 'part solid nodule', 'part-solid', 'part solid'],
        'groundGlass': ['ground-glass nodule', 'ground glass nodule', 'ground glass', 'ground-glass', 'ggn', 'ggo'],
      },
    },
  },
};
