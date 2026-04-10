/**
 * BI-RADS calculator — maps category selection to management recommendation.
 */

import { biradsDefinition } from './definition.js';

export function calculateBirads(formState) {
  const { category, modality, laterality } = formState;

  const catInfo = biradsDefinition.categories.find((c) => c.id === category);

  const modalityLabels = { mammo: 'Mammography', us: 'Ultrasound', mri: 'MRI' };
  const lateralityLabels = { right: 'Right', left: 'Left', bilateral: 'Bilateral' };

  return {
    category: category || '--',
    categoryLabel: catInfo?.label || '--',
    management: catInfo?.management || '',
    risk: catInfo?.risk || '',
    categoryProvided: !!category,
    managementProvided: !!catInfo?.management,
    riskProvided: !!catInfo?.risk,
    modalityLabel: modalityLabels[modality] || '',
    modalityProvided: !!modality,
    lateralityLabel: lateralityLabels[laterality] || '',
    lateralityProvided: !!laterality,
    level: catInfo ? getCategoryLevel(category) : 0,
  };
}

function getCategoryLevel(cat) {
  if (cat === '0') return 2;
  if (cat === '1' || cat === '2') return 1;
  if (cat === '3') return 2;
  if (cat === '4a') return 3;
  if (cat === '4b') return 4;
  if (cat === '4c' || cat === '5') return 5;
  if (cat === '6') return 5;
  return 0;
}
