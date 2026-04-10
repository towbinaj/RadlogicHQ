/**
 * VUR Grading — Nuclear Medicine (Radionuclide Cystography).
 *
 * Reference: Willi UV, Treves ST. J Nucl Med 1983;24(6):462-468.
 */

export const vurNmDefinition = {
  id: 'vur-nm',
  name: 'VUR (Nuclear)',

  grades: [
    { id: 'mild', label: 'Mild', description: 'Tracer in ureter only; no renal collecting system involvement' },
    { id: 'moderate', label: 'Moderate', description: 'Tracer in non-dilated collecting system and ureter' },
    { id: 'severe', label: 'Severe', description: 'Dilated ureter and dilated collecting system' },
  ],

  sideOptions: [
    { id: 'right', label: 'Right' },
    { id: 'left', label: 'Left' },
    { id: 'bilateral', label: 'Bilateral' },
  ],

  parseRules: {},
};
