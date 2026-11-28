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
const KL_SEVERITY = { 0: 'normal', 1: 'doubtful', 2: 'minimal', 3: 'moderate', 4: 'severe' };

/** Grades 0-1 are not reported as osteoarthritis. */
function klImpression(grade, sideWord, jointWord) {
  if (grade == null || grade === '') return '';
  const site = [sideWord, jointWord || 'joint'].filter(Boolean).join(' ');
  if (grade === '0') return `No radiographic osteoarthritis of the ${site} (Kellgren-Lawrence grade 0).`;
  if (grade === '1') return `Doubtful osteoarthritis of the ${site} (Kellgren-Lawrence grade 1).`;
  return `${site.charAt(0).toUpperCase()}${site.slice(1)} osteoarthritis, Kellgren-Lawrence grade ${grade} (${KL_SEVERITY[grade]}).`;
}

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
      impressionText: (() => {
        const parts = [];
        if (rInfo) parts.push(`right grade ${rightGrade} (${KL_SEVERITY[rightGrade]})`);
        if (lInfo) parts.push(`left grade ${leftGrade} (${KL_SEVERITY[leftGrade]})`);
        if (!parts.length) return '';
        const j = jointInfo ? `, ${jointInfo.label.toLowerCase()}${joint === 'other' ? '' : 's'}` : '';
        return `Kellgren-Lawrence grading${j}: ${parts.join(', ')}.`;
      })(),
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
    impressionText: info ? klImpression(grade, sideInfo?.label.toLowerCase(), jointInfo?.label.toLowerCase()) : '',
    level: gradeLevel(grade),
  };
}
