/**
 * Deauville Criteria report templates (block-based).
 */

const FINDINGS_BLOCKS = [
  { id: 'timing', label: 'Timing', template: 'Study timing: {{timingLabel}}', enabled: true, condition: 'timingProvided' },
  { id: 'score', label: 'Deauville Score', template: 'Deauville score: {{scoreLabel}}', enabled: true },
  { id: 'newLesion', label: 'New Lesions', template: 'New lesions: {{newLesionLabel}}', enabled: true, condition: 'newLesionProvided' },
  { id: 'interpretation', label: 'Interpretation', template: '{{interpretation}}', enabled: true },
  { id: 'response', label: 'Response', template: 'Metabolic response: {{responseFullLabel}}', enabled: true },
  { id: 'management', label: 'Management', template: '{{management}}', enabled: true },
];

export const deauvilleTemplates = {
  ps360: {
    label: 'PowerScribe 360',
    blocks: FINDINGS_BLOCKS.map((b) => ({ ...b })),
    sectionHeaders: { findings: 'FINDINGS:', additionalFindings: 'ADDITIONAL FINDINGS:', impression: 'IMPRESSION:' },
    impression: { template: '{{impressionSummary}}', enabled: true },
    showPoints: false,
  },
  ps1: {
    label: 'PowerScribe One',
    blocks: FINDINGS_BLOCKS.map((b) => ({ ...b })),
    sectionHeaders: { findings: 'FINDINGS:', additionalFindings: 'ADDITIONAL FINDINGS:', impression: 'IMPRESSION:' },
    impression: { template: '{{impressionSummary}}', enabled: true },
    showPoints: false,
  },
  radai: {
    label: 'RadAI Omni',
    blocks: [
      { id: 'timing', label: 'Timing', template: 'Study_Timing: {{timingLabel}}', enabled: true, condition: 'timingProvided' },
      { id: 'score', label: 'Deauville Score', template: 'Deauville_Score: {{score}}', enabled: true },
      { id: 'newLesion', label: 'New Lesions', template: 'New_Lesions: {{newLesionLabel}}', enabled: true, condition: 'newLesionProvided' },
      { id: 'response', label: 'Response', template: 'Metabolic_Response: {{response}}\nResponse_Label: {{responseLabel}}', enabled: true },
    ],
    sectionHeaders: { findings: '[STRUCTURED REPORT]', additionalFindings: '[ADDITIONAL FINDINGS]', impression: '[IMPRESSION]' },
    impression: { template: '{{impressionSummary}}\n[END STRUCTURED REPORT]', enabled: true },
    showPoints: false,
  },
};
