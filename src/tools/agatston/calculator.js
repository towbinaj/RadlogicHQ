/**
 * Agatston calcium score calculator.
 */

import { agatstonDefinition } from './definition.js';

export function calculateAgatston(formState) {
  const { score } = formState;

  const hasScore = score != null && score >= 0;
  const cat = hasScore ? agatstonDefinition.riskCategories.find((c) => score >= c.min && score <= c.max) : null;

  const level = !cat ? 0 : score === 0 ? 1 : score <= 10 ? 1 : score <= 99 ? 2 : score <= 299 ? 3 : 5;

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
  };
}
