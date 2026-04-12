import { vurNmDefinition } from './definition.js';

function gradeLevel(grade) {
  if (!grade) return 0;
  if (grade === 'mild') return 2;
  if (grade === 'moderate') return 3;
  return 5;
}

export function calculateVurNm(formState) {
  const { side, grade, rightGrade, leftGrade } = formState;
  const sideLabels = { right: 'Right', left: 'Left', bilateral: 'Bilateral' };
  const bilateral = side === 'bilateral';

  if (bilateral) {
    const rInfo = vurNmDefinition.grades.find((g) => g.id === rightGrade);
    const lInfo = vurNmDefinition.grades.find((g) => g.id === leftGrade);

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
      level: Math.max(gradeLevel(rightGrade), gradeLevel(leftGrade)),
    };
  }

  const info = vurNmDefinition.grades.find((g) => g.id === grade);
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
