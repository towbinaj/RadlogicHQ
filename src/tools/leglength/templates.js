/**
 * Leg Length report templates (block-based).
 * Matches the standard institutional report format.
 */

const FINDINGS_BLOCKS = [
  { id: 'rightLength', label: 'Right Length', template: 'The right lower extremity measures {{rightLength}} cm.', enabled: true, condition: 'rightLengthProvided' },
  { id: 'leftLength', label: 'Left Length', template: 'The left lower extremity measures {{leftLength}} cm.', enabled: true, condition: 'leftLengthProvided' },
  { id: 'discrepancy', label: 'Discrepancy', template: '{{discrepancyLabel}}', enabled: true, condition: 'bothProvided' },
  { id: 'rightAlignment', label: 'Right Alignment', template: 'There is {{rightAlignmentLabel}} alignment of the RIGHT lower extremity at the knee.', enabled: true, condition: 'rightAlignmentProvided' },
  { id: 'leftAlignment', label: 'Left Alignment', template: 'There is {{leftAlignmentLabel}} alignment of the LEFT lower extremity at the knee.', enabled: true, condition: 'leftAlignmentProvided' },
  { id: 'physes', label: 'Physes', template: 'The physes are {{physesLabel}}.', enabled: true, condition: 'physesProvided' },
];

export const leglengthTemplates = {
  ps360: {
    label: 'PowerScribe 360',
    blocks: FINDINGS_BLOCKS.map((b) => ({ ...b })),
    sectionHeaders: {
      findings: 'FINDINGS:',
      additionalFindings: 'Other findings:',
      impression: 'IMPRESSION:',
    },
    impression: {
      template: 'Lower extremity lengths and alignment as described above.',
      enabled: true,
    },
    showPoints: false,
  },

  ps1: {
    label: 'PowerScribe One',
    blocks: FINDINGS_BLOCKS.map((b) => ({ ...b })),
    sectionHeaders: {
      findings: 'FINDINGS:',
      additionalFindings: 'Other findings:',
      impression: 'IMPRESSION:',
    },
    impression: {
      template: 'Lower extremity lengths and alignment as described above.',
      enabled: true,
    },
    showPoints: false,
  },

  radai: {
    label: 'RadAI Omni',
    blocks: [
      { id: 'rightLength', label: 'Right Length', template: 'Right_Lower_Extremity_cm: {{rightLength}}', enabled: true, condition: 'rightLengthProvided' },
      { id: 'leftLength', label: 'Left Length', template: 'Left_Lower_Extremity_cm: {{leftLength}}', enabled: true, condition: 'leftLengthProvided' },
      { id: 'discrepancy', label: 'Discrepancy', template: 'Longer_Side: {{longerSide}}\nDiscrepancy_cm: {{discrepancy}}', enabled: true, condition: 'bothProvided' },
      { id: 'rightAlignment', label: 'Right Alignment', template: 'Right_Alignment: {{rightAlignmentLabel}}', enabled: true, condition: 'rightAlignmentProvided' },
      { id: 'leftAlignment', label: 'Left Alignment', template: 'Left_Alignment: {{leftAlignmentLabel}}', enabled: true, condition: 'leftAlignmentProvided' },
      { id: 'physes', label: 'Physes', template: 'Physes: {{physesLabel}}', enabled: true, condition: 'physesProvided' },
    ],
    sectionHeaders: {
      findings: '[STRUCTURED REPORT]',
      additionalFindings: '[OTHER FINDINGS]',
      impression: '[IMPRESSION]',
    },
    impression: {
      template: 'Lower extremity lengths and alignment as described above.\n[END STRUCTURED REPORT]',
      enabled: true,
    },
    showPoints: false,
  },
};
