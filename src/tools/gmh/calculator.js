import { gmhDefinition } from './definition.js';

export function calculateGmh(formState) {
  const { grade, side } = formState;
  const info = gmhDefinition.grades.find((g) => g.id === grade);
  const sideLabels = { right: 'Right', left: 'Left', bilateral: 'Bilateral' };
  const level = !grade ? 0 : grade === 'I' || grade === 'II' ? 2 : grade === 'III' ? 3 : 5;

  return {
    grade: grade || '--', gradeLabel: info?.label || '--', description: info?.description || '',
    prognosis: info?.prognosis || '', gradeProvided: !!grade, prognosisProvided: !!info?.prognosis,
    sideLabel: sideLabels[side] || '', sideProvided: !!side, level,
  };
}
