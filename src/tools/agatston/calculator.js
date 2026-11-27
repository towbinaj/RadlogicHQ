/**
 * Agatston calcium score calculator.
 */

import { agatstonDefinition } from './definition.js';

export function calculateAgatston(formState) {
  const { score } = formState;

  const hasScore = score != null && score >= 0;
  // Categories are integer ranges (0, 1-10, 11-99, ...); decimal scores such
  // as 10.5 fall between them. Use the upper bounds: the first band whose max
  // is not exceeded (so 10.5 > 10 -> 11-99; any score above 0 is at least 1-10).
  const cats = agatstonDefinition.riskCategories;
  const cat = !hasScore ? null
    : score === 0 ? cats[0]
    : cats.find((c) => c.min > 0 && score <= c.max) || cats[cats.length - 1];

  const level = cat ? cat.level : 0;

  return {
    score: hasScore ? score : null,
    scoreLabel: hasScore ? String(score) : '--',
    scoreProvided: hasScore,
    categoryLabel: cat?.label || '--',
    risk: cat?.risk || '',
    riskProvided: !!cat?.risk,
    recommendation: cat?.recommendation || '',
    recommendationProvided: !!cat?.recommendation,
    level,
    impressionText: cat
      ? `Agatston score ${score} (${cat.label}). ${cat.risk} cardiovascular risk.`
      : 'Not yet scored.',
  };
}
