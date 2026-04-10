/**
 * Pectus Excavatum Measurements — definition.
 *
 * Five indices:
 *   PI (Pectus/Haller Index): width / depth. Abnormal >3.25.
 *   CI (Correction Index): (depthA - depthB) / depthA * 100%. Abnormal >10%.
 *   DI (Depression Index): depression depth / vertebral body width. Abnormal >0.2.
 *   mCCI (Modified Cardiac Compression Index): H / M. Dictate as fraction.
 *   STA (Sternal Torsion Angle): Cobb angle of sternum. Dictate with direction.
 */

export const pectusDefinition = {
  id: 'pectus',
  name: 'Pectus Excavatum',

  staTiltOptions: [
    { id: 'right', label: 'Right side down' },
    { id: 'left', label: 'Left side down' },
    { id: 'none', label: 'No tilt' },
  ],

  parseRules: {},
};
