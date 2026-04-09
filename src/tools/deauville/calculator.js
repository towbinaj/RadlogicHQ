/**
 * Deauville Criteria calculator.
 *
 * Scores 1-3: generally considered complete metabolic response (CMR)
 * Score 4: partial metabolic response (PMR) / residual disease
 * Score 5: no metabolic response / progressive disease (PMD)
 * New lesions: progressive disease regardless of score
 *
 * Response categories:
 *   CMR — Complete Metabolic Response (Deauville 1-3)
 *   PMR — Partial Metabolic Response (Deauville 4, decreased from baseline)
 *   NMR — No Metabolic Response (Deauville 4-5, no change)
 *   PMD — Progressive Metabolic Disease (Deauville 5 or new lesions)
 */

import { deauvilleDefinition } from './definition.js';

/**
 * @param {Object} formState
 * @returns {Object}
 */
export function calculateDeauville(formState) {
  const { score, newLesion, timing } = formState;

  if (!score) {
    return buildResult(null, null, formState, 'Select Deauville score');
  }

  const scoreNum = parseInt(score);
  const scoreData = deauvilleDefinition.scores.find((s) => s.id === score);
  const hasNewLesion = newLesion === 'yes';

  // Determine response category
  let response;
  if (hasNewLesion) {
    response = 'PMD';
  } else if (scoreNum <= 3) {
    response = 'CMR';
  } else if (scoreNum === 4) {
    response = 'PMR';
  } else {
    response = 'PMD';
  }

  return buildResult(scoreNum, response, formState, scoreData.interpretation);
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
    interpretation: scoreData?.interpretation || '',
    management: scoreData?.management || '',
    response: response || '--',
    responseLabel: respInfo?.label || 'Incomplete',
    responseFullLabel: response ? `${response} — ${respInfo.label}` : '--',
    responseLevel: respInfo?.level || 0,
    reason,
    timingLabel: timingLabels[formState.timing] || 'Not specified',
    timingProvided: !!formState.timing,
    newLesionLabel: formState.newLesion === 'yes' ? 'Yes' : formState.newLesion === 'no' ? 'No' : 'Not assessed',
    newLesionProvided: !!formState.newLesion,
    hasNewLesion: formState.newLesion === 'yes',
  };
}
