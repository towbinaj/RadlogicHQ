/**
 * NASCET report templates.
 */

const FINDINGS_BLOCKS = [
  { id: 'psv', label: 'ICA PSV', template: 'ICA peak systolic velocity: {{psvLabel}}', enabled: true, condition: 'psvProvided' },
  { id: 'edv', label: 'ICA EDV', template: 'ICA end-diastolic velocity: {{edvLabel}}', enabled: true, condition: 'edvProvided' },
  { id: 'ratio', label: 'ICA/CCA ratio', template: 'ICA/CCA PSV ratio: {{ratioLabel}}', enabled: true, condition: 'ratioProvided' },
  { id: 'plaque', label: 'Plaque estimate', template: 'Plaque estimate: {{plaqueLabel}}', enabled: true, condition: 'plaqueProvided' },
  { id: 'stenosis', label: 'Stenosis', template: '{{sideLabel}} ICA stenosis ({{methodLabel}}): {{pctLabel}}', enabled: true, condition: 'pctProvided' },
  { id: 'severity', label: 'Severity', template: 'Severity: {{severity}}', enabled: true, condition: 'severityProvided' },
  { id: 'note', label: 'Measurement check', template: 'Note: {{note}}', enabled: true, condition: 'noteProvided' },
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
const IMPRESSION = '{{impressionText}}';

export const nascetTemplates = {
  ps360: { label: 'PowerScribe 360', ...buildTemplateSet(FINDINGS_BLOCKS, STANDARD_HEADERS, IMPRESSION) },
  ps1: { label: 'PowerScribe One', ...buildTemplateSet(FINDINGS_BLOCKS, STANDARD_HEADERS, IMPRESSION) },
  radai: {
    label: 'RadAI Omni',
    ...buildTemplateSet([
      { id: 'stenosis', label: 'Stenosis', template: 'ICA_Stenosis: {{pctLabel}}\nMethod: {{methodLabel}}', enabled: true, condition: 'pctProvided' },
      { id: 'psv', label: 'ICA PSV', template: 'ICA_PSV_cm_s: {{psvLabel}}', enabled: true, condition: 'psvProvided' },
      { id: 'side', label: 'Side', template: 'Side: {{sideLabel}}', enabled: true, condition: 'sideProvided' },
      { id: 'severity', label: 'Severity', template: 'Severity: {{severity}}', enabled: true, condition: 'severityProvided' },
    ], RADAI_HEADERS, IMPRESSION + '\n[END STRUCTURED REPORT]'),
  },
};
