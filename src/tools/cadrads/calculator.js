/**
 * CAD-RADS 2.0 calculator.
 */

import { cadradsDefinition } from './definition.js';

export function calculateCadrads(formState) {
  const { category, modifiers, plaqueBurden } = formState;

  const catInfo = cadradsDefinition.categories.find((c) => c.id === category);
  const modLabels = (modifiers || []).map((m) => cadradsDefinition.modifierOptions.find((o) => o.id === m)?.label).filter(Boolean);
  const pbInfo = cadradsDefinition.plaqueBurdenOptions.find((p) => p.id === plaqueBurden);

  const level = !category ? 0 : category === '0' ? 1 : category === '1' || category === '2' ? 2 : category === '3' ? 3 : category === 'N' ? 2 : 5;

  let fullLabel = catInfo ? `CAD-RADS ${catInfo.id}` : '--';
  if (modLabels.length > 0) fullLabel += '/' + (modifiers || []).join('/');
  if (pbInfo) fullLabel += ` (${pbInfo.id})`;

  return {
    category: category || '--',
    categoryLabel: catInfo?.label || '--',
    stenosis: catInfo?.stenosis || '',
    management: catInfo?.management || '',
    categoryProvided: !!category,
    managementProvided: !!catInfo?.management,
    modifiersText: modLabels.length > 0 ? modLabels.join(', ') : '',
    modifiersProvided: modLabels.length > 0,
    plaqueBurdenLabel: pbInfo?.label || '',
    plaqueBurdenProvided: !!pbInfo,
    fullLabel,
    level,
  };
}
