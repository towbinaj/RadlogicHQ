/**
 * Balthazar / CTSI report templates.
 */

const FINDINGS_BLOCKS = [
  { id: 'grade', label: 'Balthazar Grade', template: 'Balthazar grade: {{gradeLabel}} ({{gradePoints}} points)', enabled: true, condition: 'gradeProvided' },
  { id: 'necrosis', label: 'Necrosis', template: 'Pancreatic necrosis: {{necrosisLabel}} ({{necrosisPoints}} points)', enabled: true, condition: 'necrosisProvided' },
  { id: 'ctsi', label: 'CTSI', template: 'CT Severity Index: {{ctsiLabel}}', enabled: true, condition: 'ctsiProvided' },
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
const IMPRESSION = 'CT Severity Index {{ctsiLabel}} ({{severity}}).';

export const balthazarTemplates = {
  ps360: { label: 'PowerScribe 360', ...buildTemplateSet(FINDINGS_BLOCKS, STANDARD_HEADERS, IMPRESSION) },
  ps1: { label: 'PowerScribe One', ...buildTemplateSet(FINDINGS_BLOCKS, STANDARD_HEADERS, IMPRESSION) },
  radai: {
    label: 'RadAI Omni',
    ...buildTemplateSet([
      { id: 'grade', label: 'Grade', template: 'Balthazar_Grade: {{gradeLabel}}', enabled: true, condition: 'gradeProvided' },
      { id: 'necrosis', label: 'Necrosis', template: 'Necrosis: {{necrosisLabel}}', enabled: true, condition: 'necrosisProvided' },
      { id: 'ctsi', label: 'CTSI', template: 'CTSI: {{ctsiLabel}}', enabled: true, condition: 'ctsiProvided' },
      { id: 'severity', label: 'Severity', template: 'Severity: {{severity}}', enabled: true, condition: 'severityProvided' },
    ], RADAI_HEADERS, IMPRESSION + '\n[END STRUCTURED REPORT]'),
  },
};
