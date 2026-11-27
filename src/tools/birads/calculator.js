/**
 * BI-RADS calculator — maps category selection to management recommendation.
 */

import { biradsDefinition } from './definition.js';

export function calculateBirads(formState) {
  const { category, modality, laterality, indication } = formState;

  const catInfo = biradsDefinition.categories.find((c) => c.id === category);
  const labelOf = (opts, id) => opts.find((o) => o.id === id)?.label || '';
  const lateralityLabels = { right: 'Right', left: 'Left', bilateral: 'Bilateral' };
  const modalityLabel = labelOf(biradsDefinition.modalityOptions, modality);
  const indicationLabel = labelOf(biradsDefinition.indicationOptions, indication);

  return {
    // Both category 0 scenarios ('0', '0p') display and code as 0.
    category: catInfo ? (catInfo.display || catInfo.id) : '--',
    categoryId: catInfo ? catInfo.id : null,
    categoryLabel: catInfo?.label || '--',
    management: catInfo?.management || '',
    risk: catInfo?.risk || '',
    categoryProvided: !!category,
    managementProvided: !!catInfo?.management,
    riskProvided: !!catInfo?.risk,
    modalityLabel,
    modalityProvided: !!modalityLabel,
    indicationLabel,
    indicationProvided: !!indicationLabel,
    lateralityLabel: lateralityLabels[laterality] || '',
    lateralityProvided: !!laterality,
    level: catInfo ? getCategoryLevel(category) : 0,
  };
}

function getCategoryLevel(cat) {
  if (cat === '0' || cat === '0p') return 2;
  if (cat === '1' || cat === '2') return 1;
  if (cat === '3') return 2;
  if (cat === '4a') return 3;
  if (cat === '4b') return 4;
  if (cat === '4c' || cat === '5') return 5;
  if (cat === '6') return 5;
  return 0;
}
