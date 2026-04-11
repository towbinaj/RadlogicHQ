/**
 * mRECIST (Modified RECIST) for HCC — definition.
 *
 * Reference: Lencioni R, Llovet JM. Semin Liver Dis 2010;30(1):52-60.
 *
 * Measures longest diameter of enhancing (viable) tumor only.
 * CR = disappearance of arterial enhancement in all targets.
 * PR = ≥30% decrease in sum of enhancing diameters.
 * PD = ≥20% increase in sum of enhancing diameters.
 * SD = neither PR nor PD.
 */

export const mrecistDefinition = {
  id: 'mrecist',
  name: 'mRECIST',

  nonTargetOptions: [
    { id: 'absent', label: 'Absent (CR)' },
    { id: 'present', label: 'Present (non-CR/non-PD)' },
    { id: 'progression', label: 'Unequivocal progression' },
  ],

  newLesionOptions: [
    { id: 'no', label: 'No' },
    { id: 'yes', label: 'Yes' },
  ],

  parseRules: {
    nonTarget: {
      options: {
        'absent': ['non-target absent', 'nontarget absent', 'non-target cr', 'no viable tumor', 'no arterial enhancement'],
        'present': ['non-target present', 'nontarget present', 'residual enhancement', 'viable tumor'],
        'progression': ['non-target progression', 'nontarget progression', 'unequivocal progression', 'new enhancing lesion'],
      },
    },
    newLesion: {
      options: {
        'no': ['no new lesion', 'no new lesions', 'no new enhancing lesion'],
        'yes': ['new lesion', 'new lesions', 'new enhancing lesion', 'new hcc'],
      },
    },
  },
};
