/**
 * Scoliosis report templates (block-based).
 */

const FINDINGS_BLOCKS = [
  { id: 'hardware', label: 'Spinal Hardware', template: 'SPINAL HARDWARE: {{hardwareText}}', enabled: true },
  { id: 'curves', label: 'Lateral Curvature', template: 'LATERAL SPINAL CURVATURE: {{curvesText}}', enabled: true },
  { id: 'prior', label: 'Prior Measurements', template: 'PRIOR MEASUREMENT(S): {{priorText}}', enabled: true, condition: 'priorProvided' },
  { id: 'variability', label: 'Variability Note', template: 'Please note that due to known inherent variability in scoliosis measurements, curves may vary by as much as +/- 5-10 degrees', enabled: true, condition: 'hasCurves' },
  { id: 'scoliosisType', label: 'Scoliosis Type', template: 'SCOLIOSIS TYPE: {{scoliosisTypeLabel}}', enabled: true, condition: 'scoliosisTypeProvided' },
  { id: 'kyphosis', label: 'Kyphosis/Lordosis', template: 'KYPHOSIS/LORDOSIS: {{kyphosisLabel}}', enabled: true, condition: 'kyphosisProvided' },
  { id: 'pelvicObliquity', label: 'Pelvic Obliquity', template: 'PELVIC OBLIQUITY: {{pelvicObliquityText}}', enabled: true },
  { id: 'vertebral', label: 'Vertebral Abnormalities', template: 'VERTEBRAL ABNORMALITIES: {{vertebralText}}', enabled: true },
  { id: 'rib', label: 'Rib Abnormalities', template: 'RIB ABNORMALITIES: {{ribText}}', enabled: true },
  { id: 'triradiate', label: 'Triradiate Cartilage', template: 'TRIRADIATE CARTILAGE: {{triradiateLabel}}', enabled: true, condition: 'triradiateProvided' },
  { id: 'risser', label: 'Risser Stage', template: 'RISSER STAGE: {{risserLabel}}', enabled: true, condition: 'risserProvided' },
  { id: 'chestAbdomen', label: 'Chest & Abdomen', template: 'IMAGED PORTIONS OF THE CHEST AND ABDOMEN: {{chestAbdomenText}}', enabled: true },
];

function buildTemplateSet(blocks, headers, impression) {
  return {
    blocks: blocks.map((b) => ({ ...b })),
    sectionHeaders: headers,
    impression: { template: impression, enabled: true },
    showPoints: false,
  };
}

const STANDARD_HEADERS = {
  findings: 'FINDINGS:',
  additionalFindings: 'Other findings:',
  impression: 'IMPRESSION:',
};

const RADAI_HEADERS = {
  findings: '[STRUCTURED REPORT]',
  additionalFindings: '[OTHER FINDINGS]',
  impression: '[IMPRESSION]',
};

const IMPRESSION_TEXT = '{{curvesText}}';

export const scoliosisTemplates = {
  ps360: { label: 'PowerScribe 360', ...buildTemplateSet(FINDINGS_BLOCKS, STANDARD_HEADERS, IMPRESSION_TEXT) },
  ps1: { label: 'PowerScribe One', ...buildTemplateSet(FINDINGS_BLOCKS, STANDARD_HEADERS, IMPRESSION_TEXT) },
  radai: {
    label: 'RadAI Omni',
    ...buildTemplateSet([
      { id: 'hardware', label: 'Spinal Hardware', template: 'Spinal_Hardware: {{hardwareText}}', enabled: true },
      { id: 'curves', label: 'Lateral Curvature', template: 'Lateral_Curvature: {{curvesText}}', enabled: true },
      { id: 'prior', label: 'Prior Measurements', template: 'Prior_Measurements: {{priorText}}', enabled: true, condition: 'priorProvided' },
      { id: 'scoliosisType', label: 'Scoliosis Type', template: 'Scoliosis_Type: {{scoliosisTypeLabel}}', enabled: true, condition: 'scoliosisTypeProvided' },
      { id: 'kyphosis', label: 'Kyphosis/Lordosis', template: 'Kyphosis: {{kyphosisLabel}}', enabled: true, condition: 'kyphosisProvided' },
      { id: 'pelvicObliquity', label: 'Pelvic Obliquity', template: 'Pelvic_Obliquity: {{pelvicObliquityText}}', enabled: true },
      { id: 'vertebral', label: 'Vertebral Abnormalities', template: 'Vertebral_Abnormalities: {{vertebralText}}', enabled: true },
      { id: 'rib', label: 'Rib Abnormalities', template: 'Rib_Abnormalities: {{ribText}}', enabled: true },
      { id: 'triradiate', label: 'Triradiate Cartilage', template: 'Triradiate: {{triradiateLabel}}', enabled: true, condition: 'triradiateProvided' },
      { id: 'risser', label: 'Risser Stage', template: 'Risser: {{risserLabel}}', enabled: true, condition: 'risserProvided' },
      { id: 'chestAbdomen', label: 'Chest & Abdomen', template: 'Chest_Abdomen: {{chestAbdomenText}}', enabled: true },
    ], RADAI_HEADERS, IMPRESSION_TEXT + '\n[END STRUCTURED REPORT]'),
  },
};
