/**
 * AAST organ injury report templates (shared pattern for liver and spleen).
 *
 * scaleVersion (optional, e.g. '2024') is named in the report so a reader
 * knows which revision a grade refers to when the scales disagree.
 */

export function buildAastTemplates(organ, scaleVersion = '') {
  const scale = scaleVersion ? ` (${scaleVersion} OIS)` : '';
  const FINDINGS_BLOCKS = [
    { id: 'grade', label: `${organ} Injury Grade`, template: `AAST ${organ} injury${scale}: {{gradeLabel}}`, enabled: true },
    { id: 'findings', label: 'Imaging Findings', template: '{{findingsText}}', enabled: true, condition: 'findingsProvided' },
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

  const IMPRESSION = `AAST ${organ} injury${scale}: {{gradeLabel}}.`;

  return {
    ps360: { label: 'PowerScribe 360', ...buildTemplateSet(FINDINGS_BLOCKS, STANDARD_HEADERS, IMPRESSION) },
    ps1: { label: 'PowerScribe One', ...buildTemplateSet(FINDINGS_BLOCKS, STANDARD_HEADERS, IMPRESSION) },
    radai: {
      label: 'RadAI Omni',
      ...buildTemplateSet([
        { id: 'grade', label: `${organ} Injury Grade`, template: `AAST_${organ}_Grade: {{gradeLabel}}`, enabled: true },
        { id: 'findings', label: 'Imaging Findings', template: '{{findingsText}}', enabled: true, condition: 'findingsProvided' },
      ], RADAI_HEADERS, IMPRESSION + '\n[END STRUCTURED REPORT]'),
    },
  };
}
