/**
 * Balthazar / CTSI calculator.
 *
 * CTSI = Balthazar grade points (0–4) + Necrosis points (0–6).
 * Severity: 0–3 mild, 4–6 moderate, 7–10 severe.
 */

import { balthazarDefinition } from './definition.js';

export function calculateBalthazar(formState) {
  const { grade, necrosis } = formState;

  const gradeInfo = balthazarDefinition.gradeOptions.find((g) => g.id === grade);
  const necrosisInfo = balthazarDefinition.necrosisOptions.find((n) => n.id === necrosis);

  const gradePoints = gradeInfo?.points ?? null;
  const necrosisPoints = necrosisInfo?.points ?? null;

  const hasGrade = gradePoints != null;
  const hasNecrosis = necrosisPoints != null;
  const ctsi = (hasGrade && hasNecrosis) ? gradePoints + necrosisPoints : null;

  let severity = '';
  let level = 0;
  if (ctsi != null) {
    if (ctsi <= 3) { severity = 'Mild'; level = 1; }
    else if (ctsi <= 6) { severity = 'Moderate'; level = 3; }
    else { severity = 'Severe'; level = 5; }
  }

  const necrosisLabels = { none: 'None', lt30: '<30%', '30-50': '30–50%', gt50: '>50%' };

  return {
    gradeLabel: gradeInfo?.label || '--',
    gradePoints: hasGrade ? gradePoints : null,
    gradeProvided: hasGrade,
    necrosisLabel: necrosisLabels[necrosis] || '--',
    necrosisPoints: hasNecrosis ? necrosisPoints : null,
    necrosisProvided: hasNecrosis,
    ctsi,
    ctsiLabel: ctsi != null ? `${ctsi}/10` : '--',
    ctsiProvided: ctsi != null,
    severity,
    severityProvided: !!severity,
    level,
  };
}
