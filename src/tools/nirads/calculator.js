import { niradsDefinition } from './definition.js';

export function calculateNirads(formState) {
  const { primaryCategory, neckCategory } = formState;
  const pInfo = niradsDefinition.primaryCategories.find((c) => c.id === primaryCategory);
  const nInfo = niradsDefinition.neckCategories.find((c) => c.id === neckCategory);

  const pLevel = !primaryCategory ? 0 : primaryCategory === '1' ? 1 : primaryCategory <= '2b' ? 2 : primaryCategory === '3' ? 4 : 5;
  const nLevel = !neckCategory ? 0 : neckCategory === '1' ? 1 : neckCategory === '2' ? 2 : neckCategory === '3' ? 4 : 5;

  // "1 - No evidence of recurrence" -> "no evidence of recurrence"
  const desc = (info) => info.label.replace(/^\S+\s+\S+\s+/, '').replace(/^./, (c) => c.toLowerCase())
    .replace(/ \((superficial|deep)\)$/, ', $1');
  const lower = (t) => t.charAt(0).toLowerCase() + t.slice(1);
  const imp = [];
  if (pInfo) imp.push(`NI-RADS Primary ${primaryCategory} (${desc(pInfo)}): ${lower(pInfo.management)}.`);
  if (nInfo) imp.push(`NI-RADS Neck ${neckCategory} (${desc(nInfo)}): ${lower(nInfo.management)}.`);

  return {
    impressionText: imp.join(' '),
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
