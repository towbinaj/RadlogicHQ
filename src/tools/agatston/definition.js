/**
 * Agatston Coronary Artery Calcium Score — definition.
 *
 * Reference: Agatston AS et al. J Am Coll Cardiol 1990;15(4):827-832.
 */

export const agatstonDefinition = {
  id: 'agatston',
  name: 'Agatston Score',

  riskCategories: [
    { min: 0, max: 0, label: 'No calcium', risk: 'Very low', recommendation: 'Reassurance; lifestyle counseling' },
    { min: 1, max: 10, label: 'Minimal calcium', risk: 'Low', recommendation: 'Lifestyle modification' },
    { min: 11, max: 99, label: 'Mild calcium', risk: 'Mild', recommendation: 'Consider statin therapy; risk factor modification' },
    { min: 100, max: 299, label: 'Moderate calcium', risk: 'Moderate', recommendation: 'Moderate-to-high intensity statin recommended' },
    { min: 300, max: 999, label: 'Severe calcium', risk: 'Moderately high', recommendation: 'High-intensity statin recommended' },
    { min: 1000, max: Infinity, label: 'Extensive calcium', risk: 'Very high', recommendation: 'High-intensity statin; aggressive risk factor management' },
  ],

  parseRules: {
    score: {
      pattern: /(?:agatston|calcium|cac)\s*(?:score)?[:\s]*(\d+)/i,
      group: 1,
      transform: (m) => parseFloat(m[1]),
    },
  },
};
