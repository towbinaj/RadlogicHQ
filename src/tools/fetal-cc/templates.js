const FINDINGS_BLOCKS = [
  { id: 'ga', label: 'GA', template: 'Gestational age: {{gaLabel}}', enabled: true, condition: 'gaProvided' },
  { id: 'cc', label: 'CC Length', template: 'Corpus callosum length: {{ccLabel}} (expected {{expectedLabel}}, {{interpretation}})', enabled: true, condition: 'interpretationProvided' },
  { id: 'absent', label: 'CC Absent', template: 'Corpus callosum: Absent — agenesis', enabled: true, condition: 'absentProvided' },
];

function bts(blocks, headers, impression) {
  return { blocks: blocks.map((b) => ({ ...b })), sectionHeaders: headers, impression: { template: impression, enabled: true }, showPoints: false };
}

const SH = { findings: 'FINDINGS:', additionalFindings: 'Other findings:', impression: 'IMPRESSION:' };
const RH = { findings: '[STRUCTURED REPORT]', additionalFindings: '[OTHER FINDINGS]', impression: '[IMPRESSION]' };
const IMP = 'Corpus callosum: {{ccLabel}}. {{interpretation}}.';

export const fetalCCTemplates = {
  ps360: { label: 'PowerScribe 360', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  ps1: { label: 'PowerScribe One', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  radai: { label: 'RadAI Omni', ...bts([
    { id: 'cc', label: 'CC', template: 'CC_Length: {{ccLabel}}', enabled: true, condition: 'ccProvided' },
    { id: 'interpretation', label: 'Interpretation', template: 'Interpretation: {{interpretation}}', enabled: true, condition: 'interpretationProvided' },
  ], RH, IMP + '\n[END STRUCTURED REPORT]') },
};
