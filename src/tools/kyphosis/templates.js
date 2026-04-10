const FINDINGS_BLOCKS = [
  { id: 'thoracic', label: 'Thoracic Kyphosis', template: 'Thoracic kyphosis (T4-T12): {{thoracicLabel}} ({{thoracicInterpretation}})', enabled: true, condition: 'thoracicProvided' },
  { id: 'priorThoracic', label: 'Prior Thoracic', template: 'Prior thoracic kyphosis: {{priorThoracicText}}', enabled: true, condition: 'priorThoracicProvided' },
  { id: 'lumbar', label: 'Lumbar Lordosis', template: 'Lumbar lordosis (L1-S1): {{lumbarLabel}} ({{lumbarInterpretation}})', enabled: true, condition: 'lumbarProvided' },
  { id: 'priorLumbar', label: 'Prior Lumbar', template: 'Prior lumbar lordosis: {{priorLumbarText}}', enabled: true, condition: 'priorLumbarProvided' },
  { id: 'wedging', label: 'Wedging', template: '{{wedgingLabel}}', enabled: true, condition: 'wedgingProvided' },
  { id: 'scheuermann', label: 'Scheuermann', template: '{{scheuermannsLabel}}', enabled: true, condition: 'scheuermannsProvided' },
];

function bts(blocks, headers, impression) {
  return { blocks: blocks.map((b) => ({ ...b })), sectionHeaders: headers, impression: { template: impression, enabled: true }, showPoints: false };
}

const SH = { findings: 'FINDINGS:', additionalFindings: 'Other findings:', impression: 'IMPRESSION:' };
const RH = { findings: '[STRUCTURED REPORT]', additionalFindings: '[OTHER FINDINGS]', impression: '[IMPRESSION]' };
const IMP = 'Thoracic kyphosis {{thoracicLabel}}. {{thoracicInterpretation}}.';

export const kyphosisTemplates = {
  ps360: { label: 'PowerScribe 360', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  ps1: { label: 'PowerScribe One', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  radai: { label: 'RadAI Omni', ...bts([
    { id: 'thoracic', label: 'Thoracic', template: 'Thoracic_Kyphosis: {{thoracicLabel}}', enabled: true, condition: 'thoracicProvided' },
    { id: 'lumbar', label: 'Lumbar', template: 'Lumbar_Lordosis: {{lumbarLabel}}', enabled: true, condition: 'lumbarProvided' },
  ], RH, IMP + '\n[END STRUCTURED REPORT]') },
};
