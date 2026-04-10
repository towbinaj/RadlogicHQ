const FINDINGS_BLOCKS = [
  { id: 'ga', label: 'Gestational Age', template: 'Gestational age: {{gaLabel}}', enabled: true, condition: 'gaProvided' },
  { id: 'side', label: 'Side', template: 'Side: {{sideLabel}}', enabled: true, condition: 'sideProvided' },
  { id: 'width', label: 'Atrial Width', template: 'Lateral ventricle atrial width: {{widthLabel}}', enabled: true, condition: 'widthProvided' },
  { id: 'category', label: 'Category', template: '{{category}}', enabled: true, condition: 'categoryProvided' },
];

function bts(blocks, headers, impression) {
  return { blocks: blocks.map((b) => ({ ...b })), sectionHeaders: headers, impression: { template: impression, enabled: true }, showPoints: false };
}

const SH = { findings: 'FINDINGS:', additionalFindings: 'Other findings:', impression: 'IMPRESSION:' };
const RH = { findings: '[STRUCTURED REPORT]', additionalFindings: '[OTHER FINDINGS]', impression: '[IMPRESSION]' };
const IMP = '{{sideLabel}} lateral ventricle atrial width {{widthLabel}}. {{category}}.';

export const fetalVentricleTemplates = {
  ps360: { label: 'PowerScribe 360', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  ps1: { label: 'PowerScribe One', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  radai: { label: 'RadAI Omni', ...bts([
    { id: 'width', label: 'Width', template: 'Ventricle_Width: {{widthLabel}}', enabled: true, condition: 'widthProvided' },
    { id: 'category', label: 'Category', template: 'Category: {{category}}', enabled: true, condition: 'categoryProvided' },
  ], RH, IMP + '\n[END STRUCTURED REPORT]') },
};
