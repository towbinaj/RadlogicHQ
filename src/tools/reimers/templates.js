/**
 * Reimers' Migration Index report templates (block-based).
 */

const FINDINGS_BLOCKS = [
  { id: 'header', label: 'Header', template: 'Proximal femoral migration percentage:', enabled: true, locked: true },
  { id: 'rightPct', label: 'Right', template: 'Right: {{rightPct}}%', enabled: true, condition: 'rightProvided' },
  { id: 'leftPct', label: 'Left', template: 'Left: {{leftPct}}%', enabled: true, condition: 'leftProvided' },
  { id: 'coxaValga', label: 'Coxa Valga', template: '{{coxaValgaLabel}}', enabled: true, condition: 'coxaValgaProvided' },
  { id: 'normal', label: 'Normal Pelvis', template: 'Remaining portions of the osseous pelvis are normal. There is no visible fracture or soft tissue abnormality.', enabled: true },
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

const IMPRESSION_TEXT = 'Apparent coxa valga alignment of the proximal femurs with migration percentages as above.';

export const reimersTemplates = {
  ps360: { label: 'PowerScribe 360', ...buildTemplateSet(FINDINGS_BLOCKS, STANDARD_HEADERS, IMPRESSION_TEXT) },
  ps1: { label: 'PowerScribe One', ...buildTemplateSet(FINDINGS_BLOCKS, STANDARD_HEADERS, IMPRESSION_TEXT) },
  radai: {
    label: 'RadAI Omni',
    ...buildTemplateSet([
      { id: 'header', label: 'Header', template: '[Reimers Migration Index]', enabled: true, locked: true },
      { id: 'rightPct', label: 'Right', template: 'Right_Migration_Pct: {{rightPct}}', enabled: true, condition: 'rightProvided' },
      { id: 'leftPct', label: 'Left', template: 'Left_Migration_Pct: {{leftPct}}', enabled: true, condition: 'leftProvided' },
      { id: 'coxaValga', label: 'Coxa Valga', template: 'Coxa_Valga: {{coxaValga}}', enabled: true, condition: 'coxaValgaProvided' },
    ], RADAI_HEADERS, IMPRESSION_TEXT + '\n[END STRUCTURED REPORT]'),
  },
};
