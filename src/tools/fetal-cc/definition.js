/**
 * Fetal Corpus Callosum Length — definition.
 *
 * Reference: Harreld et al. AJNR 2011.
 * Growth formula: CC length (mm) = -40.37 + 4.017 × GA - 0.048 × GA²
 */

export function expectedCCLength(ga) {
  if (ga < 20 || ga > 40) return null;
  return Math.round((-40.37 + 4.017 * ga - 0.048 * ga * ga) * 10) / 10;
}

export const fetalCCDefinition = {
  id: 'fetal-cc',
  name: 'Fetal Corpus Callosum',
  parseRules: {},
};
