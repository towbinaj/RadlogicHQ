const FINDINGS_BLOCKS = [
  { id: 'mode', label: 'Method', template: '{{modeLabel}} classification', enabled: true },
  { id: 'side', label: 'Side', template: 'Side: {{sideLabel}}', enabled: true, condition: 'sideProvided' },
  { id: 'alpha', label: 'Alpha Angle', template: 'Alpha angle: {{alphaLabel}}', enabled: true, condition: 'alphaProvided' },
  { id: 'beta', label: 'Beta Angle', template: 'Beta angle: {{betaLabel}}', enabled: true, condition: 'betaProvided' },
  { id: 'grade', label: 'Classification', template: '{{gradeLabel}}: {{description}}', enabled: true, condition: 'gradeProvided' },
];

function bts(blocks, headers, impression) {
  return { blocks: blocks.map((b) => ({ ...b })), sectionHeaders: headers, impression: { template: impression, enabled: true }, showPoints: false };
}

const SH = { findings: 'FINDINGS:', additionalFindings: 'Other findings:', impression: 'IMPRESSION:' };
const RH = { findings: '[STRUCTURED REPORT]', additionalFindings: '[OTHER FINDINGS]', impression: '[IMPRESSION]' };
const IMP = '{{sideLabel}} hip: {{gradeLabel}}.';

export const hipDysplasiaTemplates = {
  ps360: { label: 'PowerScribe 360', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  ps1: { label: 'PowerScribe One', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  radai: { label: 'RadAI Omni', ...bts([
    { id: 'grade', label: 'Classification', template: 'Hip_Dysplasia: {{gradeLabel}}', enabled: true, condition: 'gradeProvided' },
    { id: 'alpha', label: 'Alpha', template: 'Alpha: {{alphaLabel}}', enabled: true, condition: 'alphaProvided' },
  ], RH, IMP + '\n[END STRUCTURED REPORT]') },
};
