/**
 * LI-RADS v2018 report templates (block-based).
 */

const FINDINGS_BLOCKS = [
  { id: 'obsLabel', label: 'Observation Label', template: '{{obsLabel}}:', enabled: true, locked: true },
  { id: 'location', label: 'Location', template: 'Location: {{location}}', enabled: true, condition: 'locationProvided' },
  { id: 'size', label: 'Size', template: 'Size: {{sizeMm}} mm ({{sizeCm}} cm)', enabled: true, condition: 'sizeProvided' },
  { id: 'aphe', label: 'APHE', template: 'Arterial phase hyperenhancement: {{apheLabel}}', enabled: true },
  { id: 'washout', label: 'Washout', template: 'Nonperipheral washout: {{washoutLabel}}', enabled: true },
  { id: 'capsule', label: 'Capsule', template: 'Enhancing capsule: {{capsuleLabel}}', enabled: true },
  { id: 'thresholdGrowth', label: 'Threshold Growth', template: 'Threshold growth: {{thresholdGrowthLabel}}', enabled: true },
  { id: 'category', label: 'Category', template: 'LI-RADS Category: {{categoryFullLabel}}', enabled: true },
  { id: 'ancillary', label: 'Ancillary', template: '{{adjustmentNote}}', enabled: true, condition: 'hasAdjustment' },
];

export const liradsTemplates = {
  ps360: {
    label: 'PowerScribe 360',
    blocks: FINDINGS_BLOCKS.map((b) => ({ ...b })),
    impression: {
      template: 'IMPRESSION:\n{{impressionSummary}}',
      enabled: true,
    },
    showPoints: false,
  },

  ps1: {
    label: 'PowerScribe One',
    blocks: FINDINGS_BLOCKS.map((b) => ({ ...b })),
    impression: {
      template: 'IMPRESSION:\n{{impressionSummary}}',
      enabled: true,
    },
    showPoints: false,
  },

  radai: {
    label: 'RadAI Omni',
    blocks: [
      { id: 'obsLabel', label: 'Observation Label', template: '[{{obsLabel}}]', enabled: true, locked: true },
      { id: 'location', label: 'Location', template: 'Location: {{location}}', enabled: true, condition: 'locationProvided' },
      { id: 'size', label: 'Size', template: 'Size_mm: {{sizeMm}}', enabled: true, condition: 'sizeProvided' },
      { id: 'aphe', label: 'APHE', template: 'APHE: {{apheLabel}}', enabled: true },
      { id: 'washout', label: 'Washout', template: 'Washout: {{washoutLabel}}', enabled: true },
      { id: 'capsule', label: 'Capsule', template: 'Capsule: {{capsuleLabel}}', enabled: true },
      { id: 'thresholdGrowth', label: 'Threshold Growth', template: 'Threshold_Growth: {{thresholdGrowthLabel}}', enabled: true },
      { id: 'category', label: 'Category', template: 'LI-RADS_Category: {{category}}\nLI-RADS_Label: {{categoryLabel}}', enabled: true },
      { id: 'ancillary', label: 'Ancillary', template: 'Ancillary_Adjustment: {{adjustmentNote}}', enabled: true, condition: 'hasAdjustment' },
    ],
    impression: {
      template: '[IMPRESSION]\n{{impressionSummary}}\n[END STRUCTURED REPORT]',
      enabled: true,
    },
    showPoints: false,
  },
};
