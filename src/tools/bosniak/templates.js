/**
 * Bosniak v2019 report templates (block-based).
 */

const FINDINGS_BLOCKS = [
  { id: 'cystLabel', label: 'Cyst Label', template: '{{cystLabel}}:', enabled: true, locked: true },
  { id: 'location', label: 'Location', template: 'Location: {{location}}', enabled: true, condition: 'locationProvided' },
  { id: 'size', label: 'Size', template: 'Size: {{sizeMm}} mm ({{sizeCm}} cm)', enabled: true, condition: 'sizeProvided' },
  { id: 'modality', label: 'Modality', template: 'Modality: {{modalityLabel}}', enabled: true },
  { id: 'wall', label: 'Wall', template: 'Wall: {{wallLabel}}', enabled: true },
  { id: 'septa', label: 'Septa', template: 'Septa: {{septalLabel}}', enabled: true },
  { id: 'enhancement', label: 'Enhancement', template: 'Enhancement: {{enhancementLabel}}', enabled: true },
  { id: 'calcification', label: 'Calcification', template: 'Calcification: {{calcificationLabel}}', enabled: true },
  { id: 'softTissue', label: 'Soft Tissue', template: 'Enhancing soft tissue: {{softTissueLabel}}', enabled: true },
  { id: 'category', label: 'Category', template: 'Bosniak Classification: {{categoryFullLabel}}', enabled: true },
  { id: 'management', label: 'Management', template: '{{management}}', enabled: true },
];

export const bosniakTemplates = {
  ps360: {
    label: 'PowerScribe 360',
    blocks: FINDINGS_BLOCKS.map((b) => ({ ...b })),
    sectionHeaders: {
      findings: 'FINDINGS:',
      additionalFindings: 'ADDITIONAL FINDINGS:',
      impression: 'IMPRESSION:',
    },
    impression: {
      template: '{{impressionSummary}}',
      enabled: true,
    },
    showPoints: false,
  },

  ps1: {
    label: 'PowerScribe One',
    blocks: FINDINGS_BLOCKS.map((b) => ({ ...b })),
    sectionHeaders: {
      findings: 'FINDINGS:',
      additionalFindings: 'ADDITIONAL FINDINGS:',
      impression: 'IMPRESSION:',
    },
    impression: {
      template: '{{impressionSummary}}',
      enabled: true,
    },
    showPoints: false,
  },

  radai: {
    label: 'RadAI Omni',
    blocks: [
      { id: 'cystLabel', label: 'Cyst Label', template: '[{{cystLabel}}]', enabled: true, locked: true },
      { id: 'location', label: 'Location', template: 'Location: {{location}}', enabled: true, condition: 'locationProvided' },
      { id: 'size', label: 'Size', template: 'Size_mm: {{sizeMm}}', enabled: true, condition: 'sizeProvided' },
      { id: 'modality', label: 'Modality', template: 'Modality: {{modalityLabel}}', enabled: true },
      { id: 'wall', label: 'Wall', template: 'Wall: {{wallLabel}}', enabled: true },
      { id: 'septa', label: 'Septa', template: 'Septa: {{septalLabel}}', enabled: true },
      { id: 'enhancement', label: 'Enhancement', template: 'Enhancement: {{enhancementLabel}}', enabled: true },
      { id: 'calcification', label: 'Calcification', template: 'Calcification: {{calcificationLabel}}', enabled: true },
      { id: 'softTissue', label: 'Soft Tissue', template: 'Enhancing_Soft_Tissue: {{softTissueLabel}}', enabled: true },
      { id: 'category', label: 'Category', template: 'Bosniak_Classification: {{categoryShort}}\nBosniak_Label: {{categoryLabel}}', enabled: true },
      { id: 'management', label: 'Management', template: 'Management: {{management}}', enabled: true },
    ],
    sectionHeaders: {
      findings: '[STRUCTURED REPORT]',
      additionalFindings: '[ADDITIONAL FINDINGS]',
      impression: '[IMPRESSION]',
    },
    impression: {
      template: '{{impressionSummary}}\n[END STRUCTURED REPORT]',
      enabled: true,
    },
    showPoints: false,
  },
};
