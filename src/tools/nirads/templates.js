const FINDINGS_BLOCKS = [
  { id: 'primary', label: 'Primary Site', template: 'NI-RADS Primary: {{primaryLabel}}', enabled: true, condition: 'primaryProvided' },
  { id: 'primaryMgmt', label: 'Primary Management', template: 'Recommendation: {{primaryManagement}}', enabled: true, condition: 'primaryProvided' },
  { id: 'neck', label: 'Neck', template: 'NI-RADS Neck: {{neckLabel}}', enabled: true, condition: 'neckProvided' },
  { id: 'neckMgmt', label: 'Neck Management', template: 'Recommendation: {{neckManagement}}', enabled: true, condition: 'neckProvided' },
];

function bts(blocks, headers, impression) {
  return { blocks: blocks.map((b) => ({ ...b })), sectionHeaders: headers, impression: { template: impression, enabled: true }, showPoints: false };
}

const SH = { findings: 'FINDINGS:', additionalFindings: 'Other findings:', impression: 'IMPRESSION:' };
const RH = { findings: '[STRUCTURED REPORT]', additionalFindings: '[OTHER FINDINGS]', impression: '[IMPRESSION]' };
const IMP = 'NI-RADS Primary {{primaryCategory}}, Neck {{neckCategory}}.';

export const niradsTemplates = {
  ps360: { label: 'PowerScribe 360', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  ps1: { label: 'PowerScribe One', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  radai: { label: 'RadAI Omni', ...bts([
    { id: 'primary', label: 'Primary', template: 'NIRADS_Primary: {{primaryCategory}}', enabled: true, condition: 'primaryProvided' },
    { id: 'neck', label: 'Neck', template: 'NIRADS_Neck: {{neckCategory}}', enabled: true, condition: 'neckProvided' },
  ], RH, IMP + '\n[END STRUCTURED REPORT]') },
};
