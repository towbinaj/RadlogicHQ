const FINDINGS_BLOCKS = [
  { id: 'mode', label: 'Classification', template: '{{modeLabel}}', enabled: true },
  { id: 'side', label: 'Side', template: 'Side: {{sideLabel}}', enabled: true, condition: 'sideProvided' },
  { id: 'aprpd', label: 'APRPD', template: 'APRPD: {{aprpdLabel}}', enabled: true, condition: 'aprpdProvided' },
  { id: 'grade', label: 'Grade', template: '{{gradeLabel}}: {{gradeDescription}}', enabled: true, condition: 'gradeProvided' },
  { id: 'management', label: 'Management', template: '{{management}}', enabled: true, condition: 'managementProvided' },
];

function bts(blocks, headers, impression) {
  return { blocks: blocks.map((b) => ({ ...b })), sectionHeaders: headers, impression: { template: impression, enabled: true }, showPoints: false };
}

const SH = { findings: 'FINDINGS:', additionalFindings: 'Other findings:', impression: 'IMPRESSION:' };
const RH = { findings: '[STRUCTURED REPORT]', additionalFindings: '[OTHER FINDINGS]', impression: '[IMPRESSION]' };
const IMP = '{{sideLabel}} {{gradeLabel}}.';

export const hydronephrosisTemplates = {
  ps360: { label: 'PowerScribe 360', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  ps1: { label: 'PowerScribe One', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  radai: { label: 'RadAI Omni', ...bts([
    { id: 'grade', label: 'Grade', template: 'Hydronephrosis: {{gradeLabel}}', enabled: true, condition: 'gradeProvided' },
    { id: 'aprpd', label: 'APRPD', template: 'APRPD: {{aprpdLabel}}', enabled: true, condition: 'aprpdProvided' },
  ], RH, IMP + '\n[END STRUCTURED REPORT]') },
};
