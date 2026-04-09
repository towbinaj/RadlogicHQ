/**
 * PRETEXT report templates (block-based).
 */

const FINDINGS_BLOCKS = [
  { id: 'size', label: 'Size', template: 'Maximum axial tumor diameter: {{sizeMm}} mm ({{sizeCm}} cm)', enabled: true, condition: 'sizeProvided' },
  { id: 'sections', label: 'Sections', template: 'Liver sections involved: Caudate {{C}}, RP {{RP}}, RA {{RA}}, LM {{LM}}, LL {{LL}}', enabled: true },
  { id: 'group', label: 'PRETEXT Group', template: 'PRETEXT Group: {{groupLabel}}', enabled: true },
  { id: 'annV', label: 'V — Venous', template: 'Hepatic venous/IVC involvement (V): {{V}}', enabled: true, condition: 'VProvided' },
  { id: 'annP', label: 'P — Portal', template: 'Portal venous involvement (P): {{P}}', enabled: true, condition: 'PProvided' },
  { id: 'annE', label: 'E — Extrahepatic', template: 'Extrahepatic disease (E): {{E}}', enabled: true, condition: 'EProvided' },
  { id: 'annF', label: 'F — Multifocal', template: 'Multifocality (F): {{F}}', enabled: true, condition: 'FProvided' },
  { id: 'annR', label: 'R — Rupture', template: 'Tumor rupture (R): {{R}}', enabled: true, condition: 'RProvided' },
  { id: 'annN', label: 'N — Nodes', template: 'Nodal metastases (N): {{N}}', enabled: true, condition: 'NProvided' },
  { id: 'annM', label: 'M — Distant', template: 'Distant metastases (M): {{M}}', enabled: true, condition: 'MProvided' },
  { id: 'staging', label: 'Full Staging', template: 'Staging: {{groupFullLabel}}', enabled: true },
];

export const pretextTemplates = {
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
      { id: 'size', label: 'Size', template: 'Max_Axial_Diameter_mm: {{sizeMm}}', enabled: true, condition: 'sizeProvided' },
      { id: 'group', label: 'PRETEXT Group', template: 'PRETEXT_Group: {{group}}', enabled: true },
      { id: 'annV', label: 'V', template: 'V_Hepatic_Venous: {{V}}', enabled: true, condition: 'VProvided' },
      { id: 'annP', label: 'P', template: 'P_Portal_Venous: {{P}}', enabled: true, condition: 'PProvided' },
      { id: 'annE', label: 'E', template: 'E_Extrahepatic: {{E}}', enabled: true, condition: 'EProvided' },
      { id: 'annF', label: 'F', template: 'F_Multifocal: {{F}}', enabled: true, condition: 'FProvided' },
      { id: 'annR', label: 'R', template: 'R_Rupture: {{R}}', enabled: true, condition: 'RProvided' },
      { id: 'annN', label: 'N', template: 'N_Nodal: {{N}}', enabled: true, condition: 'NProvided' },
      { id: 'annM', label: 'M', template: 'M_Distant: {{M}}', enabled: true, condition: 'MProvided' },
      { id: 'staging', label: 'Full Staging', template: 'PRETEXT_Staging: {{groupFullLabel}}', enabled: true },
    ],
    sectionHeaders: { findings: '[STRUCTURED REPORT]', additionalFindings: '[ADDITIONAL FINDINGS]', impression: '[IMPRESSION]' },
    impression: { template: '{{impressionSummary}}\n[END STRUCTURED REPORT]', enabled: true },
    showPoints: false,
  },
};
