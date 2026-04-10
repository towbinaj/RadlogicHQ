const FINDINGS_BLOCKS = [
  { id: 'ga', label: 'GA', template: 'Gestational age: {{gaLabel}}', enabled: true, condition: 'gaProvided' },
  { id: 'side', label: 'CDH Side', template: '{{cdhSideLabel}} congenital diaphragmatic hernia', enabled: true, condition: 'cdhSideProvided' },
  { id: 'liver', label: 'Liver Position', template: '{{liverLabel}}', enabled: true, condition: 'liverProvided' },
  { id: 'observed', label: 'Observed Volume', template: 'Observed total fetal lung volume: {{observedLabel}}', enabled: true, condition: 'observedProvided' },
  { id: 'expected', label: 'Expected Volume', template: 'Expected TFLV (Rypens): {{expectedLabel}}', enabled: true, condition: 'expectedProvided' },
  { id: 'oe', label: 'O/E TFLV', template: 'Observed/Expected TFLV: {{oeLabel}}', enabled: true, condition: 'oeProvided' },
  { id: 'severity', label: 'Severity', template: '{{severityDesc}}', enabled: true, condition: 'severityProvided' },
];

function bts(blocks, headers, impression) {
  return { blocks: blocks.map((b) => ({ ...b })), sectionHeaders: headers, impression: { template: impression, enabled: true }, showPoints: false };
}

const SH = { findings: 'FINDINGS:', additionalFindings: 'Other findings:', impression: 'IMPRESSION:' };
const RH = { findings: '[STRUCTURED REPORT]', additionalFindings: '[OTHER FINDINGS]', impression: '[IMPRESSION]' };
const IMP = 'O/E TFLV {{oeLabel}} ({{severity}}).';

export const fetalLungTemplates = {
  ps360: { label: 'PowerScribe 360', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  ps1: { label: 'PowerScribe One', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  radai: { label: 'RadAI Omni', ...bts([
    { id: 'oe', label: 'O/E', template: 'OE_TFLV: {{oeLabel}}', enabled: true, condition: 'oeProvided' },
    { id: 'severity', label: 'Severity', template: 'Severity: {{severity}}', enabled: true, condition: 'severityProvided' },
  ], RH, IMP + '\n[END STRUCTURED REPORT]') },
};
