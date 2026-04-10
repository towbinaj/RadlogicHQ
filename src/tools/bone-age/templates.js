const FINDINGS_BLOCKS = [
  { id: 'method', label: 'Method', template: 'Method: {{modeLabel}}', enabled: true },
  { id: 'sex', label: 'Sex', template: 'Sex: {{sexLabel}}', enabled: true, condition: 'sexProvided' },
  { id: 'chrono', label: 'Chronological Age', template: 'Chronological age: {{chronoLabel}}', enabled: true, condition: 'chronoProvided' },
  { id: 'boneAge', label: 'Bone Age', template: 'Bone age: {{boneAgeLabel}}', enabled: true, condition: 'boneAgeProvided' },
  { id: 'ossification', label: 'Ossification Centers', template: 'Ossification center count: {{ossificationCount}}', enabled: true, condition: 'ossificationProvided' },
  { id: 'difference', label: 'Difference', template: 'Difference: {{differenceLabel}}', enabled: true, condition: 'differenceProvided' },
  { id: 'interpretation', label: 'Interpretation', template: '{{interpretation}}', enabled: true, condition: 'interpretationProvided' },
];

function bts(blocks, headers, impression) {
  return { blocks: blocks.map((b) => ({ ...b })), sectionHeaders: headers, impression: { template: impression, enabled: true }, showPoints: false };
}

const SH = { findings: 'FINDINGS:', additionalFindings: 'Other findings:', impression: 'IMPRESSION:' };
const RH = { findings: '[STRUCTURED REPORT]', additionalFindings: '[OTHER FINDINGS]', impression: '[IMPRESSION]' };
const IMP = 'Bone age {{boneAgeLabel}} by {{modeLabel}} method. {{interpretation}}.';

export const boneAgeTemplates = {
  ps360: { label: 'PowerScribe 360', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  ps1: { label: 'PowerScribe One', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  radai: { label: 'RadAI Omni', ...bts([
    { id: 'boneAge', label: 'Bone Age', template: 'Bone_Age: {{boneAgeLabel}}', enabled: true, condition: 'boneAgeProvided' },
    { id: 'method', label: 'Method', template: 'Method: {{modeLabel}}', enabled: true },
    { id: 'interpretation', label: 'Interpretation', template: 'Interpretation: {{interpretation}}', enabled: true, condition: 'interpretationProvided' },
  ], RH, IMP + '\n[END STRUCTURED REPORT]') },
};
