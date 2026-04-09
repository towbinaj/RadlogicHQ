/**
 * Neuroblastoma IDRF calculator.
 * Binary: any IDRF present → INRG Stage L2, none → L1.
 *
 * Reference: Monclair T et al. J Clin Oncol 2009;27(2):298-303.
 */

import { idrfDefinition } from './definition.js';

const STAGE_INFO = {
  L1: { level: 1, label: 'L1 — Localized without IDRFs', management: 'Localized tumor confined to one body compartment. No image-defined risk factors.' },
  L2: { level: 3, label: 'L2 — Locoregional with IDRFs', management: 'Locoregional tumor with one or more image-defined risk factors.' },
};

// Flatten all factor IDs from the definition
const ALL_FACTOR_IDS = idrfDefinition.idrfGroups.flatMap((g) => g.factors.map((f) => f.id));

/**
 * @param {Object} formState
 * @returns {Object}
 */
export function calculateIdrf(formState) {
  // Count present IDRFs
  const presentFactors = ALL_FACTOR_IDS.filter((id) => formState[id] === true);
  const assessedCount = ALL_FACTOR_IDS.filter((id) => formState[id] === true || formState[id] === false).length;

  if (assessedCount === 0) {
    return buildResult(null, formState, 'Assess image-defined risk factors', presentFactors);
  }

  const stage = presentFactors.length > 0 ? 'L2' : 'L1';
  const reason = presentFactors.length > 0
    ? `${presentFactors.length} IDRF(s) present`
    : 'No IDRFs identified';

  return buildResult(stage, formState, reason, presentFactors);
}

function buildResult(stage, formState, reason, presentFactors) {
  const info = stage ? STAGE_INFO[stage] : null;

  // Build list of present factor labels
  const factorLabels = [];
  for (const group of idrfDefinition.idrfGroups) {
    for (const factor of group.factors) {
      if (presentFactors.includes(factor.id)) {
        factorLabels.push(factor.label);
      }
    }
  }

  const locationLabels = {
    cervical: 'Cervical',
    thoracic: 'Thoracic / Posterior mediastinum',
    abdominal: 'Abdominal / Retroperitoneal',
    pelvic: 'Pelvic',
    adrenal: 'Adrenal',
  };

  return {
    stage: stage || '--',
    stageLabel: info?.label || 'Incomplete',
    stageFullLabel: stage ? `INRG ${info.label}` : '--',
    stageLevel: stage === 'L2' ? 3 : stage === 'L1' ? 1 : 0,
    management: info?.management || '',
    reason,
    idrfCount: presentFactors.length,
    idrfPresent: presentFactors.length > 0,
    idrfFactors: factorLabels,
    idrfFactorList: factorLabels.length > 0 ? factorLabels.join('; ') : 'None',
    locationLabel: locationLabels[formState.location] || '',
    locationProvided: !!formState.location,
  };
}
