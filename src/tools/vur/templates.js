const FINDINGS_BLOCKS = [
  { id: 'mode', label: 'Modality', template: '{{modeLabel}}', enabled: true },
  { id: 'side', label: 'Side', template: 'Side: {{sideLabel}}', enabled: true, condition: 'sideProvided' },
  { id: 'phase', label: 'Phase', template: '{{phaseLabel}}', enabled: true, condition: 'phaseProvided' },
  { id: 'grade', label: 'VUR Grade', template: '{{gradeLabel}}: {{description}}', enabled: true, condition: 'gradeProvided' },
];

function bts(blocks, headers, impression) {
  return { blocks: blocks.map((b) => ({ ...b })), sectionHeaders: headers, impression: { template: impression, enabled: true }, showPoints: false };
}

const SH = { findings: 'FINDINGS:', additionalFindings: 'Other findings:', impression: 'IMPRESSION:' };
const RH = { findings: '[STRUCTURED REPORT]', additionalFindings: '[OTHER FINDINGS]', impression: '[IMPRESSION]' };
const IMP = '{{sideLabel}} vesicoureteral reflux, {{gradeLabel}}.';

export const vurTemplates = {
  ps360: { label: 'PowerScribe 360', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  ps1: { label: 'PowerScribe One', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  radai: { label: 'RadAI Omni', ...bts([
    { id: 'grade', label: 'VUR', template: 'VUR_Grade: {{gradeLabel}}', enabled: true, condition: 'gradeProvided' },
    { id: 'side', label: 'Side', template: 'Side: {{sideLabel}}', enabled: true, condition: 'sideProvided' },
  ], RH, IMP + '\n[END STRUCTURED REPORT]') },
};
