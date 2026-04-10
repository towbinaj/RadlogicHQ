/**
 * NASCET carotid stenosis calculator — definition.
 *
 * Reference: NASCET Collaborators. N Engl J Med 1991;325(7):445-453.
 *
 * Formula: (1 - Dstenosis / Ddistal) × 100
 */

export const nascetDefinition = {
  id: 'nascet',
  name: 'NASCET',

  sideOptions: [
    { id: 'right', label: 'Right' },
    { id: 'left', label: 'Left' },
  ],

  parseRules: {},
};
