/**
 * PI-RADS v2.1 report templates (block-based).
 */

const FINDINGS_BLOCKS = [
  { id: 'lesionLabel', label: 'Lesion Label', template: '{{lesionLabel}}:', enabled: true, locked: true },
  { id: 'location', label: 'Zone', template: 'Zone: {{zoneLabel}}', enabled: true, condition: 'zoneProvided' },
  { id: 'size', label: 'Size', template: 'Size: {{sizeMm}} mm ({{sizeCm}} cm)', enabled: true, condition: 'sizeProvided' },
  { id: 't2', label: 'T2W', template: 'T2-weighted score: {{t2Label}}', enabled: true, condition: 't2Provided' },
  { id: 'dwi', label: 'DWI', template: 'DWI/ADC score: {{dwiLabel}}', enabled: true, condition: 'dwiProvided' },
  { id: 'dce', label: 'DCE', template: 'DCE: {{dceLabel}}', enabled: true, condition: 'dceProvided' },
  { id: 'epe', label: 'EPE', template: 'Extraprostatic extension: {{epeLabel}}', enabled: true, condition: 'epeProvided' },
  { id: 'category', label: 'Category', template: 'PI-RADS Assessment: {{categoryFullLabel}}', enabled: true },
];

export const piradsTemplates = {
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
      { id: 'lesionLabel', label: 'Lesion Label', template: '[{{lesionLabel}}]', enabled: true, locked: true },
      { id: 'location', label: 'Zone', template: 'Zone: {{zoneLabel}}', enabled: true, condition: 'zoneProvided' },
      { id: 'size', label: 'Size', template: 'Size_mm: {{sizeMm}}', enabled: true, condition: 'sizeProvided' },
      { id: 't2', label: 'T2W', template: 'T2_Score: {{t2Label}}', enabled: true, condition: 't2Provided' },
      { id: 'dwi', label: 'DWI', template: 'DWI_Score: {{dwiLabel}}', enabled: true, condition: 'dwiProvided' },
      { id: 'dce', label: 'DCE', template: 'DCE: {{dceLabel}}', enabled: true, condition: 'dceProvided' },
      { id: 'epe', label: 'EPE', template: 'EPE: {{epeLabel}}', enabled: true, condition: 'epeProvided' },
      { id: 'category', label: 'Category', template: 'PIRADS_Category: {{categoryShort}}\nPIRADS_Label: {{categoryLabel}}', enabled: true },
    ],
    sectionHeaders: { findings: '[STRUCTURED REPORT]', additionalFindings: '[ADDITIONAL FINDINGS]', impression: '[IMPRESSION]' },
    impression: { template: '{{impressionSummary}}\n[END STRUCTURED REPORT]', enabled: true },
    showPoints: false,
  },
};
