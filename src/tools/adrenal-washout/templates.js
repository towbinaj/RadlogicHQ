/**
 * Adrenal Washout report templates (block-based).
 */

const FINDINGS_BLOCKS = [
  { id: 'side', label: 'Side', template: 'Side: {{sideLabel}} adrenal', enabled: true, condition: 'sideProvided' },
  { id: 'unenh', label: 'Unenhanced', template: 'Unenhanced attenuation: {{unenhanced}} HU', enabled: true, condition: 'unenhancedProvided' },
  { id: 'enh', label: 'Enhanced', template: 'Enhanced attenuation: {{enhanced}} HU', enabled: true, condition: 'enhancedProvided' },
  { id: 'del', label: 'Delayed', template: 'Delayed attenuation: {{delayed}} HU', enabled: true, condition: 'delayedProvided' },
  { id: 'absolute', label: 'Absolute Washout', template: 'Absolute washout: {{absoluteWashoutLabel}}', enabled: true, condition: 'absoluteProvided' },
  { id: 'relative', label: 'Relative Washout', template: 'Relative washout: {{relativeWashoutLabel}}', enabled: true, condition: 'relativeProvided' },
  { id: 'interpretation', label: 'Interpretation', template: '{{interpretation}}', enabled: true, condition: 'hasResult' },
];

export const adrenalWashoutTemplates = {
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
      { id: 'side', label: 'Side', template: 'Side: {{sideLabel}}', enabled: true, condition: 'sideProvided' },
      { id: 'unenh', label: 'Unenhanced', template: 'Unenhanced_HU: {{unenhanced}}', enabled: true, condition: 'unenhancedProvided' },
      { id: 'enh', label: 'Enhanced', template: 'Enhanced_HU: {{enhanced}}', enabled: true, condition: 'enhancedProvided' },
      { id: 'del', label: 'Delayed', template: 'Delayed_HU: {{delayed}}', enabled: true, condition: 'delayedProvided' },
      { id: 'absolute', label: 'Absolute Washout', template: 'Absolute_Washout_Pct: {{absoluteWashout}}', enabled: true, condition: 'absoluteProvided' },
      { id: 'relative', label: 'Relative Washout', template: 'Relative_Washout_Pct: {{relativeWashout}}', enabled: true, condition: 'relativeProvided' },
      { id: 'interpretation', label: 'Interpretation', template: 'Interpretation: {{interpretation}}', enabled: true, condition: 'hasResult' },
    ],
    sectionHeaders: { findings: '[STRUCTURED REPORT]', additionalFindings: '[ADDITIONAL FINDINGS]', impression: '[IMPRESSION]' },
    impression: { template: '{{impressionSummary}}\n[END STRUCTURED REPORT]', enabled: true },
    showPoints: false,
  },
};
