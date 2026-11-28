/**
 * Deauville Criteria calculator.
 *
 * Response per Lugano 2014: scores 1-3 = CMR; scores 4-5 depend on uptake
 * compared with baseline (decreased = PMR, unchanged = NMR, increased =
 * PMD); new lesions = PMD.
 *
 * Response categories:
 *   CMR — Complete Metabolic Response (Deauville 1-3)
 *   PMR — Partial Metabolic Response (Deauville 4-5, decreased from baseline)
 *   NMR — No Metabolic Response (Deauville 4-5, no change)
 *   PMD — Progressive Metabolic Disease (Deauville 4-5 increased, or new lesions)
 */

import { deauvilleDefinition } from './definition.js';

/**
 * @param {Object} formState
 * @returns {Object}
 */
export function calculateDeauville(formState) {
  const { score, newLesion, baseline } = formState;

  if (!score) {
    return buildResult(null, null, formState, 'Select Deauville score');
  }

  const scoreNum = parseInt(score);
  const hasNewLesion = newLesion === 'yes';

  // Lugano 2014 PET-based response (Cheson et al., J Clin Oncol 2014):
  //   CMR: score 1-3 (no new lesions)
  //   PMR: score 4-5 with uptake reduced compared with baseline
  //   NMR: score 4-5 with no significant change from baseline
  //   PMD: score 4-5 with increased uptake, and/or new FDG-avid lesions
  let response = null;
  let reason = '';
  if (hasNewLesion) {
    response = 'PMD';
    reason = 'New FDG-avid lesion(s)';
  } else if (scoreNum <= 3) {
    response = 'CMR';
    reason = `Deauville ${scoreNum}`;
  } else if (baseline === 'decreased') {
    response = 'PMR';
    reason = `Deauville ${scoreNum}, uptake decreased from baseline`;
  } else if (baseline === 'unchanged') {
    response = 'NMR';
    reason = `Deauville ${scoreNum}, no significant change from baseline`;
  } else if (baseline === 'increased') {
    response = 'PMD';
    reason = `Deauville ${scoreNum}, uptake increased from baseline`;
  } else {
    reason = 'Select uptake compared with baseline';
  }

  return buildResult(scoreNum, response, formState, reason);
}

// Interpretation and management follow the RESPONSE (not the score), so a
// low score with new lesions never reads as a complete response.
function responseText(response, timing, scoreNum) {
  const eot = timing === 'eot';
  switch (response) {
    case 'CMR':
      return {
        interpretation: 'Complete metabolic response',
        management: scoreNum === 3
          ? 'Complete metabolic response in most protocols (Deauville 3 may be treated as inadequate response in de-escalation trials).'
          : 'No residual metabolically active lymphoma.',
      };
    case 'PMR':
      return {
        interpretation: 'Partial metabolic response',
        management: eot
          ? 'Residual metabolically active disease at end of treatment.'
          : 'Responding disease.',
      };
    case 'NMR':
      return {
        interpretation: 'No metabolic response',
        management: eot
          ? 'Residual metabolically active disease at end of treatment, without significant change from baseline.'
          : 'No significant change in FDG uptake from baseline.',
      };
    case 'PMD':
      return { interpretation: 'Progressive metabolic disease', management: 'Progressive metabolic disease.' };
    default:
      return { interpretation: '', management: '' };
  }
}

const RESPONSE_INFO = {
  CMR: { label: 'Complete Metabolic Response', level: 1 },
  PMR: { label: 'Partial Metabolic Response', level: 3 },
  NMR: { label: 'No Metabolic Response', level: 4 },
  PMD: { label: 'Progressive Metabolic Disease', level: 5 },
};

function buildResult(scoreNum, response, formState, reason) {
  const scoreData = scoreNum ? deauvilleDefinition.scores.find((s) => s.id === String(scoreNum)) : null;
  const respInfo = response ? RESPONSE_INFO[response] : null;

  const timingLabels = {
    interim: 'Interim (mid-treatment)',
    eot: 'End of treatment',
    surveillance: 'Surveillance',
  };

  return {
    score: scoreNum || null,
    scoreLabel: scoreData?.label || '--',
    scoreShortLabel: scoreData?.shortLabel || '--',
    scoreLevel: scoreNum || 0,
    ...responseText(response, formState.timing, scoreNum),
    response: response || '--',
    responseLabel: respInfo?.label || 'Incomplete',
    responseFullLabel: response ? `${response} - ${respInfo.label}` : '--',
    responseLevel: respInfo?.level || 0,
    reason,
    timingLabel: timingLabels[formState.timing] || 'Not specified',
    timingProvided: !!formState.timing,
    newLesionLabel: formState.newLesion === 'yes' ? 'Yes' : formState.newLesion === 'no' ? 'No' : 'Not assessed',
    newLesionProvided: !!formState.newLesion,
    baselineLabel: { decreased: 'Decreased', unchanged: 'No significant change', increased: 'Increased' }[formState.baseline] || 'Not assessed',
    baselineProvided: !!formState.baseline,
    hasNewLesion: formState.newLesion === 'yes',
  };
}
