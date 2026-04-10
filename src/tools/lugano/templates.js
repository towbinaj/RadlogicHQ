const FINDINGS_BLOCKS = [
  { id: 'type', label: 'Lymphoma Type', template: '{{typeLabel}}', enabled: true, condition: 'typeProvided' },
  { id: 'stage', label: 'Lugano Stage', template: 'Lugano: {{fullLabel}} — {{stageDescription}}', enabled: true, condition: 'stageProvided' },
  { id: 'risk', label: 'Risk Group', template: '{{riskGroup}}', enabled: true, condition: 'riskGroupProvided' },
];

function bts(blocks, headers, impression) {
  return { blocks: blocks.map((b) => ({ ...b })), sectionHeaders: headers, impression: { template: impression, enabled: true }, showPoints: false };
}

const SH = { findings: 'FINDINGS:', additionalFindings: 'Other findings:', impression: 'IMPRESSION:' };
const RH = { findings: '[STRUCTURED REPORT]', additionalFindings: '[OTHER FINDINGS]', impression: '[IMPRESSION]' };
const IMP = 'Lugano {{fullLabel}}. {{riskGroup}}.';

export const luganoTemplates = {
  ps360: { label: 'PowerScribe 360', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  ps1: { label: 'PowerScribe One', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  radai: { label: 'RadAI Omni', ...bts([
    { id: 'stage', label: 'Stage', template: 'Lugano_Stage: {{fullLabel}}', enabled: true, condition: 'stageProvided' },
    { id: 'risk', label: 'Risk', template: 'Risk_Group: {{riskGroup}}', enabled: true, condition: 'riskGroupProvided' },
  ], RH, IMP + '\n[END STRUCTURED REPORT]') },
};
