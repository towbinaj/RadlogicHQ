/**
 * NASCET report templates.
 */

const FINDINGS_BLOCKS = [
  { id: 'stenosis', label: 'NASCET Stenosis', template: '{{sideLabel}} ICA stenosis (NASCET): {{pctLabel}}', enabled: true, condition: 'pctProvided' },
  { id: 'severity', label: 'Severity', template: 'Severity: {{severity}}', enabled: true, condition: 'severityProvided' },
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
const IMPRESSION = '{{sideLabel}} ICA: {{pctLabel}} stenosis by NASCET criteria ({{severity}}).';

export const nascetTemplates = {
  ps360: { label: 'PowerScribe 360', ...buildTemplateSet(FINDINGS_BLOCKS, STANDARD_HEADERS, IMPRESSION) },
  ps1: { label: 'PowerScribe One', ...buildTemplateSet(FINDINGS_BLOCKS, STANDARD_HEADERS, IMPRESSION) },
  radai: {
    label: 'RadAI Omni',
    ...buildTemplateSet([
      { id: 'stenosis', label: 'NASCET', template: 'NASCET_Stenosis: {{pctLabel}}', enabled: true, condition: 'pctProvided' },
      { id: 'side', label: 'Side', template: 'Side: {{sideLabel}}', enabled: true, condition: 'sideProvided' },
      { id: 'severity', label: 'Severity', template: 'Severity: {{severity}}', enabled: true, condition: 'severityProvided' },
    ], RADAI_HEADERS, IMPRESSION + '\n[END STRUCTURED REPORT]'),
  },
};
