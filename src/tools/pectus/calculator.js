/**
 * Pectus excavatum calculator — computes all 5 indices.
 */

function r2(v) { return Math.round(v * 100) / 100; }

export function calculatePectus(formState) {
  const { piWidth, piDepth, ciDepthA, ciDepthB, diDepth, diVertWidth, mcciH, mcciM, staAngle, staTilt } = formState;

  // Pectus Index (Haller Index): width / depth
  const hasPi = piWidth > 0 && piDepth > 0;
  const pi = hasPi ? r2(piWidth / piDepth) : null;
  // Haller index bands: normal <2.5, mild to moderate 2.5-3.25, severe >3.25.
  const piBand = pi == null ? '' : pi < 2.5 ? 'normal' : pi <= 3.25 ? 'mild-moderate' : 'severe';
  const piAbnormal = piBand === 'mild-moderate' || piBand === 'severe';
  const piBandLabels = { normal: 'Normal (<2.5)', 'mild-moderate': 'Mild to moderate (2.5-3.25)', severe: 'Severe (>3.25)' };

  // Correction Index: (depthA - depthB) / depthA * 100%
  const hasCi = ciDepthA > 0 && ciDepthB != null && ciDepthB >= 0;
  const ci = hasCi ? r2(((ciDepthA - ciDepthB) / ciDepthA) * 100) : null;
  const ciAbnormal = ci != null && ci > 10;

  // Depression Index: depression depth / vertebral body width
  const hasDi = diDepth != null && diDepth >= 0 && diVertWidth > 0;
  const di = hasDi ? r2(diDepth / diVertWidth) : null;
  const diAbnormal = di != null && di > 0.2;

  // Modified Cardiac Compression Index: H / M
  const hasMcci = mcciH > 0 && mcciM > 0;
  const mcci = hasMcci ? r2(mcciH / mcciM) : null;

  // Sternal Torsion Angle
  const hasSta = staAngle != null;
  const tiltLabels = { right: 'right side down tilt', left: 'left side down tilt', none: 'no tilt' };
  const staText = hasSta ? `${staTilt === 'right' ? '-' : ''}${staAngle}\u00b0 ${tiltLabels[staTilt] || ''}`.trim() : '';

  return {
    pi, piLabel: pi != null ? pi.toFixed(2) : '--', piProvided: hasPi,
    piAbnormal, piBand, piInterpretation: hasPi ? piBandLabels[piBand] : '',
    ci, ciLabel: ci != null ? `${ci.toFixed(1)}%` : '--', ciProvided: hasCi,
    ciAbnormal, ciInterpretation: hasCi ? (ciAbnormal ? 'Abnormal (>10%)' : 'Normal (<=10%)') : '',
    di, diLabel: di != null ? di.toFixed(2) : '--', diProvided: hasDi,
    diAbnormal, diInterpretation: hasDi ? (diAbnormal ? 'Abnormal (>0.2)' : 'Normal (<=0.2)') : '',
    mcci, mcciLabel: mcci != null ? mcci.toFixed(2) : '--', mcciProvided: hasMcci,
    staText, staProvided: hasSta,
    level: (piAbnormal || ciAbnormal || diAbnormal) ? 3 : (hasPi || hasCi || hasDi) ? 1 : 0,
  };
}
