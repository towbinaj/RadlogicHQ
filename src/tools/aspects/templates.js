/**
 * ASPECTS report templates.
 */

const FINDINGS_BLOCKS = [
  { id: 'score', label: 'ASPECTS Score', template: '{{sideLabel}} ASPECTS: {{score}}/10', enabled: true },
  { id: 'affected', label: 'Affected Regions', template: 'Regions with early ischemic changes: {{affectedText}}', enabled: true, condition: 'affectedProvided' },
  { id: 'interpretation', label: 'Interpretation', template: '{{interpretation}}', enabled: true },
];

function buildTemplateSet(blocks, headers, impression) {
  return {
    blocks: blocks.map((b) => ({ ...b })),
    sectionHeaders: headers,
    impression: { template: impression, enabled: true },
    showPoints: false,
  };
}

const STANDARD_HEADERS = { findings: 'FINDINGS:', additionalFindings: 'Other findings:', impression: 'IMPRESSION:' };
const RADAI_HEADERS = { findings: '[STRUCTURED REPORT]', additionalFindings: '[OTHER FINDINGS]', impression: '[IMPRESSION]' };
const IMPRESSION = '{{sideLabel}} ASPECTS {{score}}/10. {{interpretation}}.';

export const aspectsTemplates = {
  ps360: { label: 'PowerScribe 360', ...buildTemplateSet(FINDINGS_BLOCKS, STANDARD_HEADERS, IMPRESSION) },
  ps1: { label: 'PowerScribe One', ...buildTemplateSet(FINDINGS_BLOCKS, STANDARD_HEADERS, IMPRESSION) },
  radai: {
    label: 'RadAI Omni',
    ...buildTemplateSet([
      { id: 'score', label: 'ASPECTS Score', template: 'ASPECTS_Score: {{score}}', enabled: true },
      { id: 'side', label: 'Side', template: 'Side: {{sideLabel}}', enabled: true, condition: 'sideProvided' },
      { id: 'affected', label: 'Affected Regions', template: 'Affected_Regions: {{affectedText}}', enabled: true, condition: 'affectedProvided' },
      { id: 'interpretation', label: 'Interpretation', template: 'Interpretation: {{interpretation}}', enabled: true },
    ], RADAI_HEADERS, IMPRESSION + '\n[END STRUCTURED REPORT]'),
  },
};
