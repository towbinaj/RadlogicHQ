/**
 * Neuroblastoma IDRF report templates (block-based).
 */

const FINDINGS_BLOCKS = [
  { id: 'location', label: 'Location', template: 'Primary tumor location: {{locationLabel}}', enabled: true, condition: 'locationProvided' },
  { id: 'idrfCount', label: 'IDRF Count', template: 'Image-defined risk factors: {{idrfCount}} identified', enabled: true },
  { id: 'idrfList', label: 'IDRF List', template: 'IDRFs present: {{idrfFactorList}}', enabled: true },
  { id: 'stage', label: 'Stage', template: 'INRG Stage: {{stageLabel}}', enabled: true },
];

export const idrfTemplates = {
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
      { id: 'location', label: 'Location', template: 'Primary_Tumor_Location: {{locationLabel}}', enabled: true, condition: 'locationProvided' },
      { id: 'idrfCount', label: 'IDRF Count', template: 'IDRF_Count: {{idrfCount}}', enabled: true },
      { id: 'idrfList', label: 'IDRF List', template: 'IDRFs: {{idrfFactorList}}', enabled: true },
      { id: 'stage', label: 'Stage', template: 'INRG_Stage: {{stage}}', enabled: true },
    ],
    sectionHeaders: { findings: '[STRUCTURED REPORT]', additionalFindings: '[ADDITIONAL FINDINGS]', impression: '[IMPRESSION]' },
    impression: { template: '{{impressionSummary}}\n[END STRUCTURED REPORT]', enabled: true },
    showPoints: false,
  },
};
