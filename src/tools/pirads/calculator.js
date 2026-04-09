/**
 * PI-RADS v2.1 assessment category logic.
 * Zone-dependent: PZ is DWI-dominant, TZ is T2-dominant.
 *
 * Reference: Turkbey B et al. Radiology 2019;292(2):320-333.
 *
 * PZ scoring:
 *   DWI determines category (1-5)
 *   Exception: DWI 3 + DCE positive → upgrade to PI-RADS 4
 *
 * TZ scoring:
 *   T2 determines category (1-5)
 *   Exception: T2 3 + DWI 5 → upgrade to PI-RADS 4
 *
 * CZ/AFS: use PZ assessment rules
 */

const CATEGORY_INFO = {
  1: { level: 1, label: 'Very Low',        management: 'Clinically significant cancer is highly unlikely to be present.' },
  2: { level: 2, label: 'Low',             management: 'Clinically significant cancer is unlikely to be present.' },
  3: { level: 3, label: 'Intermediate',    management: 'Equivocal. The presence of clinically significant cancer is equivocal.' },
  4: { level: 4, label: 'High',            management: 'Clinically significant cancer is likely to be present.' },
  5: { level: 5, label: 'Very High',       management: 'Clinically significant cancer is highly likely to be present.' },
};

/**
 * @param {Object} formState
 * @returns {Object}
 */
export function calculatePirads(formState) {
  const { location, t2Score, dwiScore, dce } = formState;

  if (!location) return buildResult(null, formState, 'Select zone / location');

  const t2 = t2Score ? parseInt(t2Score) : null;
  const dwi = dwiScore ? parseInt(dwiScore) : null;

  const isPZ = location === 'pz' || location === 'cz' || location === 'afs';

  let category = null;
  let reason = '';

  if (isPZ) {
    // PZ: DWI-dominant
    if (dwi == null) return buildResult(null, formState, 'Select DWI score');
    category = dwi;
    reason = `PZ dominant: DWI ${dwi}`;

    // DWI 3 + DCE positive → upgrade to 4
    if (dwi === 3 && dce === 'positive') {
      category = 4;
      reason = 'PZ: DWI 3 + DCE positive → upgraded to PI-RADS 4';
    }
  } else {
    // TZ: T2-dominant
    if (t2 == null) return buildResult(null, formState, 'Select T2 score');
    category = t2;
    reason = `TZ dominant: T2 ${t2}`;

    // T2 3 + DWI 5 → upgrade to 4
    if (t2 === 3 && dwi === 5) {
      category = 4;
      reason = 'TZ: T2 3 + DWI 5 → upgraded to PI-RADS 4';
    }
  }

  return buildResult(category, formState, reason);
}

function buildResult(category, formState, reason) {
  const info = category ? CATEGORY_INFO[category] : null;
  const sizeMm = formState.size;

  const zoneLabels = {
    pz: 'Peripheral zone',
    tz: 'Transition zone',
    cz: 'Central zone',
    afs: 'Anterior fibromuscular stroma',
  };

  const scoreLabel = (val) => val || 'Not assessed';

  return {
    category: category ? `PI-RADS ${category}` : '--',
    categoryShort: category || '--',
    categoryLabel: info?.label || 'Incomplete',
    categoryFullLabel: category ? `PI-RADS ${category} - ${info.label}` : '--',
    categoryLevel: info?.level || 0,
    management: info?.management || '',
    reason,
    zoneLabel: zoneLabels[formState.location] || '',
    zoneProvided: !!formState.location,
    t2Label: scoreLabel(formState.t2Score),
    dwiLabel: scoreLabel(formState.dwiScore),
    dceLabel: formState.dce === 'positive' ? 'Positive' : formState.dce === 'negative' ? 'Negative' : 'Not assessed',
    t2Provided: !!formState.t2Score,
    dwiProvided: !!formState.dwiScore,
    dceProvided: !!formState.dce,
    epeLabel: formState.epe === 'present' ? 'Present' : formState.epe === 'absent' ? 'Absent' : 'Not assessed',
    epeProvided: !!formState.epe,
    sizeMm,
    sizeProvided: sizeMm != null,
    sizeCm: sizeMm != null ? (sizeMm / 10).toFixed(1) : null,
    locationProvided: !!formState.location,
    location: zoneLabels[formState.location] || '',
  };
}
