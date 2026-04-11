/**
 * AAST Multi-Trauma report templates.
 *
 * Unlike single-organ AAST templates, these produce a combined report
 * with per-organ sections. The page controller builds the full report
 * text directly, so blocks here are minimal placeholders.
 */

export function buildMultiTraumaTemplates() {
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

  function buildSet(headers, impressionSuffix = '') {
    return {
      blocks: [],
      sectionHeaders: headers,
      impression: { template: '{{impressionText}}', enabled: true },
      showPoints: false,
      _impressionSuffix: impressionSuffix,
    };
  }

  return {
    ps360: { label: 'PowerScribe 360', ...buildSet(STANDARD_HEADERS) },
    ps1: { label: 'PowerScribe One', ...buildSet(STANDARD_HEADERS) },
    radai: { label: 'RadAI Omni', ...buildSet(RADAI_HEADERS, '\n[END STRUCTURED REPORT]') },
  };
}
