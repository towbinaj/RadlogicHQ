import { hipDysplasiaDefinition } from './definition.js';

/**
 * Compute hip dysplasia classification data. Two modes:
 *
 *   1. Single-side (side = 'right' | 'left' | null):
 *      Uses grade / alpha / beta. Same shape as pre-refactor so
 *      existing templates and user customizations keep working.
 *
 *   2. Bilateral (side = 'bilateral'):
 *      Uses rightGrade/leftGrade + rightAlpha/leftAlpha + rightBeta/
 *      leftBeta. Returns combined strings (e.g. "Right: Type Ib,
 *      Left: Type IIc") plus per-side detail fields.
 */
export function calculateHipDysplasia(formState, mode) {
  const {
    grade, side, alpha, beta,
    rightGrade, leftGrade,
    rightAlpha, leftAlpha,
    rightBeta, leftBeta,
  } = formState;

  const grades = mode === 'graf' ? hipDysplasiaDefinition.grafTypes : hipDysplasiaDefinition.aaosCategories;
  const findGrade = (g) => grades.find((x) => x.id === g);
  const sideLabels = { right: 'Right', left: 'Left', bilateral: 'Bilateral' };
  const modeLabel = mode === 'graf' ? 'Graf' : 'AAOS';

  const gradeLevel = (g) => {
    if (!g) return 0;
    if (mode === 'graf') {
      if (g === 'Ia' || g === 'Ib') return 1;
      if (g.startsWith('IIa')) return 2;
      return 4;
    }
    return g === 'normal' ? 1 : g === 'dysplastic' ? 2 : 4;
  };

  if (side === 'bilateral') {
    const rInfo = findGrade(rightGrade);
    const lInfo = findGrade(leftGrade);
    const rLevel = gradeLevel(rightGrade);
    const lLevel = gradeLevel(leftGrade);

    const gradeParts = [];
    if (rInfo) gradeParts.push(`Right: ${rInfo.label}`);
    if (lInfo) gradeParts.push(`Left: ${lInfo.label}`);

    const alphaParts = [];
    if (rightAlpha != null) alphaParts.push(`Right ${rightAlpha}\u00b0`);
    if (leftAlpha != null) alphaParts.push(`Left ${leftAlpha}\u00b0`);

    const betaParts = [];
    if (rightBeta != null) betaParts.push(`Right ${rightBeta}\u00b0`);
    if (leftBeta != null) betaParts.push(`Left ${leftBeta}\u00b0`);

    return {
      grade: (rightGrade && leftGrade) ? `R:${rightGrade} L:${leftGrade}` : rightGrade || leftGrade || '--',
      gradeLabel: gradeParts.length ? gradeParts.join(', ') : '--',
      description: '',
      gradeProvided: !!rightGrade || !!leftGrade,
      modeLabel,
      sideLabel: 'Bilateral',
      sideProvided: true,
      alphaLabel: alphaParts.join(', '),
      alphaProvided: alphaParts.length > 0,
      betaLabel: betaParts.join(', '),
      betaProvided: betaParts.length > 0,
      rightGradeLabel: rInfo?.label || '--',
      rightGradeProvided: !!rightGrade,
      leftGradeLabel: lInfo?.label || '--',
      leftGradeProvided: !!leftGrade,
      bilateral: true,
      level: Math.max(rLevel, lLevel),
    };
  }

  // Single-side (pre-refactor shape, unchanged)
  const info = findGrade(grade);

  return {
    grade: grade || '--',
    gradeLabel: info?.label || '--',
    description: info?.description || '',
    gradeProvided: !!grade,
    modeLabel,
    sideLabel: sideLabels[side] || '',
    sideProvided: !!side,
    alphaLabel: alpha != null ? `${alpha}\u00b0` : '',
    alphaProvided: alpha != null,
    betaLabel: beta != null ? `${beta}\u00b0` : '',
    betaProvided: beta != null,
    bilateral: false,
    level: gradeLevel(grade),
  };
}
