/**
 * TI-RADS scoring logic.
 * Maps total points to TI-RADS level and provides size-based management recommendations.
 */

const LEVELS = [
  { min: 0, max: 0, level: 1, name: 'TR1', label: 'Benign' },
  { min: 2, max: 2, level: 2, name: 'TR2', label: 'Not Suspicious' },
  { min: 3, max: 3, level: 3, name: 'TR3', label: 'Mildly Suspicious' },
  { min: 4, max: 6, level: 4, name: 'TR4', label: 'Moderately Suspicious' },
  { min: 7, max: Infinity, level: 5, name: 'TR5', label: 'Highly Suspicious' },
];

// Management thresholds: [fnaThreshold, followUpThreshold] in cm
const MANAGEMENT = {
  1: { fna: null, followUp: null, note: 'No FNA or follow-up needed' },
  2: { fna: null, followUp: null, note: 'No FNA or follow-up needed' },
  3: { fna: 2.5, followUp: 1.5, note: 'FNA if >= 2.5 cm, follow-up if >= 1.5 cm' },
  4: { fna: 1.5, followUp: 1.0, note: 'FNA if >= 1.5 cm, follow-up if >= 1.0 cm' },
  5: { fna: 1.0, followUp: 0.5, note: 'FNA if >= 1.0 cm, follow-up if >= 0.5 cm' },
};

/**
 * Get TI-RADS level from total points.
 * @param {number} totalPoints
 * @returns {{ level: number, name: string, label: string }}
 */
export function getTiradsLevel(totalPoints) {
  // Points of 1 map to TR2 (per ACR white paper: 0=TR1, 2=TR2, 3=TR3)
  // However, the ACR table says 2 pts = TR2. 1 pt is not in the standard table
  // but the scoring makes it impossible to get exactly 1 point from valid selections.
  // We handle it by finding the closest match.
  for (const entry of LEVELS) {
    if (totalPoints >= entry.min && totalPoints <= entry.max) {
      return { level: entry.level, name: entry.name, label: entry.label };
    }
  }
  // Edge case: 1 point (shouldn't happen with standard options, but handle gracefully)
  return { level: 2, name: 'TR2', label: 'Not Suspicious' };
}

/**
 * Get management recommendation based on TI-RADS level and nodule size.
 * @param {number} tiradsLevel - 1-5
 * @param {number|null} sizeCm - Maximum dimension in cm
 * @returns {{ recommendation: string, detail: string, fnaRecommended: boolean, followUpRecommended: boolean }}
 */
export function getManagement(tiradsLevel, sizeCm) {
  const mgmt = MANAGEMENT[tiradsLevel];
  if (!mgmt) {
    return {
      recommendation: 'Unknown',
      detail: '',
      fnaRecommended: false,
      followUpRecommended: false,
    };
  }

  // TR1 and TR2: no action needed
  if (mgmt.fna === null) {
    return {
      recommendation: 'No FNA',
      detail: mgmt.note,
      fnaRecommended: false,
      followUpRecommended: false,
    };
  }

  if (sizeCm == null) {
    return {
      recommendation: 'Enter size for recommendation',
      detail: mgmt.note,
      fnaRecommended: false,
      followUpRecommended: false,
    };
  }

  if (sizeCm >= mgmt.fna) {
    return {
      recommendation: 'FNA recommended',
      detail: `FNA recommended for ${LEVELS.find((l) => l.level === tiradsLevel).name} nodules >= ${mgmt.fna} cm. Nodule measures ${sizeCm} cm.`,
      fnaRecommended: true,
      followUpRecommended: false,
    };
  }

  if (sizeCm >= mgmt.followUp) {
    return {
      recommendation: 'Follow-up recommended',
      detail: `Follow-up recommended for ${LEVELS.find((l) => l.level === tiradsLevel).name} nodules >= ${mgmt.followUp} cm. Nodule measures ${sizeCm} cm.`,
      fnaRecommended: false,
      followUpRecommended: true,
    };
  }

  return {
    recommendation: 'No FNA or follow-up needed',
    detail: `${LEVELS.find((l) => l.level === tiradsLevel).name} nodule at ${sizeCm} cm is below size thresholds for FNA (${mgmt.fna} cm) and follow-up (${mgmt.followUp} cm).`,
    fnaRecommended: false,
    followUpRecommended: false,
  };
}

/**
 * Run the full TI-RADS calculation.
 * @param {number} totalScore - Sum from engine.calculateScore()
 * @param {number|null} sizeCm - Nodule size from form
 * @returns {Object} Result object with all fields needed for report templates
 */
export function calculateTirads(totalScore, sizeCm) {
  const level = getTiradsLevel(totalScore);
  const mgmt = getManagement(level.level, sizeCm);

  return {
    totalScore,
    tiradsLevel: level.level,
    tiradsName: level.name,
    tiradsLabel: level.label,
    tiradsFullLabel: `${level.name} - ${level.label}`,
    recommendation: mgmt.recommendation,
    recommendationDetail: mgmt.detail,
    fnaRecommended: mgmt.fnaRecommended,
    followUpRecommended: mgmt.followUpRecommended,
    noduleSize: sizeCm,
    noduleSizeProvided: sizeCm != null,
  };
}
