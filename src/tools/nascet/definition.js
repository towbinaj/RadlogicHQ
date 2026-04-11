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

  parseRules: {
    stenosisDiam: {
      pattern: /stenosis[:\s]*(\d*\.?\d+)\s*mm/i,
      group: 1,
      transform: (m) => parseFloat(m[1]),
    },
    distalDiam: {
      pattern: /distal[:\s]*(\d*\.?\d+)\s*mm/i,
      group: 1,
      transform: (m) => parseFloat(m[1]),
    },
    side: {
      options: {
        right: ['right ica', 'right carotid', 'right internal carotid'],
        left: ['left ica', 'left carotid', 'left internal carotid'],
      },
    },
  },
};
