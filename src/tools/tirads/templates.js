/**
 * Default report templates for TI-RADS output.
 * Block-based: each block is a draggable, toggleable report field.
 */

const FINDINGS_BLOCKS = [
  { id: 'noduleLabel', label: 'Nodule Label', template: '{{noduleLabel}}:', enabled: true, locked: true },
  { id: 'location', label: 'Location', template: 'Location: {{noduleLocation}}', enabled: true, condition: 'noduleLocationProvided' },
  { id: 'size', label: 'Size', template: 'Size: {{noduleSize}} cm', enabled: true, condition: 'noduleSizeProvided' },
  { id: 'composition', label: 'Composition', template: 'Composition: {{composition}}', pointsTemplate: ' ({{compositionPoints}} pts)', enabled: true, showPoints: true },
  { id: 'echogenicity', label: 'Echogenicity', template: 'Echogenicity: {{echogenicity}}', pointsTemplate: ' ({{echogenicityPoints}} pts)', enabled: true, showPoints: true },
  { id: 'shape', label: 'Shape', template: 'Shape: {{shape}}', pointsTemplate: ' ({{shapePoints}} pts)', enabled: true, showPoints: true },
  { id: 'margin', label: 'Margin', template: 'Margin: {{margin}}', pointsTemplate: ' ({{marginPoints}} pts)', enabled: true, showPoints: true },
  { id: 'echogenicFoci', label: 'Echogenic Foci', template: 'Echogenic Foci: {{echogenicFoci}}', pointsTemplate: ' ({{echogenicFociPoints}} pts)', enabled: true, showPoints: true },
  { id: 'totalScore', label: 'Total Score', template: 'Total Score: {{totalScore}} points — {{tiradsFullLabel}}', enabled: true },
];

export const tiradsTemplates = {
  ps360: {
    label: 'PowerScribe 360',
    blocks: FINDINGS_BLOCKS.map((b) => ({ ...b })),
    impression: {
      template: 'IMPRESSION:\n{{noduleSummaries}}',
      enabled: true,
    },
    showPoints: true,
  },

  ps1: {
    label: 'PowerScribe One',
    blocks: FINDINGS_BLOCKS.map((b) => ({ ...b })),
    impression: {
      template: 'IMPRESSION:\n{{noduleSummaries}}',
      enabled: true,
    },
    showPoints: true,
  },

  radai: {
    label: 'RadAI Omni',
    blocks: [
      { id: 'noduleLabel', label: 'Nodule Label', template: '[{{noduleLabel}}]', enabled: true, locked: true },
      { id: 'location', label: 'Location', template: 'Location: {{noduleLocation}}', enabled: true, condition: 'noduleLocationProvided' },
      { id: 'size', label: 'Size', template: 'Size_cm: {{noduleSize}}', enabled: true, condition: 'noduleSizeProvided' },
      { id: 'composition', label: 'Composition', template: 'Composition: {{composition}}', pointsTemplate: ' | Points: {{compositionPoints}}', enabled: true, showPoints: true },
      { id: 'echogenicity', label: 'Echogenicity', template: 'Echogenicity: {{echogenicity}}', pointsTemplate: ' | Points: {{echogenicityPoints}}', enabled: true, showPoints: true },
      { id: 'shape', label: 'Shape', template: 'Shape: {{shape}}', pointsTemplate: ' | Points: {{shapePoints}}', enabled: true, showPoints: true },
      { id: 'margin', label: 'Margin', template: 'Margin: {{margin}}', pointsTemplate: ' | Points: {{marginPoints}}', enabled: true, showPoints: true },
      { id: 'echogenicFoci', label: 'Echogenic Foci', template: 'Echogenic_Foci: {{echogenicFoci}}', pointsTemplate: ' | Points: {{echogenicFociPoints}}', enabled: true, showPoints: true },
      { id: 'totalScore', label: 'Total Score', template: 'Total_Score: {{totalScore}}\nTI-RADS_Level: {{tiradsName}}\nTI-RADS_Category: {{tiradsLabel}}', enabled: true },
    ],
    impression: {
      template: '[IMPRESSION]\n{{noduleSummaries}}\n[END STRUCTURED REPORT]',
      enabled: true,
    },
    showPoints: true,
  },
};
