/**
 * Bone Age — Sontag method.
 *
 * Reference: Sontag LW, Snell D, Anderson M. Rate of appearance of ossification centers
 * from birth to the age of five years. Am J Dis Child 1939.
 */

export const boneAgeSontagDefinition = {
  id: 'bone-age-sontag',
  name: 'Bone Age (Sontag)',

  sexOptions: [
    { id: 'male', label: 'Male' },
    { id: 'female', label: 'Female' },
  ],

  parseRules: {},
};
