const FINDINGS_BLOCKS = [
  { id: 'ga', label: 'GA', template: 'Gestational age: {{gaLabel}}', enabled: true, condition: 'gaProvided' },
  { id: 'bpd', label: 'BPD', template: 'Biparietal diameter: {{bpdLabel}} (expected mean {{bpdMean}}, {{bpdInterpretation}})', enabled: true, condition: 'bpdInterpretationProvided' },
  { id: 'cerebellum', label: 'Cerebellum', template: 'Cerebellar transverse diameter: {{cerebellumLabel}} (expected mean {{cerebellumMean}}, {{cerebellumInterpretation}})', enabled: true, condition: 'cerebellumInterpretationProvided' },
  { id: 'cm', label: 'Cisterna Magna', template: 'Cisterna magna: {{cmLabel}} ({{cmInterpretation}})', enabled: true, condition: 'cmInterpretationProvided' },
];

function bts(blocks, headers, impression) {
  return { blocks: blocks.map((b) => ({ ...b })), sectionHeaders: headers, impression: { template: impression, enabled: true }, showPoints: false };
}

const SH = { findings: 'FINDINGS:', additionalFindings: 'Other findings:', impression: 'IMPRESSION:' };
const RH = { findings: '[STRUCTURED REPORT]', additionalFindings: '[OTHER FINDINGS]', impression: '[IMPRESSION]' };
const IMP = 'Fetal brain biometry as above.';

export const fetalBiometryTemplates = {
  ps360: { label: 'PowerScribe 360', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  ps1: { label: 'PowerScribe One', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  radai: { label: 'RadAI Omni', ...bts([
    { id: 'bpd', label: 'BPD', template: 'BPD: {{bpdLabel}}', enabled: true, condition: 'bpdProvided' },
    { id: 'cerebellum', label: 'Cerebellum', template: 'Cerebellar_Diameter: {{cerebellumLabel}}', enabled: true, condition: 'cerebellumProvided' },
    { id: 'cm', label: 'CM', template: 'Cisterna_Magna: {{cmLabel}}', enabled: true, condition: 'cmProvided' },
  ], RH, IMP + '\n[END STRUCTURED REPORT]') },
};
