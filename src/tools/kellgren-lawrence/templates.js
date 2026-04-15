// In bilateral mode `findings` is empty (no single description fits
// two sides), so the findings block uses a nested conditional.
// `gradeLabel` in bilateral mode already embeds "Right: ..., Left: ..."
// -- so the grade block reads "Bilateral knee osteoarthritis: Right:
// Grade 3, Left: Grade 2", which is verbose but readable.
const FINDINGS_BLOCKS = [
  { id: 'grade', label: 'KL Grade', template: '{{sideLabel}} {{jointLabel}} osteoarthritis: {{gradeLabel}}', enabled: true, condition: 'gradeProvided' },
  { id: 'findings', label: 'Findings', template: '{{#if findings}}{{findings}}{{/if}}', enabled: true, condition: 'gradeProvided' },
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
