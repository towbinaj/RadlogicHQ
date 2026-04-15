/**
 * Adrenal Washout Calculator.
 * Computes absolute and relative washout percentages to differentiate
 * lipid-poor adenomas from non-adenomas.
 *
 * Reference: Caoili EM et al. Radiology 2002;222(3):629-633.
 */
export const adrenalWashoutDefinition = {
  id: 'adrenal-washout',
  name: 'Adrenal Washout',
  version: '1.0.0',
  description:
    'Adrenal washout calculator — absolute and relative washout percentages for adrenal lesion characterization.',
  cdeSetId: null,

  sideOptions: [
    { id: 'right', label: 'Right' },
    { id: 'left', label: 'Left' },
  ],

  // Manual HU extraction rules. Patterns are label-anchored so the
  // parser doesn't mis-attribute a lone "60 HU" number to the wrong
  // phase. `side` is auto-generated from sideOptions. Adrenal washout
  // is clinically unilateral (bilateral findings are rare and not
  // comparably analyzed with this formula), so there's no bilateral
  // refactor here -- just better per-phase coverage.
  //
  // Each rule handles BOTH orderings ("unenhanced 12 HU" and "12 HU
  // unenhanced") via an alternation and picks whichever capture group
  // actually matched. Word boundaries + a negative lookbehind on
  // "enhanced" prevent "unenhanced" from false-positiving into the
  // enhanced rule.
  // Each rule handles two orderings:
  //
  //   (a) label -> number: "<label>[:\s]*<number> HU"
  //       Must have no comma/period/semicolon between the label and
  //       number -- separator stays within one phrase.
  //
  //   (b) number -> label: "<number> HU[\s]+(?:on|at|in)?\s+<label>"
  //       Requires whitespace-only connection (no comma), so
  //       "8 HU, portal venous" doesn't leak the "8" into the
  //       enhanced bucket.
  //
  // `(?<!un)` on enhanced prevents "enhanced" from matching inside
  // "unenhanced". `\b` word boundaries on all keywords prevent similar
  // substring overlaps.
  parseRules: {
    unenhanced: {
      pattern: /(?:\b(?:unenhanced|non-?contrast|pre-?contrast|precontrast)\b(?:\s+attenuation)?(?:\s+of)?[\s:]*(-?\d+\.?\d*)\s*(?:hu|hounsfield)?|(-?\d+\.?\d*)\s*(?:hu|hounsfield)?\s+(?:on\s+|at\s+)?\b(?:unenhanced|non-?contrast|pre-?contrast|precontrast)\b)/i,
      group: 0,
      transform: (m) => parseFloat(m[1] != null ? m[1] : m[2]),
    },
    enhanced: {
      pattern: /(?:(?:(?<!un)\benhanced\b|\bpost-?contrast\b|\bportal\s+venous\b|\bpv\s+phase\b|\b60[-\s]*(?:s|sec|seconds?)\b)[\s:]*(-?\d+\.?\d*)\s*(?:hu|hounsfield)?|(-?\d+\.?\d*)\s*(?:hu|hounsfield)?\s+(?:on\s+|at\s+)?(?:(?<!un)\benhanced\b|\bpost-?contrast\b|\bportal\s+venous\b))/i,
      group: 0,
      transform: (m) => parseFloat(m[1] != null ? m[1] : m[2]),
    },
    delayed: {
      pattern: /(?:\bdelayed\b[\s:]*(-?\d+\.?\d*)\s*(?:hu|hounsfield)?|(-?\d+\.?\d*)\s*(?:hu|hounsfield)?\s+(?:on\s+|at\s+)?(?:\bdelayed\b|15\s*[-\s]*(?:min|minutes?)\b)|15\s*[-\s]*(?:min|minutes?)\s*(?:delayed)?[\s:]*(-?\d+\.?\d*)\s*(?:hu|hounsfield)?)/i,
      group: 0,
      transform: (m) => parseFloat(m[1] != null ? m[1] : (m[2] != null ? m[2] : m[3])),
    },
  },
};
