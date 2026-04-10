import { vurNmDefinition } from './definition.js';

export function calculateVurNm(formState) {
  const { grade, side } = formState;
  const info = vurNmDefinition.grades.find((g) => g.id === grade);
  const sideLabels = { right: 'Right', left: 'Left', bilateral: 'Bilateral' };
  const level = !grade ? 0 : grade === 'mild' ? 2 : grade === 'moderate' ? 3 : 5;

  return {
    grade: grade || '--', gradeLabel: info?.label || '--', description: info?.description || '',
    gradeProvided: !!grade, sideLabel: sideLabels[side] || '', sideProvided: !!side, level,
  };
}
