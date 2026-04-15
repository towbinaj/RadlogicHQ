/**
 * Fetal Lateral Ventricle Width — definition.
 *
 * Measured at the atrium in the axial plane.
 * Threshold is GA-independent (stable throughout 2nd/3rd trimester).
 *
 * Reference: International Society of Ultrasound in Obstetrics and Gynecology.
 */

export const fetalVentricleDefinition = {
  id: 'fetal-ventricle',
  name: 'Fetal Ventricle Width',

  categories: [
    { id: 'normal', label: 'Normal', range: '<10 mm', description: 'Normal lateral ventricle width' },
    { id: 'mild', label: 'Mild ventriculomegaly', range: '10–12 mm', description: 'Mild dilation; majority resolve or remain stable' },
    { id: 'moderate', label: 'Moderate ventriculomegaly', range: '12–15 mm', description: 'Moderate dilation; further evaluation recommended' },
    { id: 'severe', label: 'Severe ventriculomegaly', range: '\u226515 mm', description: 'Severe dilation; associated with adverse outcomes' },
  ],

  sideOptions: [
    { id: 'right', label: 'Right' },
    { id: 'left', label: 'Left' },
    { id: 'bilateral', label: 'Bilateral' },
  ],

  // Bilateral pastes like "Right lateral ventricle: 11 mm. Left
  // lateral ventricle: 10 mm." split into per-side segments so each
  // carries its own atrial-width measurement. Ventriculomegaly is
  // commonly bilateral in obstetric scans.
  parseSegmentation: { type: 'laterality' },

  parseRules: {
    // Atrial width: any "<N> mm" measurement in a segment. Per-segment
    // parsing means right/left widths are naturally separated by the
    // laterality segmenter; if multiple mm values appear in one
    // segment, the first match wins.
    width: {
      pattern: /(\d*\.?\d+)\s*mm/,
      group: 1,
      transform: (m) => parseFloat(m[1]),
    },
    // Gestational age: "GA 22 weeks", "22 weeks", "22w", "22 wks".
    ga: {
      pattern: /(?:\bga\b[\s:]*|\bat\s+)?(\d{2})\s*(?:weeks?|wks?|w\b)/i,
      group: 1,
      transform: (m) => parseInt(m[1], 10),
    },
  },
};
