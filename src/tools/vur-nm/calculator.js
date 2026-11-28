import { vurNmDefinition } from './definition.js';

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

const TERM = (i) => i.label.toLowerCase();

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
      impressionText: vurImpression('bilateral', null, rInfo, lInfo, TERM),
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
    impressionText: vurImpression(side, info, null, null, TERM),
    sideLabel: sideLabels[side] || '',
    sideProvided: !!side,
    level: gradeLevel(grade),
  };
}
