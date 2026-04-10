const FINDINGS_BLOCKS = [
  { id: 'pi', label: 'Pectus Index', template: 'Pectus Index (Haller Index): {{piLabel}} ({{piInterpretation}})', enabled: true, condition: 'piProvided' },
  { id: 'ci', label: 'Correction Index', template: 'Correction Index: {{ciLabel}} ({{ciInterpretation}})', enabled: true, condition: 'ciProvided' },
  { id: 'di', label: 'Depression Index', template: 'Depression Index: {{diLabel}} ({{diInterpretation}})', enabled: true, condition: 'diProvided' },
  { id: 'mcci', label: 'mCCI', template: 'Modified Cardiac Compression Index: {{mcciLabel}}', enabled: true, condition: 'mcciProvided' },
  { id: 'sta', label: 'Sternal Torsion', template: 'Sternal Torsion Angle: {{staText}}', enabled: true, condition: 'staProvided' },
];

function bts(blocks, headers, impression) {
  return { blocks: blocks.map((b) => ({ ...b })), sectionHeaders: headers, impression: { template: impression, enabled: true }, showPoints: false };
}

const SH = { findings: 'FINDINGS:', additionalFindings: 'Other findings:', impression: 'IMPRESSION:' };
const RH = { findings: '[STRUCTURED REPORT]', additionalFindings: '[OTHER FINDINGS]', impression: '[IMPRESSION]' };
const IMP = 'Pectus Index {{piLabel}}. Correction Index {{ciLabel}}. Depression Index {{diLabel}}.';

export const pectusTemplates = {
  ps360: { label: 'PowerScribe 360', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  ps1: { label: 'PowerScribe One', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  radai: { label: 'RadAI Omni', ...bts([
    { id: 'pi', label: 'PI', template: 'Pectus_Index: {{piLabel}}', enabled: true, condition: 'piProvided' },
    { id: 'ci', label: 'CI', template: 'Correction_Index: {{ciLabel}}', enabled: true, condition: 'ciProvided' },
    { id: 'di', label: 'DI', template: 'Depression_Index: {{diLabel}}', enabled: true, condition: 'diProvided' },
    { id: 'mcci', label: 'mCCI', template: 'mCCI: {{mcciLabel}}', enabled: true, condition: 'mcciProvided' },
    { id: 'sta', label: 'STA', template: 'Sternal_Torsion: {{staText}}', enabled: true, condition: 'staProvided' },
  ], RH, IMP + '\n[END STRUCTURED REPORT]') },
};
