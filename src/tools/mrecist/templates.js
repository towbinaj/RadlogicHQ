const FINDINGS_BLOCKS = [
  { id: 'sums', label: 'Enhancing Diameters', template: 'Sum of enhancing diameters: Baseline {{baselineSum}} mm, Current {{currentSum}} mm ({{pctLabel}})', enabled: true, condition: 'currentSumProvided' },
  { id: 'nonTarget', label: 'Non-target', template: 'Non-target disease: {{nonTargetLabel}}', enabled: true, condition: 'nonTargetProvided' },
  { id: 'newLesion', label: 'New Lesions', template: 'New lesions: {{newLesionLabel}}', enabled: true, condition: 'newLesionProvided' },
  { id: 'response', label: 'Response', template: 'mRECIST response: {{overallResponse}} — {{overallResponseLabel}}', enabled: true },
];

function bts(blocks, headers, impression) {
  return { blocks: blocks.map((b) => ({ ...b })), sectionHeaders: headers, impression: { template: impression, enabled: true }, showPoints: false };
}

const SH = { findings: 'FINDINGS:', additionalFindings: 'Other findings:', impression: 'IMPRESSION:' };
const RH = { findings: '[STRUCTURED REPORT]', additionalFindings: '[OTHER FINDINGS]', impression: '[IMPRESSION]' };
const IMP = 'mRECIST: {{overallResponse}} — {{overallResponseLabel}}.';

export const mrecistTemplates = {
  ps360: { label: 'PowerScribe 360', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  ps1: { label: 'PowerScribe One', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  radai: { label: 'RadAI Omni', ...bts([
    { id: 'sums', label: 'Sums', template: 'Enhancing_Baseline: {{baselineSum}}\nEnhancing_Current: {{currentSum}}\nPct_Change: {{pctLabel}}', enabled: true, condition: 'currentSumProvided' },
    { id: 'response', label: 'Response', template: 'mRECIST_Response: {{overallResponse}}', enabled: true },
  ], RH, IMP + '\n[END STRUCTURED REPORT]') },
};
