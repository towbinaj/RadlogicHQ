const FINDINGS_BLOCKS = [
  { id: 'side', label: 'Side', template: 'Side: {{sideLabel}}', enabled: true, condition: 'sideProvided' },
  { id: 'grade', label: 'GMH Grade', template: '{{gradeLabel}}: {{description}}', enabled: true, condition: 'gradeProvided' },
  { id: 'prognosis', label: 'Prognosis', template: 'Prognosis: {{prognosis}}', enabled: true, condition: 'prognosisProvided' },
];

function bts(blocks, headers, impression) {
  return { blocks: blocks.map((b) => ({ ...b })), sectionHeaders: headers, impression: { template: impression, enabled: true }, showPoints: false };
}

const SH = { findings: 'FINDINGS:', additionalFindings: 'Other findings:', impression: 'IMPRESSION:' };
const RH = { findings: '[STRUCTURED REPORT]', additionalFindings: '[OTHER FINDINGS]', impression: '[IMPRESSION]' };
const IMP = '{{sideLabel}} germinal matrix hemorrhage, {{gradeLabel}}.';

export const gmhTemplates = {
  ps360: { label: 'PowerScribe 360', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  ps1: { label: 'PowerScribe One', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  radai: { label: 'RadAI Omni', ...bts([
    { id: 'grade', label: 'Grade', template: 'GMH_Grade: {{grade}}', enabled: true, condition: 'gradeProvided' },
    { id: 'side', label: 'Side', template: 'Side: {{sideLabel}}', enabled: true, condition: 'sideProvided' },
  ], RH, IMP + '\n[END STRUCTURED REPORT]') },
};
