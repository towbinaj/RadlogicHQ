/**
 * SAH grading calculator — Hunt-Hess + Modified Fisher.
 */

import { sahDefinition } from './definition.js';

export function calculateSah(formState) {
  const { huntHess, modifiedFisher } = formState;

  const hhInfo = sahDefinition.huntHessGrades.find((g) => g.id === huntHess);
  const mfInfo = sahDefinition.modifiedFisherGrades.find((g) => g.id === modifiedFisher);

  const hhLevel = !huntHess ? 0 : huntHess <= '2' ? 2 : huntHess === '3' ? 3 : 5;
  const mfLevel = !modifiedFisher ? 0 : modifiedFisher <= '1' ? 1 : modifiedFisher <= '3' ? 3 : 5;

  return {
    huntHessGrade: huntHess || '--',
    huntHessLabel: hhInfo ? `${hhInfo.label}: ${hhInfo.description}` : '--',
    huntHessDescription: hhInfo?.description || '',
    huntHessPrognosis: hhInfo?.prognosis || '',
    huntHessProvided: !!huntHess,
    huntHessLevel: hhLevel,
    modifiedFisherGrade: modifiedFisher || '--',
    modifiedFisherLabel: mfInfo ? `${mfInfo.label}: ${mfInfo.description}` : '--',
    modifiedFisherDescription: mfInfo?.description || '',
    modifiedFisherVasospasm: mfInfo?.vasospasm || '',
    modifiedFisherProvided: !!modifiedFisher,
    modifiedFisherLevel: mfLevel,
    level: Math.max(hhLevel, mfLevel),
  };
}
