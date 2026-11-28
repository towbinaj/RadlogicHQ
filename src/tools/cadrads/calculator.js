/**
 * CAD-RADS 2.0 calculator.
 */

import { cadradsDefinition } from './definition.js';

export function calculateCadrads(formState) {
  const { category, modifiers, plaqueBurden } = formState;

  const catInfo = cadradsDefinition.categories.find((c) => c.id === category);
  const opts = cadradsDefinition.modifierOptions;
  // Legacy 1.0 'V' reads as HRP; keep only the last ischemia (I) choice.
  let mods = (modifiers || []).map((m) => (m === 'V' ? 'HRP' : m)).filter((m) => opts.some((o) => o.id === m));
  const lastI = [...mods].reverse().find((m) => opts.find((o) => o.id === m)?.group === 'I');
  mods = mods.filter((m) => opts.find((o) => o.id === m)?.group !== 'I' || m === lastI);
  // No plaque at CAD-RADS 0 (and N is non-diagnostic): no plaque burden or HRP.
  const noPlaque = category === '0' || category === 'N';
  if (noPlaque) mods = mods.filter((m) => m !== 'HRP');
  mods = opts.map((o) => o.id).filter((id) => mods.includes(id)); // 2.0 order
  const modLabels = mods.map((m) => opts.find((o) => o.id === m).label);
  const pbInfo = noPlaque ? null : cadradsDefinition.plaqueBurdenOptions.find((p) => p.id === plaqueBurden);

  const level = !category ? 0 : category === '0' ? 1 : category === '1' || category === '2' ? 2 : category === '3' ? 3 : category === 'N' ? 2 : 5;

  // CAD-RADS 2.0 label: category/plaque burden/modifiers, e.g. 3/P2/HRP/I+/S.
  const parts = catInfo ? [`CAD-RADS ${catInfo.id}`, ...(pbInfo ? [pbInfo.id] : []), ...mods] : [];
  const fullLabel = catInfo ? parts.join('/') : '--';

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
