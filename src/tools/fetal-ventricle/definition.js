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
    // Atrial width. Per-segment parsing separates right/left widths. A
    // value labelled atrium/ventricle/width wins; otherwise the first mm
    // value not labelled as another biometry (BPD, HC, TCD, cisterna magna).
    width: {
      pattern: /(\d*\.?\d+)\s*mm/,
      group: 1,
      transform: (m) => {
        const text = m.input;
        const labelled = text.match(/(?:atri\w*|ventric\w*|width)\D{0,30}?(\d*\.?\d+)\s*mm/);
        if (labelled) return parseFloat(labelled[1]);
        for (const hit of text.matchAll(/(\d*\.?\d+)\s*mm/g)) {
          const before = text.slice(Math.max(0, hit.index - 20), hit.index);
          if (!/\b(?:bpd|hc|ac|fl|tcd|biparietal|head|cerebell\w*|cisterna|magna)\b/.test(before)) return parseFloat(hit[1]);
        }
        return null;
      },
    },
    // Gestational age: "GA 22 weeks", "22 weeks", "22w", "22 wks".
    ga: {
      pattern: /(?:\bga\b[\s:]*|\bat\s+)?(\d{2})\s*(?:weeks?|wks?|w\b)/i,
      group: 1,
      transform: (m) => parseInt(m[1], 10),
    },
  },
};
