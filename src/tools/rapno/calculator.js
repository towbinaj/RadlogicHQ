/**
 * RAPNO response calculator.
 *
 * Bidimensional measurement: product of two perpendicular diameters (D1 × D2).
 * Sum of products across all target lesions compared to baseline/nadir.
 *
 * Response thresholds vary by tumor variant (see definition.js VARIANTS).
 */

const RESPONSE_INFO = {
  CR:   { level: 1, label: 'Complete Response' },
  PR:   { level: 2, label: 'Partial Response' },
  MinR: { level: 3, label: 'Minor Response' },
  SD:   { level: 4, label: 'Stable Disease' },
  PD:   { level: 5, label: 'Progressive Disease' },
};

function round1(val) {
  return Math.round(val * 10) / 10;
}

/**
 * @param {Array} targets - [{ label, location, blD1, blD2, curD1, curD2, nadirProduct }]
 * @param {Object} formState - { nonTarget, newLesion, clinicalStatus, steroids }
 * @param {Object} variant - from VARIANTS (hgg, lgg, dipg, medullo)
 * @returns {Object} template variables
 */
export function calculateRapno(targets, formState, variant) {
  const { nonTarget, newLesion, clinicalStatus, steroids } = formState;

  let baselineSum = 0;
  let currentSum = 0;
  let nadirSum = 0;
  let hasBaseline = false;
  let hasCurrent = false;
  const details = [];

  // Baseline guard stays `> 0`: a baseline of 0 means the lesion was
  // never measured (can't target a 0-size lesion). Current and nadir
  // guards accept 0 so that a disappeared lesion (0 × 0) correctly
  // contributes 0 to currentSum and lets the CR branch fire.
  for (const t of targets) {
    const blProd = (t.blD1 > 0 && t.blD2 > 0) ? round1(t.blD1 * t.blD2) : null;
    const curProd = (t.curD1 != null && t.curD2 != null && t.curD1 >= 0 && t.curD2 >= 0)
      ? round1(t.curD1 * t.curD2)
      : null;
    // Nadir: use manual override if provided (including 0), otherwise
    // auto from baseline.
    const nadir = (t.nadirProduct != null && t.nadirProduct >= 0) ? t.nadirProduct : blProd;

    if (blProd != null) { baselineSum += blProd; hasBaseline = true; }
    if (curProd != null) { currentSum += curProd; hasCurrent = true; }
    if (nadir != null) { nadirSum += nadir; }

    details.push({
      label: t.label,
      location: t.location || '',
      blD1: t.blD1, blD2: t.blD2, blProd,
      curD1: t.curD1, curD2: t.curD2, curProd,
      nadir,
    });
  }

  // If no explicit nadir, use baseline as nadir
  if (!details.some((d) => d.nadir != null && d.nadir !== d.blProd)) {
    nadirSum = baselineSum;
  }

  // % change from baseline
  const pctFromBaseline = (hasBaseline && hasCurrent && baselineSum > 0)
    ? round1(((currentSum - baselineSum) / baselineSum) * 100)
    : null;

  // % change from nadir
  const pctFromNadir = (nadirSum > 0 && hasCurrent)
    ? round1(((currentSum - nadirSum) / nadirSum) * 100)
    : null;

  // --- Target response per variant thresholds ---
  let targetResponse = null;
  if (hasBaseline && hasCurrent) {
    if (currentSum === 0) {
      targetResponse = 'CR';
    } else if (pctFromBaseline != null && pctFromBaseline <= variant.prThreshold) {
      targetResponse = 'PR';
    } else if (variant.hasMinorResponse && variant.minrThreshold != null
      && pctFromBaseline != null && pctFromBaseline <= variant.minrThreshold) {
      targetResponse = 'MinR';
    } else if (pctFromNadir != null && pctFromNadir >= variant.pdThreshold) {
      targetResponse = 'PD';
    } else {
      targetResponse = 'SD';
    }
  }

  // --- Overall response ---
  let overallResponse = null;
  const hasNewLesion = newLesion === 'yes';
  const nonTargetPD = nonTarget === 'progression';

  if (hasNewLesion || nonTargetPD) {
    overallResponse = 'PD';
  } else if (targetResponse === 'PD') {
    overallResponse = 'PD';
  } else if (targetResponse === 'CR' && (nonTarget === 'absent' || !nonTarget)) {
    overallResponse = 'CR';
  } else if (targetResponse === 'CR' && nonTarget === 'present') {
    overallResponse = 'PR';
  } else if (targetResponse) {
    overallResponse = targetResponse;
  }

  const overallInfo = overallResponse ? RESPONSE_INFO[overallResponse] : null;
  const targetInfo = targetResponse ? RESPONSE_INFO[targetResponse] : null;

  // --- Format measurement text for report ---
  const measLines = details
    .filter((d) => d.blProd != null || d.curProd != null)
    .map((d) => {
      const loc = d.location ? ` (${d.location})` : '';
      const bl = d.blProd != null ? `${d.blD1} x ${d.blD2} = ${d.blProd} mm²` : 'N/A';
      const cur = d.curProd != null ? `${d.curD1} x ${d.curD2} = ${d.curProd} mm²` : 'N/A';
      return `${d.label}${loc}: Baseline ${bl}, Current ${cur}`;
    });

  const nonTargetLabels = {
    absent: 'Absent (CR)', present: 'Present (non-CR/non-PD)', progression: 'Unequivocal progression',
  };
  const clinicalLabels = {
    stable: 'Stable', improved: 'Improved', worsened: 'Worsened',
  };
  const steroidLabels = {
    'stable-decreased': 'Stable / Decreased', increased: 'Increased',
  };

  return {
    variantLabel: variant.label,
    variantFullName: variant.fullName,
    sequenceNote: variant.sequence,
    targetCount: details.filter((d) => d.blProd != null || d.curProd != null).length,
    baselineSum: hasBaseline ? round1(baselineSum) : null,
    currentSum: hasCurrent ? round1(currentSum) : null,
    nadirSum: nadirSum > 0 ? round1(nadirSum) : null,
    baselineSumProvided: hasBaseline,
    currentSumProvided: hasCurrent,
    pctFromBaseline,
    pctFromNadir,
    pctLabel: pctFromBaseline != null ? `${pctFromBaseline >= 0 ? '+' : ''}${pctFromBaseline}%` : '--',
    pctNadirLabel: pctFromNadir != null ? `${pctFromNadir >= 0 ? '+' : ''}${pctFromNadir}%` : '--',
    measurementText: measLines.length > 0 ? measLines.join('\n') : 'No targets measured',
    sumText: (hasBaseline && hasCurrent) ? `Sum of products: Baseline ${round1(baselineSum)} mm², Current ${round1(currentSum)} mm² (${pctFromBaseline >= 0 ? '+' : ''}${pctFromBaseline}%)` : '',
    sumProvided: hasBaseline && hasCurrent,
    targetResponse: targetResponse || '--',
    targetResponseLabel: targetInfo?.label || 'Incomplete',
    overallResponse: overallResponse || '--',
    overallResponseLabel: overallInfo?.label || 'Incomplete',
    overallResponseLevel: overallInfo?.level || 0,
    nonTargetLabel: nonTargetLabels[nonTarget] || 'Not assessed',
    nonTargetProvided: !!nonTarget,
    newLesionLabel: newLesion === 'yes' ? 'Yes' : newLesion === 'no' ? 'No' : 'Not assessed',
    newLesionProvided: !!newLesion,
    clinicalLabel: clinicalLabels[clinicalStatus] || 'Not assessed',
    clinicalProvided: !!clinicalStatus,
    steroidLabel: steroidLabels[steroids] || 'Not assessed',
    steroidProvided: !!steroids,
    details,
  };
}
