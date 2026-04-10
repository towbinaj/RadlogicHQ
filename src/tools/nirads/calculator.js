import { niradsDefinition } from './definition.js';

export function calculateNirads(formState) {
  const { primaryCategory, neckCategory } = formState;
  const pInfo = niradsDefinition.primaryCategories.find((c) => c.id === primaryCategory);
  const nInfo = niradsDefinition.neckCategories.find((c) => c.id === neckCategory);

  const pLevel = !primaryCategory ? 0 : primaryCategory === '1' ? 1 : primaryCategory <= '2b' ? 2 : primaryCategory === '3' ? 4 : 5;
  const nLevel = !neckCategory ? 0 : neckCategory === '1' ? 1 : neckCategory === '2' ? 2 : neckCategory === '3' ? 4 : 5;

  return {
    primaryCategory: primaryCategory || '--',
    primaryLabel: pInfo?.label || '--',
    primaryFindings: pInfo?.findings || '',
    primaryManagement: pInfo?.management || '',
    primaryRecurrence: pInfo?.recurrence || '',
    primaryProvided: !!primaryCategory,
    neckCategory: neckCategory || '--',
    neckLabel: nInfo?.label || '--',
    neckManagement: nInfo?.management || '',
    neckProvided: !!neckCategory,
    level: Math.max(pLevel, nLevel),
  };
}
