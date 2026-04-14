/**
 * Bone Age — Greulich & Pyle method.
 *
 * Reference: Greulich WW, Pyle SI. Radiographic Atlas of Skeletal Development
 * of the Hand and Wrist. 2nd ed. Stanford University Press, 1959.
 */

export const boneAgeGpDefinition = {
  id: 'bone-age-gp',
  name: 'Bone Age (Greulich-Pyle)',

  sexOptions: [
    { id: 'male', label: 'Male' },
    { id: 'female', label: 'Female' },
  ],

  parseRules: {},
};
