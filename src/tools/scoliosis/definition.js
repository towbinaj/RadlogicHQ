/**
 * Scoliosis tool definition — option enums and vertebra constants.
 */

export const VERTEBRAE = [
  'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7',
  'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12',
  'L1', 'L2', 'L3', 'L4', 'L5',
  'S1',
];

export const scoliosisDefinition = {
  id: 'scoliosis',
  name: 'Scoliosis',

  curveDirectionOptions: [
    { id: 'dextro', label: 'Dextro' },
    { id: 'levo', label: 'Levo' },
  ],

  curveRegionOptions: [
    { id: 'cervical', label: 'Cervical' },
    { id: 'cervicothoracic', label: 'Cervicothoracic' },
    { id: 'thoracic', label: 'Thoracic' },
    { id: 'thoracolumbar', label: 'Thoracolumbar' },
    { id: 'lumbar', label: 'Lumbar' },
    { id: 'lumbosacral', label: 'Lumbosacral' },
  ],

  hardwareOptions: [
    { id: 'none', label: 'None' },
    { id: 'present', label: 'Present' },
  ],

  scoliosisTypeOptions: [
    { id: 'na', label: 'N/A' },
    { id: 'idiopathic', label: 'Idiopathic' },
    { id: 'congenital', label: 'Congenital' },
    { id: 'infantile', label: 'Infantile' },
    { id: 'neuromuscular', label: 'Neuromuscular' },
    { id: 'syndrome', label: 'Syndrome related' },
    { id: 'unknown', label: 'Unknown' },
  ],

  kyphosisOptions: [
    { id: 'normal', label: 'Normal' },
    { id: 'na', label: 'N/A' },
    { id: 'increased', label: 'Increased' },
    { id: 'decreased', label: 'Decreased' },
  ],

  pelvicObliquityOptions: [
    { id: 'none', label: 'None' },
    { id: 'present', label: 'Present' },
  ],

  vertebralAbnormalityOptions: [
    { id: 'none', label: 'None' },
    { id: 'present', label: 'Present' },
  ],

  ribAbnormalityOptions: [
    { id: 'none', label: 'None' },
    { id: 'present', label: 'Present' },
  ],

  triradiateOptions: [
    { id: 'open', label: 'Open' },
    { id: 'closing', label: 'Closing' },
    { id: 'closed', label: 'Closed' },
    { id: 'not-visualized', label: 'Not visualized' },
  ],

  parseRules: {
    cobbAngle: {
      pattern: /(\d+(?:\.\d+)?)\s*(?:degree|°|deg)/i,
      group: 1,
      transform: (m) => parseFloat(m[1]),
    },
    risserGrade: {
      pattern: /risser\s*(\d)/i,
      group: 1,
      transform: (m) => parseInt(m[1], 10),
    },
  },
};
