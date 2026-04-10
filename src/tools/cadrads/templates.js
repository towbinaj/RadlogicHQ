/**
 * CAD-RADS report templates.
 */

const FINDINGS_BLOCKS = [
  { id: 'category', label: 'CAD-RADS', template: '{{fullLabel}}', enabled: true, condition: 'categoryProvided' },
  { id: 'stenosis', label: 'Stenosis', template: 'Maximum stenosis: {{stenosis}}', enabled: true, condition: 'categoryProvided' },
  { id: 'modifiers', label: 'Modifiers', template: 'Modifiers: {{modifiersText}}', enabled: true, condition: 'modifiersProvided' },
  { id: 'plaque', label: 'Plaque Burden', template: 'Plaque burden: {{plaqueBurdenLabel}}', enabled: true, condition: 'plaqueBurdenProvided' },
  { id: 'management', label: 'Management', template: 'Recommendation: {{management}}', enabled: true, condition: 'managementProvided' },
];

function buildTemplateSet(blocks, headers, impression) {
  return { blocks: blocks.map((b) => ({ ...b })), sectionHeaders: headers, impression: { template: impression, enabled: true }, showPoints: false };
}

const SH = { findings: 'FINDINGS:', additionalFindings: 'Other findings:', impression: 'IMPRESSION:' };
const RH = { findings: '[STRUCTURED REPORT]', additionalFindings: '[OTHER FINDINGS]', impression: '[IMPRESSION]' };
const IMP = '{{fullLabel}}. {{management}}.';

export const cadradsTemplates = {
  ps360: { label: 'PowerScribe 360', ...buildTemplateSet(FINDINGS_BLOCKS, SH, IMP) },
  ps1: { label: 'PowerScribe One', ...buildTemplateSet(FINDINGS_BLOCKS, SH, IMP) },
  radai: { label: 'RadAI Omni', ...buildTemplateSet([
    { id: 'category', label: 'CAD-RADS', template: 'CAD_RADS: {{fullLabel}}', enabled: true, condition: 'categoryProvided' },
    { id: 'management', label: 'Management', template: 'Recommendation: {{management}}', enabled: true, condition: 'managementProvided' },
  ], RH, IMP + '\n[END STRUCTURED REPORT]') },
};
