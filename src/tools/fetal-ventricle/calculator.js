/**
 * Fetal lateral ventricle width calculator.
 * Auto-categorizes based on atrial width measurement.
 */

export function calculateFetalVentricle(formState) {
  const { width, side, ga } = formState;

  const hasWidth = width != null && width >= 0;
  const sideLabels = { right: 'Right', left: 'Left', bilateral: 'Bilateral' };

  let category = '';
  let categoryLabel = '';
  let level = 0;

  if (hasWidth) {
    if (width < 10) { category = 'Normal'; categoryLabel = 'Normal (<10 mm)'; level = 1; }
    else if (width < 12) { category = 'Mild ventriculomegaly'; categoryLabel = 'Mild (10\u201312 mm)'; level = 2; }
    else if (width < 15) { category = 'Moderate ventriculomegaly'; categoryLabel = 'Moderate (12\u201315 mm)'; level = 3; }
    else { category = 'Severe ventriculomegaly'; categoryLabel = 'Severe (\u226515 mm)'; level = 5; }
  }

  return {
    width: hasWidth ? width : null,
    widthLabel: hasWidth ? `${width} mm` : '--',
    widthProvided: hasWidth,
    category,
    categoryLabel,
    categoryProvided: !!category,
    sideLabel: sideLabels[side] || '',
    sideProvided: !!side,
    gaLabel: ga ? `${ga} weeks` : '',
    gaProvided: !!ga,
    level,
  };
}
