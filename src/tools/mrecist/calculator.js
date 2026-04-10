/**
 * mRECIST calculator — enhancing (viable) tumor diameters only.
 *
 * CR: All enhancing diameters = 0 (disappearance of arterial enhancement)
 * PR: ≥30% decrease from baseline sum
 * PD: ≥20% increase from nadir sum
 * SD: Neither PR nor PD
 */

const RESPONSE_INFO = {
  CR: { level: 1, label: 'Complete Response' },
  PR: { level: 2, label: 'Partial Response' },
  SD: { level: 3, label: 'Stable Disease' },
  PD: { level: 4, label: 'Progressive Disease' },
};

function round1(v) { return Math.round(v * 10) / 10; }

export function calculateMrecist(formState, targets) {
  const { nonTarget, newLesion } = formState;

  let baselineSum = 0, currentSum = 0, nadirSum = 0;
  let hasBaseline = false, hasCurrent = false, hasNadir = false;

  for (const t of targets) {
    if (t.baseline > 0) { baselineSum += t.baseline; hasBaseline = true; }
    if (t.current != null && t.current >= 0) { currentSum += t.current; hasCurrent = true; }
    if (t.nadir != null && t.nadir >= 0) { nadirSum += t.nadir; hasNadir = true; }
  }

  if (!hasNadir && hasBaseline) { nadirSum = baselineSum; hasNadir = true; }

  const pctFromBaseline = (hasBaseline && hasCurrent && baselineSum > 0) ? round1(((currentSum - baselineSum) / baselineSum) * 100) : null;
  const pctFromNadir = (hasNadir && hasCurrent && nadirSum > 0) ? round1(((currentSum - nadirSum) / nadirSum) * 100) : null;

  let targetResponse = null;
  if (hasBaseline && hasCurrent) {
    if (currentSum === 0) targetResponse = 'CR';
    else if (pctFromBaseline <= -30) targetResponse = 'PR';
    else if (pctFromNadir != null && pctFromNadir >= 20) targetResponse = 'PD';
    else targetResponse = 'SD';
  }

  let overallResponse = null;
  if (newLesion === 'yes' || nonTarget === 'progression') overallResponse = 'PD';
  else if (targetResponse === 'PD') overallResponse = 'PD';
  else if (targetResponse === 'CR' && (nonTarget === 'absent' || !nonTarget)) overallResponse = 'CR';
  else if (targetResponse === 'CR' && nonTarget === 'present') overallResponse = 'PR';
  else if (targetResponse) overallResponse = targetResponse;

  const overallInfo = overallResponse ? RESPONSE_INFO[overallResponse] : null;

  return {
    baselineSum: hasBaseline ? round1(baselineSum) : null,
    currentSum: hasCurrent ? round1(currentSum) : null,
    baselineSumProvided: hasBaseline,
    currentSumProvided: hasCurrent,
    pctFromBaseline,
    pctLabel: pctFromBaseline != null ? `${pctFromBaseline >= 0 ? '+' : ''}${pctFromBaseline}%` : '--',
    overallResponse: overallResponse || '--',
    overallResponseLabel: overallInfo?.label || 'Incomplete',
    overallResponseLevel: overallInfo?.level || 0,
    nonTargetLabel: { absent: 'Absent (CR)', present: 'Present (non-CR/non-PD)', progression: 'Unequivocal progression' }[nonTarget] || 'Not assessed',
    nonTargetProvided: !!nonTarget,
    newLesionLabel: newLesion === 'yes' ? 'Yes' : newLesion === 'no' ? 'No' : 'Not assessed',
    newLesionProvided: !!newLesion,
  };
}
