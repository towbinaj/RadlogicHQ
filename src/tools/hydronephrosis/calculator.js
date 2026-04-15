import { hydronephrosisDefinition } from './definition.js';

/**
 * Compute hydronephrosis grading data. Handles two modes:
 *
 *   1. Single-side (side = 'right' | 'left'):
 *      Uses formState.grade and formState.aprpd. Returns the existing
 *      flat shape with gradeLabel, gradeDescription, aprpdLabel, etc.
 *
 *   2. Bilateral (side = 'bilateral'):
 *      Uses formState.rightGrade / leftGrade and rightAprpd / leftAprpd.
 *      Returns combined strings for gradeLabel and aprpdLabel plus
 *      per-side fields (rightGradeLabel, leftGradeLabel, etc.) so
 *      templates can show either a merged one-line summary or per-side
 *      detail. Description is suppressed in bilateral mode because two
 *      long descriptions would overflow the report.
 */
export function calculateHydronephrosis(formState, mode) {
  const {
    grade, side, aprpd,
    rightGrade, leftGrade,
    rightAprpd, leftAprpd,
  } = formState;
  const def = hydronephrosisDefinition;

  const findGrade = (g) => {
    if (mode === 'utd-postnatal') return def.utdPostnatal.find((x) => x.id === g);
    if (mode === 'utd-antenatal') return def.utdAntenatal.find((x) => x.id === g);
    if (mode === 'sfu') return def.sfuGrades.find((x) => x.id === g);
    return null;
  };

  const sideLabels = { right: 'Right', left: 'Left', bilateral: 'Bilateral' };
  const modeLabels = { 'utd-postnatal': 'UTD (Postnatal)', 'utd-antenatal': 'UTD (Antenatal)', 'sfu': 'SFU' };
  const gradeLevel = (g) => !g ? 0 : (g === 'normal' || g === '0') ? 1 : (g === 'P1' || g === 'A1' || g === '1' || g === '2') ? 2 : 4;

  if (side === 'bilateral') {
    const rInfo = findGrade(rightGrade);
    const lInfo = findGrade(leftGrade);
    const rLevel = gradeLevel(rightGrade);
    const lLevel = gradeLevel(leftGrade);

    const gradeParts = [];
    if (rInfo) gradeParts.push(`Right: ${rInfo.label}`);
    if (lInfo) gradeParts.push(`Left: ${lInfo.label}`);

    const aprpdParts = [];
    if (rightAprpd != null) aprpdParts.push(`Right ${rightAprpd} mm`);
    if (leftAprpd != null) aprpdParts.push(`Left ${leftAprpd} mm`);

    // Management from the more severe side so the report reflects the
    // dominant clinical concern.
    const primaryInfo = rLevel >= lLevel ? rInfo : lInfo;

    return {
      gradeLabel: gradeParts.length ? gradeParts.join(', ') : '--',
      gradeDescription: '',
      management: primaryInfo?.management || '',
      gradeProvided: !!rightGrade || !!leftGrade,
      managementProvided: !!primaryInfo?.management,
      modeLabel: modeLabels[mode] || '',
      sideLabel: 'Bilateral',
      sideProvided: true,
      aprpd: null,
      aprpdLabel: aprpdParts.join(', '),
      aprpdProvided: aprpdParts.length > 0,
      // Per-side detail (for templates that want granular rendering)
      rightGradeLabel: rInfo?.label || '--',
      rightGradeDescription: rInfo?.description || '',
      rightGradeProvided: !!rightGrade,
      rightAprpdLabel: rightAprpd != null ? `${rightAprpd} mm` : '',
      rightAprpdProvided: rightAprpd != null,
      leftGradeLabel: lInfo?.label || '--',
      leftGradeDescription: lInfo?.description || '',
      leftGradeProvided: !!leftGrade,
      leftAprpdLabel: leftAprpd != null ? `${leftAprpd} mm` : '',
      leftAprpdProvided: leftAprpd != null,
      bilateral: true,
      level: Math.max(rLevel, lLevel),
    };
  }

  // Single side (right / left / unset)
  const gradeInfo = findGrade(grade);

  return {
    gradeLabel: gradeInfo?.label || '--',
    gradeDescription: gradeInfo?.description || '',
    management: gradeInfo?.management || '',
    gradeProvided: !!grade,
    managementProvided: !!gradeInfo?.management,
    modeLabel: modeLabels[mode] || '',
    sideLabel: sideLabels[side] || '',
    sideProvided: !!side,
    aprpd: aprpd != null ? aprpd : null,
    aprpdLabel: aprpd != null ? `${aprpd} mm` : '',
    aprpdProvided: aprpd != null,
    bilateral: false,
    level: gradeLevel(grade),
  };
}
