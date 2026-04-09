/**
 * Fleischner Society 2017 guidelines for incidental pulmonary nodules.
 * Decision-tree / lookup-table based.
 * Reference: https://doi.org/10.1148/radiol.2017161659
 */
export const fleischnerDefinition = {
  id: 'fleischner',
  name: 'Fleischner 2017',
  version: '1.0.0',
  description:
    'Fleischner Society guidelines for management of incidentally detected pulmonary nodules in adults.',
  cdeSetId: null,

  // Primary inputs rendered as compact inline row
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
      label: 'Size',
      inputType: 'float',
      min: 0.1,
      max: 100,
      step: 0.1,
      unit: 'mm',
      unitToggle: true,
      placeholder: 'e.g., 5',
    },
  ],

  // Decision inputs — rendered as button groups
  noduleType: {
    id: 'noduleType',
    label: 'Nodule Type',
    options: [
      { id: 'solid', label: 'Solid', tooltip: 'Completely solid attenuation, obscures the entire lung parenchyma' },
      { id: 'groundGlass', label: 'Ground Glass', tooltip: 'Hazy increased attenuation that does not obscure the underlying bronchial structures or pulmonary vessels (pure GGN)' },
      { id: 'partSolid', label: 'Part-Solid', tooltip: 'Mixed ground glass and solid components' },
    ],
  },

  noduleCount: {
    id: 'noduleCount',
    label: 'Number',
    options: [
      { id: 'single', label: 'Single' },
      { id: 'multiple', label: 'Multiple' },
    ],
  },

  riskLevel: {
    id: 'riskLevel',
    label: 'Risk',
    tooltip: 'High risk factors: smoking history, family history of lung cancer, upper lobe location, spiculated morphology, emphysema, pulmonary fibrosis',
    options: [
      { id: 'low', label: 'Low Risk', tooltip: 'Minimal or absent smoking history and no other known risk factors' },
      { id: 'high', label: 'High Risk', tooltip: 'Smoking history or other risk factors (upper lobe, spiculated, emphysema, fibrosis, family history)' },
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
        'solid': ['solid nodule', 'solid'],
        'partSolid': ['part-solid', 'part solid', 'partially solid', 'mixed'],
        'groundGlass': ['ground glass', 'ground-glass', 'ggn', 'ggo', 'subsolid'],
      },
    },
    'noduleCount': {
      options: {
        'single': ['single', 'solitary'],
        'multiple': ['multiple', 'several', 'numerous'],
      },
    },
    'riskLevel': {
      options: {
        'high': ['high risk', 'smoker', 'smoking', 'emphysema', 'fibrosis', 'spiculated'],
        'low': ['low risk', 'no risk factors', 'nonsmoker'],
      },
    },
  },
};
