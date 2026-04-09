/**
 * Fleischner 2017 report templates (block-based).
 */

const FINDINGS_BLOCKS = [
  { id: 'noduleLabel', label: 'Nodule Label', template: '{{noduleLabel}}:', enabled: true, locked: true },
  { id: 'location', label: 'Location', template: 'Location: {{location}}', enabled: true, condition: 'locationProvided' },
  { id: 'size', label: 'Size', template: 'Size: {{sizeMm}} mm ({{sizeCm}} cm)', enabled: true, condition: 'sizeProvided' },
  { id: 'noduleType', label: 'Nodule Type', template: 'Nodule type: {{noduleTypeLabel}}', enabled: true },
  { id: 'noduleCount', label: 'Number', template: 'Number: {{noduleCountLabel}}', enabled: true },
  { id: 'riskLevel', label: 'Risk Level', template: 'Risk: {{riskLevelLabel}}', enabled: true },
  { id: 'recommendation', label: 'Recommendation', template: 'Fleischner Recommendation: {{recommendationFullLabel}}', enabled: true },
  { id: 'management', label: 'Management', template: '{{management}}', enabled: true },
];

export const fleischnerTemplates = {
  ps360: {
    label: 'PowerScribe 360',
    blocks: FINDINGS_BLOCKS.map((b) => ({ ...b })),
    sectionHeaders: {
      findings: 'FINDINGS:',
      additionalFindings: 'ADDITIONAL FINDINGS:',
      impression: 'IMPRESSION:',
    },
    impression: {
      template: '{{impressionSummary}}',
      enabled: true,
    },
    showPoints: false,
  },

  ps1: {
    label: 'PowerScribe One',
    blocks: FINDINGS_BLOCKS.map((b) => ({ ...b })),
    sectionHeaders: {
      findings: 'FINDINGS:',
      additionalFindings: 'ADDITIONAL FINDINGS:',
      impression: 'IMPRESSION:',
    },
    impression: {
      template: '{{impressionSummary}}',
      enabled: true,
    },
    showPoints: false,
  },

  radai: {
    label: 'RadAI Omni',
    blocks: [
      { id: 'noduleLabel', label: 'Nodule Label', template: '[{{noduleLabel}}]', enabled: true, locked: true },
      { id: 'location', label: 'Location', template: 'Location: {{location}}', enabled: true, condition: 'locationProvided' },
      { id: 'size', label: 'Size', template: 'Size_mm: {{sizeMm}}', enabled: true, condition: 'sizeProvided' },
      { id: 'noduleType', label: 'Nodule Type', template: 'Nodule_Type: {{noduleTypeLabel}}', enabled: true },
      { id: 'noduleCount', label: 'Number', template: 'Number: {{noduleCountLabel}}', enabled: true },
      { id: 'riskLevel', label: 'Risk Level', template: 'Risk: {{riskLevelLabel}}', enabled: true },
      { id: 'recommendation', label: 'Recommendation', template: 'Fleischner_Recommendation: {{recommendationFullLabel}}', enabled: true },
      { id: 'management', label: 'Management', template: 'Management: {{management}}', enabled: true },
    ],
    sectionHeaders: {
      findings: '[STRUCTURED REPORT]',
      additionalFindings: '[ADDITIONAL FINDINGS]',
      impression: '[IMPRESSION]',
    },
    impression: {
      template: '{{impressionSummary}}\n[END STRUCTURED REPORT]',
      enabled: true,
    },
    showPoints: false,
  },
};
