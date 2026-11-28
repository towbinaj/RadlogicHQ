/**
 * Kyphosis/Lordosis calculator.
 */

export function calculateKyphosis(formState) {
  const { thoracicAngle, lumbarAngle, wedging, scheuermann, priorThoracic, priorLumbar } = formState;

  const hasThoracic = thoracicAngle != null && thoracicAngle >= 0;
  const hasLumbar = lumbarAngle != null && lumbarAngle >= 0;

  let thoracicInterpretation = '';
  let thoracicLevel = 0;
  if (hasThoracic) {
    if (thoracicAngle < 20) { thoracicInterpretation = 'Decreased (hypokyphosis)'; thoracicLevel = 2; }
    else if (thoracicAngle <= 40) { thoracicInterpretation = 'Normal'; thoracicLevel = 1; }
    else if (thoracicAngle <= 45) { thoracicInterpretation = 'Borderline increased'; thoracicLevel = 2; }
    else { thoracicInterpretation = 'Increased (hyperkyphosis)'; thoracicLevel = 3; }
  }

  let lumbarInterpretation = '';
  if (hasLumbar) {
    if (lumbarAngle >= 40 && lumbarAngle <= 60) lumbarInterpretation = 'Normal';
    else if (lumbarAngle < 40) lumbarInterpretation = 'Decreased (hypolordosis)';
    else lumbarInterpretation = 'Increased (hyperlordosis)';
  }

  // Scheuermann needs anterior wedging (Sorensen: >=5 deg in >=3 adjacent
  // vertebrae); with "No anterior wedging" selected the label is withheld.
  const scheuermannStated = !!scheuermann && wedging !== 'none';
  const scheuermannsLabel = scheuermannStated ? 'Features consistent with Scheuermann disease' : '';

  const imp = [];
  if (hasThoracic) imp.push(`Thoracic kyphosis ${thoracicAngle}°: ${thoracicInterpretation}.`);
  if (hasLumbar) imp.push(`Lumbar lordosis ${lumbarAngle}°: ${lumbarInterpretation}.`);
  if (scheuermannStated && imp.length) imp.push(`${scheuermannsLabel}.`);
  const impressionText = imp.join(' ');

  return {
    thoracicAngle: hasThoracic ? thoracicAngle : null,
    thoracicLabel: hasThoracic ? `${thoracicAngle}°` : '--',
    thoracicProvided: hasThoracic,
    thoracicInterpretation,
    thoracicLevel,
    lumbarAngle: hasLumbar ? lumbarAngle : null,
    lumbarLabel: hasLumbar ? `${lumbarAngle}°` : '--',
    lumbarProvided: hasLumbar,
    lumbarInterpretation,
    wedgingLabel: wedging === 'present' ? 'Anterior vertebral body wedging (≥5° in ≥3 adjacent vertebrae)' : wedging === 'none' ? 'No anterior wedging' : '',
    wedgingProvided: !!wedging,
    scheuermannsLabel,
    scheuermannsProvided: scheuermannStated,
    impressionText,
    priorThoracicText: priorThoracic || '',
    priorThoracicProvided: !!priorThoracic,
    priorLumbarText: priorLumbar || '',
    priorLumbarProvided: !!priorLumbar,
    level: thoracicLevel,
  };
}
