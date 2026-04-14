/**
 * Fetal Lung Volume — o/e TFLV for CDH prognosis.
 *
 * Expected lung volume formula (Rypens et al. 2001):
 *   Expected TFLV (mL) = 0.002 × GA^2.913
 *
 * Measurement: sum of sequential slice areas × slice thickness.
 *
 * Reference: Rypens F et al. Radiology 2001;219(1):250-257.
 */

export const fetalLungDefinition = {
  id: 'fetal-lung',
  name: 'Fetal Lung Volume',

  severityCategories: [
    { min: 0, max: 25, label: 'Severe', description: 'O/E TFLV <25% — survival approx 35\u201356%', color: 'danger' },
    { min: 25, max: 35, label: 'Moderate', description: 'O/E TFLV 25\u201335% — survival approx 56%', color: 'warning' },
    { min: 35, max: Infinity, label: 'Mild', description: 'O/E TFLV >35% — survival approx 90%', color: 'success' },
  ],

  sideOptions: [
    { id: 'left', label: 'Left CDH' },
    { id: 'right', label: 'Right CDH' },
  ],

  liverOptions: [
    { id: 'up', label: 'Liver up (herniated)' },
    { id: 'down', label: 'Liver down (not herniated)' },
  ],

  parseRules: {},
};
