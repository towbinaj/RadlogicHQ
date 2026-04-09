/**
 * RECIST 1.1 — Response Evaluation Criteria in Solid Tumors.
 * Longitudinal comparison: baseline vs current measurements.
 *
 * Reference: Eisenhauer EA et al. Eur J Cancer 2009;45(2):228-247.
 */
export const recistDefinition = {
  id: 'recist',
  name: 'RECIST 1.1',
  version: '1.0.0',
  description:
    'RECIST 1.1 — response evaluation criteria in solid tumors for oncologic treatment response assessment.',
  cdeSetId: null,

  nonTargetOptions: [
    { id: 'absent', label: 'Absent (CR)', tooltip: 'All non-target lesions have disappeared' },
    { id: 'present', label: 'Present (non-CR/non-PD)', tooltip: 'Persistence of one or more non-target lesions' },
    { id: 'progression', label: 'Unequivocal Progression', tooltip: 'Unequivocal progression of existing non-target lesions' },
  ],

  newLesionOptions: [
    { id: 'no', label: 'No' },
    { id: 'yes', label: 'Yes', tooltip: 'Any new lesion = progressive disease' },
  ],

  parseRules: {},
};
