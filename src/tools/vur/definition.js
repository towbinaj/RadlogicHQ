/**
 * VUR Grading — VCUG (Fluoroscopic).
 *
 * Reference: International Reflux Study Committee. Med Radiogr Photogr 1985.
 */

export const vurVcugDefinition = {
  id: 'vur-vcug',
  name: 'VUR (VCUG)',

  grades: [
    { id: 'I', label: 'Grade I', description: 'Reflux into non-dilated ureter only; does not reach kidney' },
    { id: 'II', label: 'Grade II', description: 'Reflux to renal pelvis without dilation; normal calyces' },
    { id: 'III', label: 'Grade III', description: 'Mild ureteral and pelvicalyceal dilation; minimal calyceal blunting' },
    { id: 'IV', label: 'Grade IV', description: 'Moderate dilation; tortuous ureter; calyceal blunting but papillary impressions preserved' },
    { id: 'V', label: 'Grade V', description: 'Severe dilation; very tortuous ureter; loss of papillary impressions' },
  ],

  sideOptions: [
    { id: 'right', label: 'Right' },
    { id: 'left', label: 'Left' },
    { id: 'bilateral', label: 'Bilateral' },
  ],

  // Dictation-realistic parseRules: radiologists write "grade 3 VUR on the
  // right" rather than the literal "Grade III" label. Longest-first match
  // ordering means "grade iii" beats "grade i" when both are substrings.
  parseRules: {
    grade: {
      options: {
        'I':   ['grade i', 'grade 1', 'grade one'],
        'II':  ['grade ii', 'grade 2', 'grade two'],
        'III': ['grade iii', 'grade 3', 'grade three'],
        'IV':  ['grade iv', 'grade 4', 'grade four'],
        'V':   ['grade v', 'grade 5', 'grade five'],
      },
    },
  },
  parseSegmentation: { type: 'laterality' },
};
