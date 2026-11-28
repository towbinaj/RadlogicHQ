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
// Graf angle ranges per type, [low, high) in degrees (Graf 1984).
const GRAF_ALPHA = {
  Ia: [60, 91], Ib: [60, 91],
  'IIa-plus': [50, 60], 'IIa-minus': [50, 60], IIb: [50, 60],
  IIc: [43, 50], D: [43, 50],
  IIIa: [0, 43], IIIb: [0, 43], IV: [0, 43],
};
const GRAF_BETA = { Ia: [0, 55], Ib: [55, 91], IIc: [0, 77.0001], D: [77.0001, 181] };
const RANGE_TEXT = (r) => (r[0] === 0 ? `<${r[1]}` : r[1] > 90 ? `>=${r[0]}` : `${r[0]}-${r[1] - 1}`);

/** A note when entered angles fall outside the chosen Graf type. */
function grafAngleNote(grade, alpha, beta, prefix = '') {
  if (!grade) return '';
  const parts = [];
  const a = GRAF_ALPHA[grade];
  if (a && alpha != null && !(alpha >= a[0] && alpha < a[1])) {
    parts.push(`alpha ${alpha} deg is outside the Type ${grade.replace('-plus', '+').replace('-minus', '-')} range (${RANGE_TEXT(a)} deg)`);
  }
  const b = GRAF_BETA[grade];
  if (b && beta != null && !(beta >= b[0] && beta < b[1])) {
    const txt = grade === 'IIc' ? '<=77' : grade === 'D' ? '>77' : RANGE_TEXT(b);
    parts.push(`beta ${beta} deg is outside the Type ${grade} range (${txt} deg)`);
  }
  if (!parts.length) return '';
  const msg = parts.join('; ');
  return `${prefix}${msg.charAt(0).toUpperCase()}${msg.slice(1)}.`;
}

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

    const isGraf = mode === 'graf';
    const angleNote = isGraf
      ? [grafAngleNote(rightGrade, rightAlpha, rightBeta, 'Right: '), grafAngleNote(leftGrade, leftAlpha, leftBeta, 'Left: ')].filter(Boolean).join(' ')
      : '';
    const alphaParts = [];
    if (isGraf && rightAlpha != null) alphaParts.push(`Right ${rightAlpha}\u00b0`);
    if (isGraf && leftAlpha != null) alphaParts.push(`Left ${leftAlpha}\u00b0`);

    const betaParts = [];
    if (isGraf && rightBeta != null) betaParts.push(`Right ${rightBeta}\u00b0`);
    if (isGraf && leftBeta != null) betaParts.push(`Left ${leftBeta}\u00b0`);

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
      angleNote,
      angleNoteProvided: !!angleNote,
      impressionText: gradeParts.length ? `${gradeParts.join(', ')}.${angleNote ? ' ' + angleNote : ''}` : '',
      level: Math.max(rLevel, lLevel),
    };
  }

  // Single-side (pre-refactor shape, unchanged)
  const info = findGrade(grade);
  const isGraf = mode === 'graf';
  const angleNote = isGraf ? grafAngleNote(grade, alpha, beta) : '';
  const impressionText = info
    ? `${sideLabels[side] ? `${sideLabels[side]} hip` : 'Hip'}: ${info.label}.${angleNote ? ' ' + angleNote : ''}`
    : '';

  return {
    grade: grade || '--',
    gradeLabel: info?.label || '--',
    description: info?.description || '',
    gradeProvided: !!grade,
    modeLabel,
    sideLabel: sideLabels[side] || '',
    sideProvided: !!side,
    alphaLabel: isGraf && alpha != null ? `${alpha}\u00b0` : '',
    alphaProvided: isGraf && alpha != null,
    betaLabel: isGraf && beta != null ? `${beta}\u00b0` : '',
    betaProvided: isGraf && beta != null,
    bilateral: false,
    angleNote,
    angleNoteProvided: !!angleNote,
    impressionText,
    level: gradeLevel(grade),
  };
}
