// The `grade` block uses a conditional on `gradeDescription` so that in
// bilateral mode (where description is empty to save space) we don't
// emit a trailing colon. `gradeLabel` already contains "Right: ... ,
// Left: ..." when bilateral, so a single line is the right level of
// detail for the findings block.
const FINDINGS_BLOCKS = [
  { id: 'mode', label: 'Classification', template: '{{modeLabel}}', enabled: true },
  { id: 'side', label: 'Side', template: 'Side: {{sideLabel}}', enabled: true, condition: 'sideProvided' },
  { id: 'aprpd', label: 'APRPD', template: 'APRPD: {{aprpdLabel}}', enabled: true, condition: 'aprpdProvided' },
  { id: 'grade', label: 'Grade', template: '{{gradeLabel}}{{#if gradeDescription}}: {{gradeDescription}}{{/if}}', enabled: true, condition: 'gradeProvided' },
  { id: 'management', label: 'Management', template: '{{management}}', enabled: true, condition: 'managementProvided' },
];

function bts(blocks, headers, impression) {
  return { blocks: blocks.map((b) => ({ ...b })), sectionHeaders: headers, impression: { template: impression, enabled: true }, showPoints: false };
}

const SH = { findings: 'FINDINGS:', additionalFindings: 'Other findings:', impression: 'IMPRESSION:' };
const RH = { findings: '[STRUCTURED REPORT]', additionalFindings: '[OTHER FINDINGS]', impression: '[IMPRESSION]' };
// Impression: for single-side the side label precedes the grade
// ("Right UTD P2"); for bilateral the gradeLabel already embeds both
// side prefixes ("Right: UTD P2, Left: UTD P1") so we omit sideLabel.
const IMP = '{{#unless bilateral}}{{sideLabel}} {{/unless}}{{gradeLabel}}.';

export const hydronephrosisTemplates = {
  ps360: { label: 'PowerScribe 360', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  ps1: { label: 'PowerScribe One', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  radai: { label: 'RadAI Omni', ...bts([
    { id: 'grade', label: 'Grade', template: 'Hydronephrosis: {{gradeLabel}}', enabled: true, condition: 'gradeProvided' },
    { id: 'aprpd', label: 'APRPD', template: 'APRPD: {{aprpdLabel}}', enabled: true, condition: 'aprpdProvided' },
  ], RH, IMP + '\n[END STRUCTURED REPORT]') },
};
