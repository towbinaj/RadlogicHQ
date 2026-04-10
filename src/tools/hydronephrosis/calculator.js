import { hydronephrosisDefinition } from './definition.js';

export function calculateHydronephrosis(formState, mode) {
  const { grade, side, aprpd } = formState;
  const def = hydronephrosisDefinition;

  let gradeInfo = null;
  if (mode === 'utd-postnatal') gradeInfo = def.utdPostnatal.find((g) => g.id === grade);
  else if (mode === 'utd-antenatal') gradeInfo = def.utdAntenatal.find((g) => g.id === grade);
  else if (mode === 'sfu') gradeInfo = def.sfuGrades.find((g) => g.id === grade);

  const sideLabels = { right: 'Right', left: 'Left', bilateral: 'Bilateral' };
  const modeLabels = { 'utd-postnatal': 'UTD (Postnatal)', 'utd-antenatal': 'UTD (Antenatal)', 'sfu': 'SFU' };
  const level = !grade ? 0 : (grade === 'normal' || grade === '0') ? 1 : (grade === 'P1' || grade === 'A1' || grade === '1' || grade === '2') ? 2 : 4;

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
    level,
  };
}
