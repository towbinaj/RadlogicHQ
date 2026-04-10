const FINDINGS_BLOCKS = [
  { id: 'hh', label: 'Hunt-Hess', template: 'Hunt-Hess {{huntHessGrade}}: {{huntHessDescription}}', enabled: true, condition: 'huntHessProvided' },
  { id: 'hhProg', label: 'Prognosis', template: 'Prognosis: {{huntHessPrognosis}}', enabled: true, condition: 'huntHessProvided' },
  { id: 'mf', label: 'Modified Fisher', template: 'Modified Fisher {{modifiedFisherGrade}}: {{modifiedFisherDescription}}', enabled: true, condition: 'modifiedFisherProvided' },
  { id: 'vasosp', label: 'Vasospasm Risk', template: 'Vasospasm risk: {{modifiedFisherVasospasm}}', enabled: true, condition: 'modifiedFisherProvided' },
];

function bts(blocks, headers, impression) {
  return { blocks: blocks.map((b) => ({ ...b })), sectionHeaders: headers, impression: { template: impression, enabled: true }, showPoints: false };
}

const SH = { findings: 'FINDINGS:', additionalFindings: 'Other findings:', impression: 'IMPRESSION:' };
const RH = { findings: '[STRUCTURED REPORT]', additionalFindings: '[OTHER FINDINGS]', impression: '[IMPRESSION]' };
const IMP = 'Hunt-Hess Grade {{huntHessGrade}}. Modified Fisher Grade {{modifiedFisherGrade}} (vasospasm risk: {{modifiedFisherVasospasm}}).';

export const sahTemplates = {
  ps360: { label: 'PowerScribe 360', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  ps1: { label: 'PowerScribe One', ...bts(FINDINGS_BLOCKS, SH, IMP) },
  radai: { label: 'RadAI Omni', ...bts([
    { id: 'hh', label: 'Hunt-Hess', template: 'Hunt_Hess: {{huntHessGrade}}', enabled: true, condition: 'huntHessProvided' },
    { id: 'mf', label: 'Modified Fisher', template: 'Modified_Fisher: {{modifiedFisherGrade}}', enabled: true, condition: 'modifiedFisherProvided' },
    { id: 'vasosp', label: 'Vasospasm', template: 'Vasospasm_Risk: {{modifiedFisherVasospasm}}', enabled: true, condition: 'modifiedFisherProvided' },
  ], RH, IMP + '\n[END STRUCTURED REPORT]') },
};
