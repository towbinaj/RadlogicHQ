/**
 * Agatston Coronary Artery Calcium Score — definition.
 *
 * Score: Agatston AS et al. J Am Coll Cardiol 1990;15(4):827-832.
 * Categories and recommendations: CAC-DRS (Hecht HS et al. CAC-DRS:
 *   Coronary Artery Calcium Data and Reporting System. SCCT expert
 *   consensus. J Cardiovasc Comput Tomogr 2018;12(3):185-191;
 *   doi:10.1016/j.jcct.2018.03.008). Aspirin wording reflects the 2018
 *   document; individualize with bleeding risk.
 */

export const agatstonDefinition = {
  id: 'agatston',
  name: 'Agatston Score',

  // Applied by upper bound (see calculator) so decimal scores fall into the
  // next band (99.5 -> CAC-DRS 2).
  riskCategories: [
    { min: 0, max: 0, label: 'CAC-DRS 0', level: 1, risk: 'Very low',
      recommendation: 'Statin generally not recommended (consider if familial hypercholesterolemia or other high-risk features)' },
    { min: 1, max: 99, label: 'CAC-DRS 1', level: 2, risk: 'Mildly increased',
      recommendation: 'Moderate-intensity statin' },
    { min: 100, max: 299, label: 'CAC-DRS 2', level: 3, risk: 'Moderately increased',
      recommendation: 'Moderate- to high-intensity statin; consider aspirin 81 mg after assessing bleeding risk' },
    { min: 300, max: Infinity, label: 'CAC-DRS 3', level: 5, risk: 'Moderately to severely increased',
      recommendation: 'High-intensity statin; consider aspirin 81 mg after assessing bleeding risk' },
  ],

  parseRules: {
    // Accepts thousands separators and decimals ("1,250", "12.7"), "score of
    // 150", and prefers an explicit total over a per-vessel value
    // ("LAD calcium 40, total score 120" -> 120).
    score: {
      pattern: /(?:agatston|calcium|cac)\s*(?:score)?(?:\s+of)?[:\s]*(\d[\d,]*(?:\.\d+)?)/i,
      group: 1,
      transform: (m) => {
        const total = m.input.match(/\btotal\b[^.\d]{0,30}?(\d[\d,]*(?:\.\d+)?)/i);
        return parseFloat((total ? total[1] : m[1]).replace(/,/g, ''));
      },
    },
  },
};
