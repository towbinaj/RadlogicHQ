const FINDINGS_BLOCKS = [
  { id: 'score', label: 'Agatston Score', template: 'Coronary artery calcium score (Agatston): {{scoreLabel}}', enabled: true, condition: 'scoreProvided' },
  { id: 'category', label: 'Category', template: '{{categoryLabel}}', enabled: true, condition: 'scoreProvided' },
  { id: 'risk', label: 'Risk', template: 'Risk: {{risk}}', enabled: true, condition: 'riskProvided' },
  { id: 'rec', label: 'Recommendation', template: '{{recommendation}}', enabled: true, condition: 'recommendationProvided' },
];

function bts(blocks, headers, impression) {
  return { blocks: blocks.map((b) => ({ ...b })), sectionHeaders: headers, impression: { template: impression, enabled: true }, showPoints: false };
}

const SH = { findings: 'FINDINGS:', additionalFindings: 'Other findings:', impression: 'IMPRESSION:' };
const RH = { findings: '[STRUCTURED REPORT]', additionalFindings: '[OTHER FINDINGS]', impression: '[IMPRESSION]' };
const IMP = 'Agatston score {{scoreLabel}} ({{categoryLabel}}). {{risk}} cardiovascular risk.';

export const agatstonTemplates = {
  ps360: { label: 'PowerScribe 360', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  ps1: { label: 'PowerScribe One', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  radai: { label: 'RadAI Omni', ...bts([
    { id: 'score', label: 'Score', template: 'Agatston_Score: {{scoreLabel}}', enabled: true, condition: 'scoreProvided' },
    { id: 'risk', label: 'Risk', template: 'Risk: {{risk}}', enabled: true, condition: 'riskProvided' },
  ], RH, IMP + '\n[END STRUCTURED REPORT]') },
};
