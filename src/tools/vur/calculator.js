import { vurVcugDefinition } from './definition.js';

function gradeLevel(grade) {
  if (!grade) return 0;
  if (grade <= 'II') return 2;
  if (grade === 'III') return 3;
  return 5;
}

export function calculateVurVcug(formState) {
  const { side, grade, rightGrade, leftGrade } = formState;
  const sideLabels = { right: 'Right', left: 'Left', bilateral: 'Bilateral' };
  const bilateral = side === 'bilateral';

  if (bilateral) {
    const rInfo = vurVcugDefinition.grades.find((g) => g.id === rightGrade);
    const lInfo = vurVcugDefinition.grades.find((g) => g.id === leftGrade);
    const rLevel = gradeLevel(rightGrade);
    const lLevel = gradeLevel(leftGrade);

    const parts = [];
    if (rInfo) parts.push(`Right: ${rInfo.label}`);
    if (lInfo) parts.push(`Left: ${lInfo.label}`);

    return {
      grade: (rightGrade && leftGrade) ? `R:${rightGrade} L:${leftGrade}` : rightGrade || leftGrade || '--',
      gradeLabel: parts.length > 0 ? parts.join(', ') : '--',
      rightGrade: rightGrade || '--',
      rightGradeLabel: rInfo?.label || '--',
      rightDescription: rInfo?.description || '',
      rightProvided: !!rightGrade,
      leftGrade: leftGrade || '--',
      leftGradeLabel: lInfo?.label || '--',
      leftDescription: lInfo?.description || '',
      leftProvided: !!leftGrade,
      bilateral: true,
      gradeProvided: !!rightGrade || !!leftGrade,
      sideLabel: 'Bilateral',
      sideProvided: true,
      level: Math.max(rLevel, lLevel),
    };
  }

  const info = vurVcugDefinition.grades.find((g) => g.id === grade);
  return {
    grade: grade || '--',
    gradeLabel: info?.label || '--',
    description: info?.description || '',
    gradeProvided: !!grade,
    bilateral: false,
    sideLabel: sideLabels[side] || '',
    sideProvided: !!side,
    level: gradeLevel(grade),
  };
}
