/**
 * O-RADS US report templates (block-based).
 */

const FINDINGS_BLOCKS = [
  { id: 'massLabel', label: 'Mass Label', template: '{{massLabel}}:', enabled: true, locked: true },
  { id: 'location', label: 'Side', template: 'Side: {{location}}', enabled: true, condition: 'locationProvided' },
  { id: 'size', label: 'Size', template: 'Size: {{sizeMm}} mm ({{sizeCm}} cm)', enabled: true, condition: 'sizeProvided' },
  { id: 'classicBenign', label: 'Classic Benign', template: 'Classic benign descriptor: {{classicBenignLabel}}', enabled: true, condition: 'classicBenignProvided' },
  { id: 'morphology', label: 'Morphology', template: 'Morphology: {{morphologyLabel}}', enabled: true, condition: 'morphologyProvided' },
  { id: 'colorScore', label: 'Color Score', template: 'Color score: {{colorScoreLabel}}', enabled: true, condition: 'colorScoreProvided' },
  { id: 'ascites', label: 'Ascites', template: 'Ascites: {{ascitesLabel}}', enabled: true, condition: 'ascitesProvided' },
  { id: 'peritoneal', label: 'Peritoneal', template: 'Peritoneal nodularity: {{peritonealLabel}}', enabled: true, condition: 'peritonealProvided' },
  { id: 'category', label: 'Category', template: 'O-RADS Assessment: {{categoryFullLabel}}', enabled: true },
];

export const oradsTemplates = {
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
      { id: 'massLabel', label: 'Mass Label', template: '[{{massLabel}}]', enabled: true, locked: true },
      { id: 'location', label: 'Side', template: 'Side: {{location}}', enabled: true, condition: 'locationProvided' },
      { id: 'size', label: 'Size', template: 'Size_mm: {{sizeMm}}', enabled: true, condition: 'sizeProvided' },
      { id: 'morphology', label: 'Morphology', template: 'Morphology: {{morphologyLabel}}', enabled: true, condition: 'morphologyProvided' },
      { id: 'colorScore', label: 'Color Score', template: 'Color_Score: {{colorScoreLabel}}', enabled: true, condition: 'colorScoreProvided' },
      { id: 'category', label: 'Category', template: 'ORADS_Category: {{categoryShort}}\nORADS_Label: {{categoryLabel}}', enabled: true },
    ],
    sectionHeaders: { findings: '[STRUCTURED REPORT]', additionalFindings: '[ADDITIONAL FINDINGS]', impression: '[IMPRESSION]' },
    impression: { template: '{{impressionSummary}}\n[END STRUCTURED REPORT]', enabled: true },
    showPoints: false,
  },
};
