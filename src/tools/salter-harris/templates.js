const FINDINGS_BLOCKS = [
  { id: 'type', label: 'Salter-Harris Type', template: 'Salter-Harris {{typeLabel}}', enabled: true, condition: 'typeProvided' },
  { id: 'location', label: 'Location', template: 'Location: {{locationLabel}}', enabled: true, condition: 'locationProvided' },
  { id: 'anatomy', label: 'Anatomy', template: '{{anatomy}}', enabled: true, condition: 'typeProvided' },
  { id: 'prognosis', label: 'Prognosis', template: 'Prognosis: {{prognosis}}', enabled: true, condition: 'typeProvided' },
];

function bts(blocks, headers, impression) {
  return { blocks: blocks.map((b) => ({ ...b })), sectionHeaders: headers, impression: { template: impression, enabled: true }, showPoints: false };
}

const SH = { findings: 'FINDINGS:', additionalFindings: 'Other findings:', impression: 'IMPRESSION:' };
const RH = { findings: '[STRUCTURED REPORT]', additionalFindings: '[OTHER FINDINGS]', impression: '[IMPRESSION]' };
const IMP = 'Salter-Harris {{typeLabel}} fracture. {{management}}.';

export const salterHarrisTemplates = {
  ps360: { label: 'PowerScribe 360', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  ps1: { label: 'PowerScribe One', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  radai: { label: 'RadAI Omni', ...bts([
    { id: 'type', label: 'Type', template: 'Salter_Harris: {{type}}', enabled: true, condition: 'typeProvided' },
    { id: 'location', label: 'Location', template: 'Location: {{locationLabel}}', enabled: true, condition: 'locationProvided' },
  ], RH, IMP + '\n[END STRUCTURED REPORT]') },
};
