/**
 * NASCET carotid stenosis calculator — definition.
 *
 * Reference: NASCET Collaborators. N Engl J Med 1991;325(7):445-453.
 *
 * Formula: (1 - Dstenosis / Ddistal) x 100 - for CTA, MRA and catheter
 * angiography. Duplex ultrasound uses the SRU consensus velocity criteria
 * instead (Grant EG et al. Radiology 2003;229:340-346); see calculator.js.
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
    // Duplex US values (SRU criteria) and modality.
    psv: {
      pattern: /(?:\bpsv\b|peak systolic velocity)[^.\d]{0,25}(\d+(?:\.\d+)?)/i,
      group: 1,
      transform: (m) => parseFloat(m[1]),
    },
    edv: {
      pattern: /(?:\bedv\b|end[- ]diastolic velocity)[^.\d]{0,25}(\d+(?:\.\d+)?)/i,
      group: 1,
      transform: (m) => parseFloat(m[1]),
    },
    ratio: {
      pattern: /(?:ica\/cca|psv ratio|velocity ratio)[^.\d]{0,25}(\d+(?:\.\d+)?)/i,
      group: 1,
      transform: (m) => parseFloat(m[1]),
    },
    modality: {
      options: {
        us: ['duplex', 'doppler', 'carotid ultrasound', 'ultrasound', 'peak systolic velocity'],
        angio: ['cta', 'mra', 'ct angiogra', 'mr angiogra', 'angiogram', 'angiography', 'dsa'],
      },
    },
    side: {
      options: {
        right: ['right ica', 'right carotid', 'right internal carotid'],
        left: ['left ica', 'left carotid', 'left internal carotid'],
      },
    },
  },
};
