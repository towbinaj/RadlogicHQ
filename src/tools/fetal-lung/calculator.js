/**
 * Fetal lung volume calculator.
 *
 * Expected TFLV (mL) = 0.002 × GA^2.913 (Rypens et al. 2001)
 * O/E TFLV (%) = (observed / expected) × 100
 */

import { fetalLungDefinition } from './definition.js';

function r1(v) { return Math.round(v * 10) / 10; }

export function calculateFetalLung(formState) {
  const { ga, observedVolume, cdhSide, liverPosition } = formState;

  const hasGa = ga != null && ga >= 20 && ga <= 40;
  const hasObserved = observedVolume != null && observedVolume > 0;

  // Rypens formula
  const expectedVolume = hasGa ? r1(0.002 * Math.pow(ga, 2.913)) : null;

  // O/E ratio
  const oeRatio = (hasObserved && expectedVolume > 0) ? r1((observedVolume / expectedVolume) * 100) : null;

  // Severity
  let severity = '';
  let severityDesc = '';
  let level = 0;
  if (oeRatio != null) {
    const cat = fetalLungDefinition.severityCategories.find((c) => oeRatio >= c.min && oeRatio < c.max);
    if (cat) { severity = cat.label; severityDesc = cat.description; }
    level = oeRatio < 25 ? 5 : oeRatio < 35 ? 3 : 1;
  }

  const sideLabels = { left: 'Left', right: 'Right' };
  const liverLabels = { up: 'Liver up (herniated)', down: 'Liver down (not herniated)' };

  return {
    gaLabel: hasGa ? `${ga} weeks` : '',
    gaProvided: hasGa,
    observedLabel: hasObserved ? `${observedVolume} mL` : '--',
    observedProvided: hasObserved,
    expectedLabel: expectedVolume != null ? `${expectedVolume} mL` : '--',
    expectedProvided: expectedVolume != null,
    oeRatio,
    oeLabel: oeRatio != null ? `${oeRatio}%` : '--',
    oeProvided: oeRatio != null,
    severity,
    severityDesc,
    severityProvided: !!severity,
    cdhSideLabel: sideLabels[cdhSide] || '',
    cdhSideProvided: !!cdhSide,
    liverLabel: liverLabels[liverPosition] || '',
    liverProvided: !!liverPosition,
    level,
  };
}
