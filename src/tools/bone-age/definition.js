/**
 * Bone Age — Greulich & Pyle + Sontag methods.
 *
 * References:
 *   Greulich WW, Pyle SI. Radiographic Atlas of Skeletal Development of the Hand and Wrist. 2nd ed. 1959.
 *   Sontag LW, Snell D, Anderson M. Rate of appearance of ossification centers. Am J Dis Child 1939.
 */

export const boneAgeDefinition = {
  id: 'bone-age',
  name: 'Bone Age',

  sexOptions: [
    { id: 'male', label: 'Male' },
    { id: 'female', label: 'Female' },
  ],

  parseRules: {},
};
