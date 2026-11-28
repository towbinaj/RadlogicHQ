/**
 * Lung-RADS v2022 classification logic.
 *
 * Reference: ACR Lung-RADS v2022.
 *
 * Categories:
 *   0 — Incomplete
 *   1 — Negative (no nodules, or definitely benign)
 *   2 — Benign appearance or behavior
 *   3 — Probably benign
 *   4A — Suspicious
 *   4B — Very suspicious
 *   4X — Category 3 or 4 with additional suspicious features
 *   S — Other clinically significant finding
 *
 * Solid nodules (baseline, no prior):
 *   <6mm → 2
 *   6-<8mm → 3
 *   8-<15mm → 4A
 *   ≥15mm → 4B
 *
 * Part-solid nodules (by solid component):
 *   Total <6mm → 2
 *   Total ≥6mm, solid <6mm → 3
 *   Total ≥6mm, solid 6-<8mm → 4A
 *   Total ≥6mm, solid ≥8mm → 4B
 *
 * Ground glass nodules:
 *   <30mm → 2
 *   ≥30mm → 3
 *
 * New / growing: v2022 table (solid new 4-<6 = 3, 6-<8 = 4A, >=8 = 4B;
 *   solid growing <8 = 4A, >=8 = 4B; part-solid new/growing <6 total = 3,
 *   solid component <4 = 4A, >=4 = 4B; GGN <30 stays 2)
 * Additional suspicious features → append X
 */

const CATEGORY_INFO = {
  '1':  { level: 1, label: 'Negative',            management: 'Continue annual screening with LDCT in 12 months.' },
  '2':  { level: 2, label: 'Benign Appearance',   management: 'Continue annual screening with LDCT in 12 months.' },
  '3':  { level: 3, label: 'Probably Benign',     management: 'LDCT in 6 months.' },
  '4A': { level: 4, label: 'Suspicious',          management: 'LDCT in 3 months; PET/CT may be used.' },
  '4B': { level: 5, label: 'Very Suspicious',     management: 'Chest CT with or without contrast, PET/CT, and/or tissue sampling.' },
  '4X': { level: 5, label: 'Suspicious with Additional Features', management: 'Chest CT with or without contrast, PET/CT, and/or tissue sampling.' },
};

/**
 * @param {Object} formState
 * @returns {Object}
 */
export function calculateLungrads(formState) {
  const { noduleType, priorComparison, suspicious } = formState;
  const sizeMm = formState.size;
  const solidSizeMm = formState.solidSize;

  if (!noduleType) return buildResult(null, formState, 'Select nodule type');
  if (sizeMm == null) return buildResult(null, formState, 'Enter nodule size');

  let category;

  if (noduleType === 'solid') {
    if (sizeMm < 6) category = '2';
    else if (sizeMm < 8) category = '3';
    else if (sizeMm < 15) category = '4A';
    else category = '4B';
  } else if (noduleType === 'groundGlass') {
    if (sizeMm < 30) category = '2';
    else category = '3';
  } else if (noduleType === 'partSolid') {
    if (sizeMm < 6) {
      category = '2';
    } else {
      // A part-solid nodule >=6 mm cannot be categorized without its solid
      // component size (do not silently treat a missing value as 0 mm).
      if (solidSizeMm == null) return buildResult(null, formState, 'Enter solid component size');
      const ss = solidSizeMm;
      if (ss < 6) category = '3';
      else if (ss < 8) category = '4A';
      else category = '4B';
    }
  }

  // New / growing nodules: ACR Lung-RADS v2022 table (growth = >1.5 mm
  // increase in mean diameter within 12 months). These replace the
  // baseline category rather than stepping it up.
  const newOrGrowing = priorComparison === 'new' || priorComparison === 'growing';
  if (noduleType === 'solid' && newOrGrowing) {
    if (priorComparison === 'new') {
      if (sizeMm < 4) category = '2';
      else if (sizeMm < 6) category = '3';
      else if (sizeMm < 8) category = '4A';
      else category = '4B';
    } else {
      category = sizeMm < 8 ? '4A' : '4B';
    }
  } else if (noduleType === 'partSolid' && newOrGrowing) {
    if (sizeMm < 6) category = '3';
    else if (solidSizeMm < 4) category = '4A';
    else category = '4B';
  } else if (noduleType === 'groundGlass' && newOrGrowing) {
    // GGN: <30 mm is category 2 even if new or growing; >=30 mm new is 3.
    category = sizeMm < 30 ? '2' : '3';
  }

  // Suspicious features → append X
  if (suspicious === 'present' && (category === '3' || category === '4A' || category === '4B')) {
    category = '4X';
  }

  const reason = buildReason(formState, sizeMm, solidSizeMm);
  return buildResult(category, formState, reason);
}

function buildReason(formState, sizeMm, solidSizeMm) {
  const parts = [];
  if (formState.noduleType === 'solid') parts.push('Solid');
  else if (formState.noduleType === 'groundGlass') parts.push('Ground glass');
  else if (formState.noduleType === 'partSolid') parts.push('Part-solid');

  parts.push(`${sizeMm} mm`);

  if (formState.noduleType === 'partSolid' && solidSizeMm != null) {
    parts.push(`solid component ${solidSizeMm} mm`);
  }

  if (formState.priorComparison && formState.priorComparison !== 'none') {
    parts.push(formState.priorComparison);
  }

  return parts.join(', ');
}

function buildResult(category, formState, reason) {
  const info = category ? CATEGORY_INFO[category] : null;
  const sizeMm = formState.size;

  const typeLabels = { solid: 'Solid', groundGlass: 'Ground glass', partSolid: 'Part-solid' };
  const priorLabels = { none: 'No prior', new: 'New nodule', stable: 'Stable', growing: 'Growing', slowGrowing: 'Slowly growing' };

  return {
    category: category || '--',
    categoryLabel: info?.label || 'Incomplete',
    categoryFullLabel: category ? `Lung-RADS ${category} - ${info.label}` : '--',
    categoryLevel: info?.level || 0,
    management: info?.management || '',
    reason,
    noduleTypeLabel: typeLabels[formState.noduleType] || '',
    priorComparisonLabel: priorLabels[formState.priorComparison] || 'Not assessed',
    solidSize: formState.solidSize ?? null,
    solidSizeProvided: formState.solidSize != null,
    suspiciousLabel: formState.suspicious === 'present' ? 'Present' : formState.suspicious === 'none' ? 'None' : 'Not assessed',
    suspiciousProvided: !!formState.suspicious,
    priorProvided: !!formState.priorComparison,
    sizeMm,
    sizeProvided: sizeMm != null,
    sizeCm: sizeMm != null ? (sizeMm / 10).toFixed(1) : null,
    locationProvided: !!formState.location,
    location: formState.location || '',
  };
}
