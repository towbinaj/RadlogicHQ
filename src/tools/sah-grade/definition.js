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

  parseRules: {},
};
