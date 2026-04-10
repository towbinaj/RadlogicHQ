/**
 * RAPNO report templates (block-based).
 */

const FINDINGS_BLOCKS = [
  { id: 'variant', label: 'RAPNO Variant', template: 'RAPNO criteria: {{variantFullName}} ({{sequenceNote}})', enabled: true },
  { id: 'measurements', label: 'Target Measurements', template: '{{measurementText}}', enabled: true },
  { id: 'sums', label: 'Sum of Products', template: '{{sumText}}', enabled: true, condition: 'sumProvided' },
  { id: 'nonTarget', label: 'Non-target Disease', template: 'Non-target disease: {{nonTargetLabel}}', enabled: true, condition: 'nonTargetProvided' },
  { id: 'newLesion', label: 'New Lesions', template: 'New lesions: {{newLesionLabel}}', enabled: true, condition: 'newLesionProvided' },
  { id: 'clinical', label: 'Clinical Status', template: 'Clinical status: {{clinicalLabel}}', enabled: true, condition: 'clinicalProvided' },
  { id: 'steroids', label: 'Steroids', template: 'Steroids: {{steroidLabel}}', enabled: true, condition: 'steroidProvided' },
  { id: 'response', label: 'Overall Response', template: 'Overall response: {{overallResponse}} — {{overallResponseLabel}}', enabled: true },
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

const IMPRESSION_TEXT = '{{variantLabel}} RAPNO response: {{overallResponse}} — {{overallResponseLabel}}.';

export const rapnoTemplates = {
  ps360: { label: 'PowerScribe 360', ...buildTemplateSet(FINDINGS_BLOCKS, STANDARD_HEADERS, IMPRESSION_TEXT) },
  ps1: { label: 'PowerScribe One', ...buildTemplateSet(FINDINGS_BLOCKS, STANDARD_HEADERS, IMPRESSION_TEXT) },
  radai: {
    label: 'RadAI Omni',
    ...buildTemplateSet([
      { id: 'variant', label: 'RAPNO Variant', template: 'RAPNO_Criteria: {{variantFullName}}', enabled: true },
      { id: 'sequence', label: 'Sequence', template: 'Imaging_Sequence: {{sequenceNote}}', enabled: true },
      { id: 'measurements', label: 'Target Measurements', template: '{{measurementText}}', enabled: true },
      { id: 'sums', label: 'Sum of Products', template: 'Sum_of_Products_Baseline: {{baselineSum}}\nSum_of_Products_Current: {{currentSum}}\nPct_Change: {{pctLabel}}', enabled: true, condition: 'sumProvided' },
      { id: 'nonTarget', label: 'Non-target Disease', template: 'Non_Target: {{nonTargetLabel}}', enabled: true, condition: 'nonTargetProvided' },
      { id: 'newLesion', label: 'New Lesions', template: 'New_Lesions: {{newLesionLabel}}', enabled: true, condition: 'newLesionProvided' },
      { id: 'response', label: 'Overall Response', template: 'Overall_Response: {{overallResponse}}', enabled: true },
    ], RADAI_HEADERS, IMPRESSION_TEXT + '\n[END STRUCTURED REPORT]'),
  },
};
