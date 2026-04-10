/**
 * Cobb Kyphosis/Lordosis measurement — definition.
 */

export const kyphosisDefinition = {
  id: 'kyphosis',
  name: 'Kyphosis / Lordosis',

  measurementTypes: [
    { id: 'thoracic-kyphosis', label: 'Thoracic Kyphosis (T4-T12)', normal: '20–40°', abnormal: '>40–45° (Scheuermann)' },
    { id: 'lumbar-lordosis', label: 'Lumbar Lordosis (L1-S1)', normal: '40–60°', abnormal: 'Outside normal range' },
  ],

  wedgingOptions: [
    { id: 'none', label: 'None' },
    { id: 'present', label: 'Present (≥5° in ≥3 adjacent vertebrae)' },
  ],

  parseRules: {},
};
