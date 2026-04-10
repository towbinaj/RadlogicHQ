const FINDINGS_BLOCKS = [
  { id: 'ga', label: 'GA', template: 'Gestational age: {{gaLabel}}', enabled: true, condition: 'gaProvided' },
  { id: 'vh', label: 'Vermian Height', template: 'Vermian height: {{vhLabel}} (expected {{vhExpected}}, {{vhInterpretation}})', enabled: true, condition: 'vhInterpretationProvided' },
  { id: 'vap', label: 'Vermian AP', template: 'Vermian AP diameter: {{vapLabel}}', enabled: true, condition: 'vapProvided' },
  { id: 'tva', label: 'TVA', template: 'Tegmento-vermian angle: {{tvaLabel}} ({{tvaCategoryDesc}})', enabled: true, condition: 'tvaCategoryProvided' },
  { id: 'bs', label: 'Brainstem', template: 'Brainstem AP diameter: {{bsLabel}}', enabled: true, condition: 'bsProvided' },
];

function bts(blocks, headers, impression) {
  return { blocks: blocks.map((b) => ({ ...b })), sectionHeaders: headers, impression: { template: impression, enabled: true }, showPoints: false };
}

const SH = { findings: 'FINDINGS:', additionalFindings: 'Other findings:', impression: 'IMPRESSION:' };
const RH = { findings: '[STRUCTURED REPORT]', additionalFindings: '[OTHER FINDINGS]', impression: '[IMPRESSION]' };
const IMP = 'Posterior fossa measurements as above.';

export const fetalPFTemplates = {
  ps360: { label: 'PowerScribe 360', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  ps1: { label: 'PowerScribe One', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  radai: { label: 'RadAI Omni', ...bts([
    { id: 'vh', label: 'Vermis', template: 'Vermian_Height: {{vhLabel}}', enabled: true, condition: 'vhProvided' },
    { id: 'tva', label: 'TVA', template: 'TVA: {{tvaLabel}}', enabled: true, condition: 'tvaProvided' },
  ], RH, IMP + '\n[END STRUCTURED REPORT]') },
};
