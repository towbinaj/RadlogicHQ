import { klDefinition } from './definition.js';

/**
 * Kellgren-Lawrence OA grade calculator. Two modes:
 *
 *   1. Single-side (side = 'right' | 'left' | null):
 *      Uses the flat grade/joint/side fields. Unchanged shape.
 *
 *   2. Bilateral (side = 'bilateral'):
 *      Uses rightGrade/leftGrade (joint stays study-level). Returns
 *      combined gradeLabel like "Right: Grade 3 -- Moderate, Left:
 *      Grade 2 -- Minimal".
 */
export function calculateKL(formState) {
  const { grade, joint, side, rightGrade, leftGrade } = formState;
  const findGrade = (g) => klDefinition.grades.find((x) => x.id === g);
  const jointInfo = klDefinition.jointOptions.find((j) => j.id === joint);
  const sideInfo = klDefinition.sideOptions.find((s) => s.id === side);
  const gradeLevel = (g) => !g ? 0 : g === '0' ? 1 : g === '1' ? 1 : g === '2' ? 2 : g === '3' ? 3 : 5;

  if (side === 'bilateral') {
    const rInfo = findGrade(rightGrade);
    const lInfo = findGrade(leftGrade);
    const rLevel = gradeLevel(rightGrade);
    const lLevel = gradeLevel(leftGrade);

    const gradeParts = [];
    if (rInfo) gradeParts.push(`Right: ${rInfo.label}`);
    if (lInfo) gradeParts.push(`Left: ${lInfo.label}`);

    return {
      grade: (rightGrade && leftGrade) ? `R:${rightGrade} L:${leftGrade}` : rightGrade || leftGrade || '--',
      gradeLabel: gradeParts.length ? gradeParts.join(', ') : '--',
      findings: '',
      gradeProvided: !!rightGrade || !!leftGrade,
      jointLabel: jointInfo?.label || '',
      jointProvided: !!joint,
      sideLabel: 'Bilateral',
      sideProvided: true,
      rightGradeLabel: rInfo?.label || '--',
      rightGradeProvided: !!rightGrade,
      leftGradeLabel: lInfo?.label || '--',
      leftGradeProvided: !!leftGrade,
      bilateral: true,
      level: Math.max(rLevel, lLevel),
    };
  }

  // Single-side (unchanged shape)
  const info = findGrade(grade);
  return {
    grade: grade || '--',
    gradeLabel: info?.label || '--',
    findings: info?.findings || '',
    gradeProvided: !!grade,
    jointLabel: jointInfo?.label || '',
    jointProvided: !!joint,
    sideLabel: sideInfo?.label || '',
    sideProvided: !!side,
    bilateral: false,
    level: gradeLevel(grade),
  };
}
