/**
 * NASCET carotid stenosis calculator.
 *
 * % Stenosis = (1 - Dstenosis / Ddistal) × 100
 *
 * Severity: <50% mild, 50–69% moderate, ≥70% severe.
 */

export function calculateNascet(formState) {
  const { stenosisDiam, distalDiam, side } = formState;

  const entered = stenosisDiam != null && distalDiam != null;
  // Impossible measurements are flagged rather than reported as a stenosis.
  const invalid = entered && (stenosisDiam < 0 || distalDiam <= 0 || stenosisDiam > distalDiam);
  const occluded = entered && !invalid && stenosisDiam === 0;
  const pct = entered && !invalid && !occluded
    ? Math.round((1 - stenosisDiam / distalDiam) * 1000) / 10 : null;

  let severity = '';
  let level = 0;
  let note = '';
  if (invalid) {
    note = 'Stenosis diameter must be between 0 and the distal ICA diameter: check measurements.';
  } else if (occluded) {
    // No residual lumen: occlusion, not a NASCET percentage.
    severity = 'Occlusion';
    level = 5;
  } else if (pct != null) {
    if (pct < 50) { severity = 'Mild'; level = 1; }
    else if (pct < 70) { severity = 'Moderate'; level = 3; }
    else { severity = 'Severe'; level = 5; }
  }

  const sideLabels = { right: 'Right', left: 'Left' };
  const ica = side && sideLabels[side] ? `${sideLabels[side]} ICA` : 'ICA';
  const impressionText = invalid ? note
    : occluded ? `${ica} occlusion.`
      : pct != null ? `${ica}: ${pct}% stenosis by NASCET criteria (${severity.toLowerCase()}).` : '';

  return {
    pct,
    pctLabel: occluded ? 'occluded' : pct != null ? `${pct}%` : '--',
    pctProvided: pct != null,
    severity,
    severityProvided: !!severity,
    level,
    note,
    noteProvided: !!note,
    impressionText,
    occluded,
    sideLabel: sideLabels[side] || '',
    sideProvided: !!side,
    stenosisDiam,
    distalDiam,
  };
}
