const FINDINGS_BLOCKS = [
  { id: 'method', label: 'Method', template: 'Method: {{methodLabel}}', enabled: true },
  { id: 'sex', label: 'Sex', template: 'Sex: {{sexLabel}}', enabled: true, condition: 'sexProvided' },
  { id: 'chrono', label: 'Chronological Age', template: 'Chronological age: {{chronoLabel}}', enabled: true, condition: 'chronoProvided' },
  { id: 'boneAge', label: 'Bone Age', template: 'Bone age: {{boneAgeLabel}}', enabled: true, condition: 'boneAgeProvided' },
  { id: 'ossification', label: 'Ossification Centers', template: 'Ossification center count: {{ossificationCount}}', enabled: true, condition: 'ossificationProvided' },
  { id: 'difference', label: 'Difference', template: 'Difference: {{differenceLabel}}', enabled: true, condition: 'differenceProvided' },
  { id: 'interpretation', label: 'Interpretation', template: '{{interpretation}}', enabled: true, condition: 'interpretationProvided' },
  { id: 'normalRange', label: 'Normal Range', template: 'Normal range for age (chronological age +/- 2 SD, Greulich and Pyle Brush data): {{normalRangeLabel}}', enabled: true, condition: 'normalRangeProvided' },
  { id: 'interpretationNote', label: 'Interpretation Note', template: '{{interpretationNote}}', enabled: true, condition: 'interpretationNoteProvided' },
];

function bts(blocks, headers, impression) {
  return { blocks: blocks.map((b) => ({ ...b })), sectionHeaders: headers, impression: { template: impression, enabled: true }, showPoints: false };
}

const SH = { findings: 'FINDINGS:', additionalFindings: 'Other findings:', impression: 'IMPRESSION:' };
const RH = { findings: '[STRUCTURED REPORT]', additionalFindings: '[OTHER FINDINGS]', impression: '[IMPRESSION]' };
const IMP = '{{#if boneAgeProvided}}Bone age {{boneAgeLabel}} by {{methodLabel}} method.{{/if}}{{#if interpretationProvided}} {{interpretation}}.{{/if}}';

export const boneAgeTemplates = {
  ps360: { label: 'PowerScribe 360', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  ps1: { label: 'PowerScribe One', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  radai: { label: 'RadAI Omni', ...bts([
    { id: 'boneAge', label: 'Bone Age', template: 'Bone_Age: {{boneAgeLabel}}', enabled: true, condition: 'boneAgeProvided' },
    { id: 'method', label: 'Method', template: 'Method: {{methodLabel}}', enabled: true },
    { id: 'interpretation', label: 'Interpretation', template: 'Interpretation: {{interpretation}}', enabled: true, condition: 'interpretationProvided' },
  ], RH, IMP + '\n[END STRUCTURED REPORT]') },
};
