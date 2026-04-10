/**
 * Fetal Brain Biometry (MRI) — definition.
 *
 * Reference values from Tilea 2009 (Ultrasound Obstet Gynecol 34:173-181)
 * and Garel 2001. BPD and cerebellar diameter means by GA week.
 *
 * Cisterna magna: normal 2-10 mm AP, GA-independent.
 */

// BPD mean (mm) by GA week — approximate from published MRI normative data
export const BPD_MEANS = {
  20: 48, 21: 51, 22: 54, 23: 57, 24: 60, 25: 63, 26: 66, 27: 69,
  28: 72, 29: 74, 30: 77, 31: 79, 32: 81, 33: 83, 34: 85, 35: 87,
  36: 89, 37: 90, 38: 91, 39: 92, 40: 93,
};

// Cerebellar transverse diameter mean (mm) by GA week
export const CEREBELLUM_MEANS = {
  20: 21, 21: 23, 22: 24, 23: 26, 24: 28, 25: 30, 26: 32, 27: 33,
  28: 35, 29: 37, 30: 38, 31: 40, 32: 41, 33: 43, 34: 44, 35: 46,
  36: 47, 37: 48, 38: 49, 39: 50, 40: 51,
};

export const fetalBiometryDefinition = {
  id: 'fetal-biometry',
  name: 'Fetal Brain Biometry',

  measurements: [
    { id: 'bpd', label: 'Biparietal Diameter (BPD)', unit: 'mm' },
    { id: 'cerebellum', label: 'Cerebellar Transverse Diameter', unit: 'mm' },
    { id: 'cisternaMagna', label: 'Cisterna Magna AP', unit: 'mm' },
  ],

  parseRules: {},
};
