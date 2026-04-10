/**
 * Vesicoureteral Reflux (VUR) Grading — VCUG + Nuclear Medicine.
 *
 * References:
 *   VCUG: International Reflux Study Committee. Med Radiogr Photogr 1985.
 *   Nuclear: Willi UV, Treves ST. J Nucl Med 1983;24(6):462-468.
 */

export const vurDefinition = {
  id: 'vur',
  name: 'VUR Grading',

  vcugGrades: [
    { id: 'I', label: 'Grade I', description: 'Reflux into non-dilated ureter only; does not reach kidney' },
    { id: 'II', label: 'Grade II', description: 'Reflux to renal pelvis without dilation; normal calyces' },
    { id: 'III', label: 'Grade III', description: 'Mild ureteral and pelvicalyceal dilation; minimal calyceal blunting' },
    { id: 'IV', label: 'Grade IV', description: 'Moderate dilation; tortuous ureter; calyceal blunting but papillary impressions preserved' },
    { id: 'V', label: 'Grade V', description: 'Severe dilation; very tortuous ureter; loss of papillary impressions' },
  ],

  nuclearGrades: [
    { id: 'mild', label: 'Mild', description: 'Tracer in ureter only; no renal collecting system involvement' },
    { id: 'moderate', label: 'Moderate', description: 'Tracer in non-dilated collecting system and ureter' },
    { id: 'severe', label: 'Severe', description: 'Dilated ureter and dilated collecting system' },
  ],

  sideOptions: [
    { id: 'right', label: 'Right' },
    { id: 'left', label: 'Left' },
    { id: 'bilateral', label: 'Bilateral' },
  ],

  phaseOptions: [
    { id: 'filling', label: 'Filling' },
    { id: 'voiding', label: 'Voiding' },
    { id: 'both', label: 'Both' },
  ],

  parseRules: {},
};
