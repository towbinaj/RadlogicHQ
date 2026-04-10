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

  parseRules: {},
};
