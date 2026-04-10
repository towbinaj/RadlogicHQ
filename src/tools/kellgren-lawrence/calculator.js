import { klDefinition } from './definition.js';

export function calculateKL(formState) {
  const { grade, joint, side } = formState;
  const info = klDefinition.grades.find((g) => g.id === grade);
  const jointInfo = klDefinition.jointOptions.find((j) => j.id === joint);
  const sideInfo = klDefinition.sideOptions.find((s) => s.id === side);
  const level = !grade ? 0 : grade === '0' ? 1 : grade === '1' ? 1 : grade === '2' ? 2 : grade === '3' ? 3 : 5;

  return {
    grade: grade || '--',
    gradeLabel: info?.label || '--',
    findings: info?.findings || '',
    gradeProvided: !!grade,
    jointLabel: jointInfo?.label || '',
    jointProvided: !!joint,
    sideLabel: sideInfo?.label || '',
    sideProvided: !!side,
    level,
  };
}
