import { hipDysplasiaDefinition } from './definition.js';

export function calculateHipDysplasia(formState, mode) {
  const { grade, side, alpha, beta } = formState;
  const grades = mode === 'graf' ? hipDysplasiaDefinition.grafTypes : hipDysplasiaDefinition.aaosCategories;
  const info = grades.find((g) => g.id === grade);
  const sideLabels = { right: 'Right', left: 'Left', bilateral: 'Bilateral' };
  const modeLabel = mode === 'graf' ? 'Graf' : 'AAOS';

  let level = 0;
  if (mode === 'graf') {
    level = !grade ? 0 : (grade === 'Ia' || grade === 'Ib') ? 1 : grade.startsWith('IIa') ? 2 : 4;
  } else {
    level = !grade ? 0 : grade === 'normal' ? 1 : grade === 'dysplastic' ? 2 : 4;
  }

  return {
    grade: grade || '--', gradeLabel: info?.label || '--', description: info?.description || '',
    gradeProvided: !!grade, modeLabel, sideLabel: sideLabels[side] || '', sideProvided: !!side,
    alphaLabel: alpha != null ? `${alpha}\u00b0` : '', alphaProvided: alpha != null,
    betaLabel: beta != null ? `${beta}\u00b0` : '', betaProvided: beta != null,
    level,
  };
}
