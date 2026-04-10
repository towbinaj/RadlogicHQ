/**
 * ASPECTS calculator.
 *
 * Score = 10 - (number of affected regions).
 * ≤7 = large territory infarct, poor prognosis.
 * ≥6 generally considered threshold for thrombectomy candidacy.
 */

export function calculateAspects(affected, side) {
  const affectedCount = affected.size;
  const score = 10 - affectedCount;

  let interpretation = '';
  let level = 0;
  if (affectedCount === 0) {
    interpretation = 'No early ischemic changes';
    level = 1;
  } else if (score >= 8) {
    interpretation = 'Small territory involvement';
    level = 2;
  } else if (score >= 6) {
    interpretation = 'Moderate territory involvement';
    level = 3;
  } else {
    interpretation = 'Large territory infarct';
    level = 5;
  }

  const sideLabel = side === 'left' ? 'Left' : side === 'right' ? 'Right' : '';

  // Build affected regions text
  const affectedList = [];
  for (const id of affected) {
    affectedList.push(id);
  }
  const affectedText = affectedList.length > 0
    ? affectedList.join(', ')
    : 'None';

  return {
    score,
    scoreLabel: String(score),
    affectedCount,
    interpretation,
    level,
    sideLabel,
    sideProvided: !!side,
    affectedText,
    affectedProvided: affectedCount > 0,
  };
}
