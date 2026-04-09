/**
 * RECIST 1.1 report templates (block-based).
 */

const FINDINGS_BLOCKS = [
  { id: 'targetSummary', label: 'Target Lesions', template: '{{targetSummaryText}}', enabled: true, condition: 'baselineSumProvided' },
  { id: 'sums', label: 'Sum of Diameters', template: 'Sum of longest diameters: Baseline {{baselineSum}} mm → Current {{currentSum}} mm ({{pctFromBaselineLabel}} from baseline)', enabled: true, condition: 'currentSumProvided' },
  { id: 'nadir', label: 'Nadir', template: 'Change from nadir: {{nadirSum}} mm → {{currentSum}} mm ({{pctFromNadirLabel}})', enabled: true, condition: 'currentSumProvided' },
  { id: 'targetResponse', label: 'Target Response', template: 'Target lesion response: {{targetResponseLabel}}', enabled: true },
  { id: 'nonTarget', label: 'Non-Target', template: 'Non-target lesions: {{nonTargetLabel}}', enabled: true, condition: 'nonTargetProvided' },
  { id: 'newLesion', label: 'New Lesions', template: 'New lesions: {{newLesionLabel}}', enabled: true, condition: 'newLesionProvided' },
  { id: 'overall', label: 'Overall Response', template: 'Overall RECIST 1.1 Response: {{overallResponseFullLabel}}', enabled: true },
];

export const recistTemplates = {
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
      { id: 'sums', label: 'Sum of Diameters', template: 'Baseline_Sum_mm: {{baselineSum}}\nCurrent_Sum_mm: {{currentSum}}\nPct_Change_Baseline: {{pctFromBaselineLabel}}', enabled: true, condition: 'currentSumProvided' },
      { id: 'targetResponse', label: 'Target Response', template: 'Target_Response: {{targetResponse}}', enabled: true },
      { id: 'nonTarget', label: 'Non-Target', template: 'Non_Target: {{nonTargetLabel}}', enabled: true, condition: 'nonTargetProvided' },
      { id: 'newLesion', label: 'New Lesions', template: 'New_Lesions: {{newLesionLabel}}', enabled: true, condition: 'newLesionProvided' },
      { id: 'overall', label: 'Overall Response', template: 'RECIST_Response: {{overallResponse}}\nRECIST_Label: {{overallResponseLabel}}', enabled: true },
    ],
    sectionHeaders: { findings: '[STRUCTURED REPORT]', additionalFindings: '[ADDITIONAL FINDINGS]', impression: '[IMPRESSION]' },
    impression: { template: '{{impressionSummary}}\n[END STRUCTURED REPORT]', enabled: true },
    showPoints: false,
  },
};
