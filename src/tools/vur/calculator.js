import { vurDefinition } from './definition.js';

export function calculateVur(formState, mode) {
  const { grade, side, phase } = formState;
  const grades = mode === 'vcug' ? vurDefinition.vcugGrades : vurDefinition.nuclearGrades;
  const info = grades.find((g) => g.id === grade);
  const sideLabels = { right: 'Right', left: 'Left', bilateral: 'Bilateral' };
  const phaseLabels = { filling: 'Filling phase', voiding: 'Voiding phase', both: 'Filling and voiding phases' };
  const modeLabel = mode === 'vcug' ? 'VCUG' : 'Nuclear Medicine';

  let level = 0;
  if (mode === 'vcug') level = !grade ? 0 : grade <= 'II' ? 2 : grade === 'III' ? 3 : 5;
  else level = !grade ? 0 : grade === 'mild' ? 2 : grade === 'moderate' ? 3 : 5;

  return {
    grade: grade || '--', gradeLabel: info?.label || '--', description: info?.description || '',
    gradeProvided: !!grade, modeLabel, sideLabel: sideLabels[side] || '', sideProvided: !!side,
    phaseLabel: phaseLabels[phase] || '', phaseProvided: !!phase, level,
  };
}
