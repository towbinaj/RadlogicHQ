/**
 * ASPECTS calculator.
 *
 * Score = 10 - (number of affected regions).
 * ≤7 = large territory infarct, poor prognosis.
 * ≥6 generally considered threshold for thrombectomy candidacy.
 *
 * Blank by default: with no region marked, a score of 10 is reported only
 * when the reader confirms "no early ischemic changes" (normalConfirmed).
 * An untouched form must not read as a normal study.
 */

const NOT_ASSESSED = 'Not yet assessed: mark affected regions or confirm no early ischemic changes';

export function calculateAspects(affected, side, normalConfirmed = false) {
  const affectedCount = affected.size;
  const sideLabel = side === 'left' ? 'Left' : side === 'right' ? 'Right' : '';

  if (affectedCount === 0 && !normalConfirmed) {
    return {
      score: '--',
      scoreLabel: '--',
      affectedCount: 0,
      interpretation: NOT_ASSESSED,
      level: 0,
      sideLabel,
      sideProvided: !!side,
      affectedText: 'None',
      affectedProvided: false,
      assessed: false,
    };
  }

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
    assessed: true,
  };
}

/**
 * True when pasted report text states a normal ASPECTS ("ASPECTS 10",
 * "ASPECTS: 10/10", "no early/acute ischemic changes"). Used by the paste
 * handler to set normalConfirmed when no regions were parsed.
 */
export function detectNormalAspects(text = '') {
  return /\bASPECTS\b\D{0,20}\b10\b/i.test(text)
    || /\bno (?:acute |early )?ischemic changes?\b/i.test(text);
}
