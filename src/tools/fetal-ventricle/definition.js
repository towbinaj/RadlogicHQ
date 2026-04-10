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

  parseRules: {},
};
