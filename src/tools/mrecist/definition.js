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

  parseRules: {},
};
