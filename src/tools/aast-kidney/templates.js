/**
 * AAST Kidney report templates.
 *
 * Kidney differs from the other AAST organs because it's a paired organ —
 * the user can grade a right injury, a left injury, or both. The template
 * uses a precomputed {{gradeHeader}} string that the kidney tool builds
 * based on the laterality state, so the template text reads naturally in
 * all three cases:
 *
 *   Right only:  "AAST right kidney injury: Grade III"
 *   Left only:   "AAST left kidney injury: Grade II"
 *   Bilateral:   "AAST kidney injuries: Right Grade III, Left Grade II"
 *
 * {{findingsText}} is similarly prebuilt and already includes side labels
 * ("Right kidney:" / "Left kidney:") in bilateral mode.
 */

export function buildKidneyTemplates() {
  const FINDINGS_BLOCKS = [
    { id: 'grade', label: 'Kidney Injury Grade', template: '{{gradeHeader}}', enabled: true },
    { id: 'findings', label: 'Imaging Findings', template: '{{findingsText}}', enabled: true, condition: 'findingsProvided' },
  ];

  const RADAI_BLOCKS = [
    { id: 'grade', label: 'Kidney Injury Grade', template: 'AAST_Kidney_Grade: {{gradeHeader}}', enabled: true },
    { id: 'findings', label: 'Imaging Findings', template: '{{findingsText}}', enabled: true, condition: 'findingsProvided' },
  ];

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

  const IMPRESSION = '{{gradeHeader}}.';

  function buildTemplateSet(blocks, headers, impression) {
    return {
      blocks: blocks.map((b) => ({ ...b })),
      sectionHeaders: headers,
      impression: { template: impression, enabled: true },
      showPoints: false,
    };
  }

  return {
    ps360: { label: 'PowerScribe 360', ...buildTemplateSet(FINDINGS_BLOCKS, STANDARD_HEADERS, IMPRESSION) },
    ps1: { label: 'PowerScribe One', ...buildTemplateSet(FINDINGS_BLOCKS, STANDARD_HEADERS, IMPRESSION) },
    radai: {
      label: 'RadAI Omni',
      ...buildTemplateSet(RADAI_BLOCKS, RADAI_HEADERS, IMPRESSION + '\n[END STRUCTURED REPORT]'),
    },
  };
}
