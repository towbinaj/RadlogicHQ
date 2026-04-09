/**
 * Leg Length report templates (block-based).
 * Supports total and segmental modes with separate block sets.
 */

// --- Total mode blocks ---
const TOTAL_BLOCKS = [
  { id: 'rightLength', label: 'Right Length', template: 'The right lower extremity measures {{rightLength}} cm.', enabled: true, condition: 'rightLengthProvided' },
  { id: 'leftLength', label: 'Left Length', template: 'The left lower extremity measures {{leftLength}} cm.', enabled: true, condition: 'leftLengthProvided' },
  { id: 'discrepancy', label: 'Discrepancy', template: '{{discrepancyLabel}}', enabled: true, condition: 'bothProvided' },
  { id: 'rightAlignment', label: 'Right Alignment', template: 'There is {{rightAlignmentLabel}} alignment of the RIGHT lower extremity at the knee.', enabled: true, condition: 'rightAlignmentProvided' },
  { id: 'leftAlignment', label: 'Left Alignment', template: 'There is {{leftAlignmentLabel}} alignment of the LEFT lower extremity at the knee.', enabled: true, condition: 'leftAlignmentProvided' },
  { id: 'physes', label: 'Physes', template: 'The physes are {{physesLabel}}.', enabled: true, condition: 'physesProvided' },
];

// --- Segmental mode blocks ---
const SEGMENTAL_BLOCKS = [
  { id: 'table', label: 'Measurements', template: '{{measurementTable}}', enabled: true, condition: 'hasAnySegment' },
  { id: 'rightAlignment', label: 'Right Alignment', template: 'There is {{rightAlignmentLabel}} alignment of the RIGHT lower extremity at the knee.', enabled: true, condition: 'rightAlignmentProvided' },
  { id: 'leftAlignment', label: 'Left Alignment', template: 'There is {{leftAlignmentLabel}} alignment of the LEFT lower extremity at the knee.', enabled: true, condition: 'leftAlignmentProvided' },
  { id: 'physes', label: 'Physes', template: 'The physes are {{physesLabel}}.', enabled: true, condition: 'physesProvided' },
];

function buildTemplateSet(blocks, headers, impression) {
  return {
    blocks: blocks.map((b) => ({ ...b })),
    sectionHeaders: headers,
    impression: { template: impression, enabled: true },
    showPoints: false,
  };
}

const STANDARD_HEADERS = {
  findings: 'FINDINGS:',
  additionalFindings: 'Other findings:',
  impression: 'IMPRESSION:',
};

const RADAI_HEADERS = {
  findings: '[STRUCTURED REPORT]',
  additionalFindings: '[OTHER FINDINGS]',
  impression: '[IMPRESSION]',
};

// --- Total mode templates ---
export const leglengthTemplates = {
  ps360: { label: 'PowerScribe 360', ...buildTemplateSet(TOTAL_BLOCKS, STANDARD_HEADERS, 'Lower extremity lengths and alignment as described above.') },
  ps1: { label: 'PowerScribe One', ...buildTemplateSet(TOTAL_BLOCKS, STANDARD_HEADERS, 'Lower extremity lengths and alignment as described above.') },
  radai: {
    label: 'RadAI Omni',
    ...buildTemplateSet([
      { id: 'rightLength', label: 'Right Length', template: 'Right_Lower_Extremity_cm: {{rightLength}}', enabled: true, condition: 'rightLengthProvided' },
      { id: 'leftLength', label: 'Left Length', template: 'Left_Lower_Extremity_cm: {{leftLength}}', enabled: true, condition: 'leftLengthProvided' },
      { id: 'discrepancy', label: 'Discrepancy', template: 'Longer_Side: {{longerSide}}\nDiscrepancy_cm: {{discrepancy}}', enabled: true, condition: 'bothProvided' },
      { id: 'rightAlignment', label: 'Right Alignment', template: 'Right_Alignment: {{rightAlignmentLabel}}', enabled: true, condition: 'rightAlignmentProvided' },
      { id: 'leftAlignment', label: 'Left Alignment', template: 'Left_Alignment: {{leftAlignmentLabel}}', enabled: true, condition: 'leftAlignmentProvided' },
      { id: 'physes', label: 'Physes', template: 'Physes: {{physesLabel}}', enabled: true, condition: 'physesProvided' },
    ], RADAI_HEADERS, 'Lower extremity lengths and alignment as described above.\n[END STRUCTURED REPORT]'),
  },
};

// --- Segmental mode templates ---
export const segmentalTemplates = {
  ps360: { label: 'PowerScribe 360', ...buildTemplateSet(SEGMENTAL_BLOCKS, STANDARD_HEADERS, 'Lower extremity lengths and alignment as described above.') },
  ps1: { label: 'PowerScribe One', ...buildTemplateSet(SEGMENTAL_BLOCKS, STANDARD_HEADERS, 'Lower extremity lengths and alignment as described above.') },
  radai: { label: 'RadAI Omni', ...buildTemplateSet(SEGMENTAL_BLOCKS, RADAI_HEADERS, 'Lower extremity lengths and alignment as described above.\n[END STRUCTURED REPORT]') },
};
