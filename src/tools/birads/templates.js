/**
 * BI-RADS report templates.
 */

const FINDINGS_BLOCKS = [
  { id: 'modality', label: 'Modality', template: 'Modality: {{modalityLabel}}', enabled: true, condition: 'modalityProvided' },
  { id: 'laterality', label: 'Laterality', template: 'Laterality: {{lateralityLabel}}', enabled: true, condition: 'lateralityProvided' },
  { id: 'category', label: 'BI-RADS Category', template: 'BI-RADS: {{categoryLabel}}', enabled: true, condition: 'categoryProvided' },
  { id: 'risk', label: 'Malignancy Risk', template: 'Malignancy risk: {{risk}}', enabled: true, condition: 'riskProvided' },
  { id: 'management', label: 'Management', template: 'Recommendation: {{management}}', enabled: true, condition: 'managementProvided' },
];

function buildTemplateSet(blocks, headers, impression) {
  return {
    blocks: blocks.map((b) => ({ ...b })),
    sectionHeaders: headers,
    impression: { template: impression, enabled: true },
    showPoints: false,
  };
}

const STANDARD_HEADERS = { findings: 'FINDINGS:', additionalFindings: 'Other findings:', impression: 'IMPRESSION:' };
const RADAI_HEADERS = { findings: '[STRUCTURED REPORT]', additionalFindings: '[OTHER FINDINGS]', impression: '[IMPRESSION]' };
const IMPRESSION = '{{categoryLabel}}. {{management}}.';

export const biradsTemplates = {
  ps360: { label: 'PowerScribe 360', ...buildTemplateSet(FINDINGS_BLOCKS, STANDARD_HEADERS, IMPRESSION) },
  ps1: { label: 'PowerScribe One', ...buildTemplateSet(FINDINGS_BLOCKS, STANDARD_HEADERS, IMPRESSION) },
  radai: {
    label: 'RadAI Omni',
    ...buildTemplateSet([
      { id: 'category', label: 'BI-RADS', template: 'BIRADS_Category: {{category}}', enabled: true, condition: 'categoryProvided' },
      { id: 'risk', label: 'Risk', template: 'Malignancy_Risk: {{risk}}', enabled: true, condition: 'riskProvided' },
      { id: 'management', label: 'Management', template: 'Recommendation: {{management}}', enabled: true, condition: 'managementProvided' },
    ], RADAI_HEADERS, IMPRESSION + '\n[END STRUCTURED REPORT]'),
  },
};
