/**
 * MIBG Score report templates (block-based).
 */

const FINDINGS_BLOCKS = [
  { id: 'mode', label: 'Scoring System', template: 'Scoring system: {{modeLabel}}', enabled: true },
  { id: 'segments', label: 'Segment Scores', template: '{{segmentScoreText}}', enabled: true },
  { id: 'total', label: 'Total Score', template: '{{modeLabel}} Score: {{totalLabel}}', enabled: true },
  { id: 'interpretation', label: 'Interpretation', template: '{{interpretation}}', enabled: true, condition: 'allAssessed' },
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
  additionalFindings: 'ADDITIONAL FINDINGS:',
  impression: 'IMPRESSION:',
};

const RADAI_HEADERS = {
  findings: '[STRUCTURED REPORT]',
  additionalFindings: '[ADDITIONAL FINDINGS]',
  impression: '[IMPRESSION]',
};

export const curieTemplates = {
  ps360: { label: 'PowerScribe 360', ...buildTemplateSet(FINDINGS_BLOCKS, STANDARD_HEADERS, '{{impressionSummary}}') },
  ps1: { label: 'PowerScribe One', ...buildTemplateSet(FINDINGS_BLOCKS, STANDARD_HEADERS, '{{impressionSummary}}') },
  radai: {
    label: 'RadAI Omni',
    ...buildTemplateSet([
      { id: 'mode', label: 'Scoring System', template: 'Scoring_System: {{modeLabel}}', enabled: true },
      { id: 'total', label: 'Total Score', template: '{{modeLabel}}_Score: {{total}}\n{{modeLabel}}_Max: {{maxTotal}}', enabled: true },
      { id: 'interpretation', label: 'Interpretation', template: 'Prognosis: {{interpretation}}', enabled: true, condition: 'allAssessed' },
    ], RADAI_HEADERS, '{{impressionSummary}}\n[END STRUCTURED REPORT]'),
  },
};

export const siopenTemplates = {
  ps360: { label: 'PowerScribe 360', ...buildTemplateSet(FINDINGS_BLOCKS, STANDARD_HEADERS, '{{impressionSummary}}') },
  ps1: { label: 'PowerScribe One', ...buildTemplateSet(FINDINGS_BLOCKS, STANDARD_HEADERS, '{{impressionSummary}}') },
  radai: {
    label: 'RadAI Omni',
    ...buildTemplateSet([
      { id: 'mode', label: 'Scoring System', template: 'Scoring_System: {{modeLabel}}', enabled: true },
      { id: 'total', label: 'Total Score', template: '{{modeLabel}}_Score: {{total}}\n{{modeLabel}}_Max: {{maxTotal}}', enabled: true },
      { id: 'interpretation', label: 'Interpretation', template: 'Prognosis: {{interpretation}}', enabled: true, condition: 'allAssessed' },
    ], RADAI_HEADERS, '{{impressionSummary}}\n[END STRUCTURED REPORT]'),
  },
};
