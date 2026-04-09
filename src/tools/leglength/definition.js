/**
 * Leg Length Discrepancy — Total measurement.
 * Simple measurement tool, not a scoring/classification system.
 */
export const leglengthDefinition = {
  id: 'leglength',
  name: 'Leg Length',
  version: '1.0.0',
  description:
    'Lower extremity length discrepancy measurement with alignment assessment.',
  cdeSetId: null,

  alignmentOptions: [
    { id: 'neutral', label: 'Neutral' },
    { id: 'mild-valgus', label: 'Mild valgus' },
    { id: 'moderate-valgus', label: 'Moderate valgus' },
    { id: 'severe-valgus', label: 'Severe valgus' },
    { id: 'mild-varus', label: 'Mild varus' },
    { id: 'moderate-varus', label: 'Moderate varus' },
    { id: 'severe-varus', label: 'Severe varus' },
  ],

  physesOptions: [
    { id: 'open', label: 'Open' },
    { id: 'closing', label: 'Closing' },
    { id: 'closed', label: 'Closed' },
  ],

  parseRules: {
    'rightLength': {
      pattern: /right\s+(?:lower\s+extremity|leg)\s+(?:measures?\s+)?(\d*\.?\d+)\s*cm/i,
      group: 1,
      transform: (m) => parseFloat(m[1]),
    },
    'leftLength': {
      pattern: /left\s+(?:lower\s+extremity|leg)\s+(?:measures?\s+)?(\d*\.?\d+)\s*cm/i,
      group: 1,
      transform: (m) => parseFloat(m[1]),
    },
  },
};
