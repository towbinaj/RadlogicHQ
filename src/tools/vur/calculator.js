import { vurVcugDefinition } from './definition.js';

/**
 * Impression naming the finding and side. `term(info)` gives the grade
 * wording ("grade III" / "severe").
 */
function vurImpression(side, info, rInfo, lInfo, term) {
  if (side === 'bilateral') {
    if (rInfo && lInfo) return `Bilateral vesicoureteral reflux: right ${term(rInfo)}, left ${term(lInfo)}.`;
    const one = rInfo || lInfo;
    if (!one) return '';
    return `${rInfo ? 'Right' : 'Left'} vesicoureteral reflux, ${term(one)}.`;
  }
  if (!info) return '';
  const prefix = side === 'right' ? 'Right v' : side === 'left' ? 'Left v' : 'V';
  return `${prefix}esicoureteral reflux, ${term(info)}.`;
}

const TERM = (i) => i.label.replace('Grade', 'grade');

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
      impressionText: vurImpression('bilateral', null, rInfo, lInfo, TERM),
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
    impressionText: vurImpression(side, info, null, null, TERM),
    sideLabel: sideLabels[side] || '',
    sideProvided: !!side,
    level: gradeLevel(grade),
  };
}
