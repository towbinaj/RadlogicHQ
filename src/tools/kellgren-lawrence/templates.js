const FINDINGS_BLOCKS = [
  { id: 'grade', label: 'KL Grade', template: '{{sideLabel}} {{jointLabel}} osteoarthritis: {{gradeLabel}}', enabled: true, condition: 'gradeProvided' },
  { id: 'findings', label: 'Findings', template: '{{findings}}', enabled: true, condition: 'gradeProvided' },
];

function bts(blocks, headers, impression) {
  return { blocks: blocks.map((b) => ({ ...b })), sectionHeaders: headers, impression: { template: impression, enabled: true }, showPoints: false };
}

const SH = { findings: 'FINDINGS:', additionalFindings: 'Other findings:', impression: 'IMPRESSION:' };
const RH = { findings: '[STRUCTURED REPORT]', additionalFindings: '[OTHER FINDINGS]', impression: '[IMPRESSION]' };
const IMP = '{{sideLabel}} {{jointLabel}} osteoarthritis, {{gradeLabel}}.';

export const klTemplates = {
  ps360: { label: 'PowerScribe 360', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  ps1: { label: 'PowerScribe One', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  radai: { label: 'RadAI Omni', ...bts([
    { id: 'grade', label: 'KL Grade', template: 'KL_Grade: {{grade}}', enabled: true, condition: 'gradeProvided' },
    { id: 'joint', label: 'Joint', template: 'Joint: {{sideLabel}} {{jointLabel}}', enabled: true, condition: 'jointProvided' },
  ], RH, IMP + '\n[END STRUCTURED REPORT]') },
};
