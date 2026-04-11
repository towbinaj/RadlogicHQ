/**
 * Germinal Matrix Hemorrhage (Papile) Grading — definition.
 *
 * Reference: Papile LA et al. J Pediatr 1978;92(4):529-534.
 */

export const gmhDefinition = {
  id: 'gmh',
  name: 'GMH Grading',

  grades: [
    { id: 'I', label: 'Grade I', description: 'Germinal matrix hemorrhage only (subependymal)', prognosis: 'Good' },
    { id: 'II', label: 'Grade II', description: 'IVH without ventricular dilation', prognosis: 'Good' },
    { id: 'III', label: 'Grade III', description: 'IVH with ventricular dilation', prognosis: 'Variable — risk of hydrocephalus' },
    { id: 'IV', label: 'Grade IV', description: 'Periventricular hemorrhagic infarction (parenchymal involvement)', prognosis: 'Poor — high neurodevelopmental risk' },
  ],

  sideOptions: [
    { id: 'right', label: 'Right' },
    { id: 'left', label: 'Left' },
    { id: 'bilateral', label: 'Bilateral' },
  ],

  parseRules: {
    grade: {
      options: {
        IV: ['grade iv', 'grade 4', 'gmh iv', 'gmh 4', 'papile iv', 'papile 4', 'periventricular hemorrhagic infarction', 'parenchymal involvement'],
        III: ['grade iii', 'grade 3', 'gmh iii', 'gmh 3', 'papile iii', 'papile 3', 'ivh with ventricular dilation', 'ivh with ventriculomegaly'],
        II: ['grade ii', 'grade 2', 'gmh ii', 'gmh 2', 'papile ii', 'papile 2', 'ivh without ventricular dilation', 'ivh without ventriculomegaly'],
        I: ['grade i', 'grade 1', 'gmh i', 'gmh 1', 'papile i', 'papile 1', 'germinal matrix hemorrhage only', 'subependymal hemorrhage'],
      },
    },
    side: {
      options: {
        right: ['right'],
        left: ['left'],
        bilateral: ['bilateral', 'both'],
      },
    },
  },
};
