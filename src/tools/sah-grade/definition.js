/**
 * SAH Grading — Hunt-Hess + Modified Fisher scales.
 *
 * References:
 *   Hunt WE, Hess RM. J Neurosurg 1968;28(1):14-20.
 *   Frontera JA et al. Neurosurgery 2006;58(1):21-27.
 */

export const sahDefinition = {
  id: 'sah-grade',
  name: 'SAH Grading',

  huntHessGrades: [
    { id: '1', label: 'Grade 1', description: 'Asymptomatic or mild headache, slight nuchal rigidity', prognosis: 'Good' },
    { id: '2', label: 'Grade 2', description: 'Moderate to severe headache, nuchal rigidity, no focal deficit (cranial nerve palsy OK)', prognosis: 'Good' },
    { id: '3', label: 'Grade 3', description: 'Drowsiness, confusion, or mild focal deficit', prognosis: 'Fair' },
    { id: '4', label: 'Grade 4', description: 'Stupor, moderate to severe hemiparesis', prognosis: 'Poor' },
    { id: '5', label: 'Grade 5', description: 'Deep coma, decerebrate rigidity, moribund', prognosis: 'Very poor' },
  ],

  modifiedFisherGrades: [
    { id: '0', label: 'Grade 0', description: 'No SAH or IVH', vasospasm: 'Baseline' },
    { id: '1', label: 'Grade 1', description: 'Thin SAH, no IVH', vasospasm: 'Low' },
    { id: '2', label: 'Grade 2', description: 'Thin SAH with IVH', vasospasm: 'Moderate' },
    { id: '3', label: 'Grade 3', description: 'Thick SAH, no IVH', vasospasm: 'Moderate' },
    { id: '4', label: 'Grade 4', description: 'Thick SAH with IVH', vasospasm: 'High' },
  ],

  parseRules: {
    huntHess: {
      options: {
        '1': ['hunt-hess 1', 'hunt hess 1', 'hunt-hess grade 1', 'hh grade 1', 'hh 1'],
        '2': ['hunt-hess 2', 'hunt hess 2', 'hunt-hess grade 2', 'hh grade 2', 'hh 2'],
        '3': ['hunt-hess 3', 'hunt hess 3', 'hunt-hess grade 3', 'hh grade 3', 'hh 3'],
        '4': ['hunt-hess 4', 'hunt hess 4', 'hunt-hess grade 4', 'hh grade 4', 'hh 4'],
        '5': ['hunt-hess 5', 'hunt hess 5', 'hunt-hess grade 5', 'hh grade 5', 'hh 5'],
      },
    },
    modifiedFisher: {
      options: {
        '0': ['modified fisher 0', 'fisher 0', 'fisher grade 0', 'no sah or ivh', 'no sah'],
        '1': ['modified fisher 1', 'fisher 1', 'fisher grade 1', 'thin sah, no ivh', 'thin sah without ivh'],
        '2': ['modified fisher 2', 'fisher 2', 'fisher grade 2', 'thin sah with ivh'],
        '3': ['modified fisher 3', 'fisher 3', 'fisher grade 3', 'thick sah, no ivh', 'thick sah without ivh'],
        '4': ['modified fisher 4', 'fisher 4', 'fisher grade 4', 'thick sah with ivh'],
      },
    },
  },
};
