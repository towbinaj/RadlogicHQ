/**
 * NASCET carotid stenosis calculator.
 *
 * % Stenosis = (1 - Dstenosis / Ddistal) × 100
 *
 * Severity: <50% mild, 50–69% moderate, ≥70% severe.
 */

export function calculateNascet(formState) {
  const { stenosisDiam, distalDiam, side } = formState;

  const hasValues = stenosisDiam != null && distalDiam != null && distalDiam > 0;
  const pct = hasValues ? Math.round((1 - stenosisDiam / distalDiam) * 1000) / 10 : null;

  let severity = '';
  let level = 0;
  if (pct != null) {
    if (pct < 50) { severity = 'Mild'; level = 1; }
    else if (pct < 70) { severity = 'Moderate'; level = 3; }
    else { severity = 'Severe'; level = 5; }
  }

  const sideLabels = { right: 'Right', left: 'Left' };

  return {
    pct,
    pctLabel: pct != null ? `${pct}%` : '--',
    pctProvided: pct != null,
    severity,
    severityProvided: !!severity,
    level,
    sideLabel: sideLabels[side] || '',
    sideProvided: !!side,
    stenosisDiam,
    distalDiam,
  };
}
