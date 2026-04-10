/**
 * Fetal Posterior Fossa Measurements — definition.
 *
 * Vermian height: linear regression from Cignini 2016
 *   Height (mm) = -4.85 + 0.78 × GA
 *
 * TVA (tegmento-vermian angle): GA-independent
 *   Normal: <18°
 *   Abnormal: ≥18° (vermian hypoplasia, Blake pouch, Dandy-Walker spectrum)
 *
 * References:
 *   Cignini G et al. PLoS ONE 2016.
 *   Dovjak GO et al. Ultrasound Obstet Gynecol 2021.
 */

export function expectedVermianHeight(ga) {
  if (ga < 17 || ga > 40) return null;
  return Math.round((-4.85 + 0.78 * ga) * 10) / 10;
}

export const fetalPFDefinition = {
  id: 'fetal-pf',
  name: 'Fetal Posterior Fossa',

  tvaCategories: [
    { max: 18, label: 'Normal', description: 'TVA <18\u00b0' },
    { max: 30, label: 'Mildly elevated', description: 'TVA 18\u201330\u00b0 — consider Blake pouch remnant' },
    { max: 70, label: 'Moderately elevated', description: 'TVA 30\u201370\u00b0 — vermian hypoplasia or Blake pouch' },
    { max: Infinity, label: 'Severely elevated', description: 'TVA >70\u00b0 — Dandy-Walker spectrum' },
  ],

  parseRules: {},
};
