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

// Cignini P et al. Reference Charts for Fetal Cerebellar Vermis Height: A
// Prospective Cross-Sectional Study of 10605 Fetuses. PLoS One
// 2016;11(1):e0147528. doi:10.1371/journal.pone.0147528. Table 3
// (normal-based model), by completed gestational week, 20+0 to 35+6.
// Values in mm: mean (= 50th), SD (Table 2), 1st, 5th, 95th, 99th centiles.
export const CIGNINI_VH = {
  20: { mean: 11.27, sd: 0.58, p1: 9.92, p5: 10.32, p95: 12.23, p99: 12.62 },
  21: { mean: 11.96, sd: 0.67, p1: 10.40, p5: 10.86, p95: 13.07, p99: 13.52 },
  22: { mean: 12.71, sd: 0.76, p1: 10.94, p5: 11.46, p95: 13.96, p99: 14.48 },
  23: { mean: 13.50, sd: 0.85, p1: 11.52, p5: 12.10, p95: 14.90, p99: 15.48 },
  24: { mean: 14.32, sd: 0.94, p1: 12.14, p5: 12.78, p95: 15.87, p99: 16.51 },
  25: { mean: 15.16, sd: 1.03, p1: 12.77, p5: 13.47, p95: 16.86, p99: 17.56 },
  26: { mean: 16.01, sd: 1.12, p1: 13.40, p5: 14.17, p95: 17.85, p99: 18.62 },
  27: { mean: 16.85, sd: 1.21, p1: 14.04, p5: 14.86, p95: 18.84, p99: 19.67 },
  28: { mean: 17.67, sd: 1.30, p1: 14.65, p5: 15.54, p95: 19.81, p99: 20.70 },
  29: { mean: 18.47, sd: 1.39, p1: 15.23, p5: 16.18, p95: 20.75, p99: 21.70 },
  30: { mean: 19.22, sd: 1.48, p1: 15.78, p5: 16.78, p95: 21.65, p99: 22.66 },
  31: { mean: 19.91, sd: 1.57, p1: 16.26, p5: 17.33, p95: 22.49, p99: 23.56 },
  32: { mean: 20.54, sd: 1.66, p1: 16.68, p5: 17.81, p95: 23.27, p99: 24.40 },
  33: { mean: 21.09, sd: 1.75, p1: 17.02, p5: 18.21, p95: 23.96, p99: 25.16 },
  34: { mean: 21.54, sd: 1.84, p1: 17.27, p5: 18.52, p95: 24.57, p99: 25.82 },
  35: { mean: 21.90, sd: 1.93, p1: 17.41, p5: 18.72, p95: 25.07, p99: 26.38 },
};

/** Cignini row for a gestational age in weeks (completed week), or null. */
export function cigniniRow(ga) {
  if (ga == null || !(ga >= 20 && ga < 36)) return null;
  return CIGNINI_VH[Math.floor(ga)] || null;
}

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
