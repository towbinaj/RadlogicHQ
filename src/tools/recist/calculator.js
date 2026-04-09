/**
 * RECIST 1.1 response calculator.
 *
 * Reference: Eisenhauer EA et al. Eur J Cancer 2009;45(2):228-247.
 *
 * Target lesion response (sum of longest diameters):
 *   CR — Complete Response: all target lesions disappeared (sum = 0)
 *   PR — Partial Response: ≥30% decrease from baseline sum
 *   PD — Progressive Disease: ≥20% increase from nadir AND ≥5mm absolute increase
 *   SD — Stable Disease: neither PR nor PD criteria met
 *
 * Overall response (targets + non-targets + new lesions):
 *   CR: target CR + non-target CR/absent + no new lesions
 *   PR: target PR + non-target non-PD + no new lesions
 *   SD: target SD + non-target non-PD + no new lesions
 *   PD: ANY of: target PD, non-target PD, new lesions
 */

const RESPONSE_INFO = {
  CR: { level: 1, label: 'Complete Response',   color: 'cr' },
  PR: { level: 2, label: 'Partial Response',    color: 'pr' },
  SD: { level: 3, label: 'Stable Disease',      color: 'sd' },
  PD: { level: 4, label: 'Progressive Disease', color: 'pd' },
};

function round1(val) {
  return Math.round(val * 10) / 10;
}

/**
 * @param {Object} formState
 * @param {Array} targets - array of { label, organ, baseline, current, nadir }
 * @returns {Object}
 */
export function calculateRecist(formState, targets) {
  const { nonTarget, newLesion } = formState;

  // Compute sums
  let baselineSum = 0;
  let currentSum = 0;
  let nadirSum = 0;
  let hasBaseline = false;
  let hasCurrent = false;
  let hasNadir = false;
  const validTargets = [];

  for (const t of targets) {
    const bl = t.baseline != null && t.baseline > 0 ? t.baseline : null;
    const cur = t.current != null && t.current >= 0 ? t.current : null;
    const nad = t.nadir != null && t.nadir >= 0 ? t.nadir : null;

    if (bl != null) { baselineSum += bl; hasBaseline = true; }
    if (cur != null) { currentSum += cur; hasCurrent = true; }
    // Nadir is the smallest sum seen; if not provided, use baseline
    if (nad != null) { nadirSum += nad; hasNadir = true; }

    if (bl != null || cur != null) {
      validTargets.push({ ...t, baseline: bl, current: cur, nadir: nad });
    }
  }

  // If no nadir provided, use baseline as nadir
  if (!hasNadir && hasBaseline) {
    nadirSum = baselineSum;
    hasNadir = true;
  }

  // % change from baseline
  const pctFromBaseline = (hasBaseline && hasCurrent && baselineSum > 0)
    ? round1(((currentSum - baselineSum) / baselineSum) * 100)
    : null;

  // % change from nadir
  const pctFromNadir = (hasNadir && hasCurrent && nadirSum > 0)
    ? round1(((currentSum - nadirSum) / nadirSum) * 100)
    : null;

  // Absolute increase from nadir
  const absIncreaseFromNadir = (hasNadir && hasCurrent)
    ? round1(currentSum - nadirSum)
    : null;

  // Target lesion response
  let targetResponse = null;
  if (hasBaseline && hasCurrent) {
    if (currentSum === 0) {
      targetResponse = 'CR';
    } else if (pctFromBaseline != null && pctFromBaseline <= -30) {
      targetResponse = 'PR';
    } else if (pctFromNadir != null && pctFromNadir >= 20 && absIncreaseFromNadir >= 5) {
      targetResponse = 'PD';
    } else {
      targetResponse = 'SD';
    }
  }

  // Overall response
  let overallResponse = null;
  const nonTargetPD = nonTarget === 'progression';
  const hasNewLesion = newLesion === 'yes';

  if (hasNewLesion || nonTargetPD) {
    overallResponse = 'PD';
  } else if (targetResponse === 'PD') {
    overallResponse = 'PD';
  } else if (targetResponse === 'CR' && (nonTarget === 'absent' || !nonTarget)) {
    overallResponse = 'CR';
  } else if (targetResponse === 'CR' && nonTarget === 'present') {
    overallResponse = 'PR';
  } else if (targetResponse === 'PR') {
    overallResponse = 'PR';
  } else if (targetResponse === 'SD') {
    overallResponse = 'SD';
  } else if (targetResponse) {
    overallResponse = targetResponse;
  }

  const targetInfo = targetResponse ? RESPONSE_INFO[targetResponse] : null;
  const overallInfo = overallResponse ? RESPONSE_INFO[overallResponse] : null;

  const nonTargetLabels = {
    absent: 'Absent (CR)',
    present: 'Present (non-CR/non-PD)',
    progression: 'Unequivocal progression',
  };

  return {
    targetCount: validTargets.length,
    baselineSum: hasBaseline ? round1(baselineSum) : null,
    currentSum: hasCurrent ? round1(currentSum) : null,
    nadirSum: hasNadir ? round1(nadirSum) : null,
    baselineSumProvided: hasBaseline,
    currentSumProvided: hasCurrent,
    pctFromBaseline,
    pctFromNadir,
    absIncreaseFromNadir,
    pctFromBaselineLabel: pctFromBaseline != null ? `${pctFromBaseline >= 0 ? '+' : ''}${pctFromBaseline}%` : '--',
    pctFromNadirLabel: pctFromNadir != null ? `${pctFromNadir >= 0 ? '+' : ''}${pctFromNadir}%` : '--',
    targetResponse: targetResponse || '--',
    targetResponseLabel: targetInfo?.label || 'Incomplete',
    targetResponseLevel: targetInfo?.level || 0,
    overallResponse: overallResponse || '--',
    overallResponseLabel: overallInfo?.label || 'Incomplete',
    overallResponseFullLabel: overallResponse ? `${overallResponse} — ${overallInfo.label}` : '--',
    overallResponseLevel: overallInfo?.level || 0,
    nonTargetLabel: nonTargetLabels[nonTarget] || 'Not assessed',
    nonTargetProvided: !!nonTarget,
    newLesionLabel: newLesion === 'yes' ? 'Yes' : newLesion === 'no' ? 'No' : 'Not assessed',
    newLesionProvided: !!newLesion,
    hasNewLesion,
  };
}
