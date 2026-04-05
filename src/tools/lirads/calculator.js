/**
 * LI-RADS v2018 CT/MRI categorization logic.
 * Decision-tree algorithm — not point-based.
 */

const CATEGORY_INFO = {
  'LR-1':   { level: 1, label: 'Definitely Benign',        management: 'Continue routine surveillance as needed.' },
  'LR-2':   { level: 2, label: 'Probably Benign',           management: 'Continue routine surveillance as needed.' },
  'LR-3':   { level: 3, label: 'Intermediate Probability for HCC', management: '' },
  'LR-4':   { level: 4, label: 'Probably HCC',              management: 'Consider biopsy or additional imaging.' },
  'LR-5':   { level: 5, label: 'Definitely HCC',            management: '' },
  'LR-M':   { level: 6, label: 'Probably or Definitely Malignant, Not HCC Specific', management: 'Biopsy recommended to determine malignancy type.' },
  'LR-TIV': { level: 7, label: 'Tumor in Vein',             management: 'Indicates advanced disease with vascular invasion.' },
};

// Categorization tables: [sizeGroup][featureCount]
// sizeGroup: 0 = <10mm, 1 = 10-19mm, 2 = ≥20mm
// featureCount: 0, 1, or ≥2 additional features (washout, capsule, threshold growth)
const TABLE_WITH_APHE = [
  ['LR-3', 'LR-4', 'LR-4'],  // <10mm
  ['LR-3', 'LR-4', 'LR-5'],  // 10-19mm
  ['LR-4', 'LR-5', 'LR-5'],  // ≥20mm
];

const TABLE_NO_APHE = [
  ['LR-2', 'LR-3', 'LR-3'],  // <10mm (note: <10mm with no APHE and 0 features = LR-2)
  ['LR-3', 'LR-3', 'LR-4'],  // 10-19mm
  ['LR-3', 'LR-4', 'LR-4'],  // ≥20mm
];

// Category ordering for ancillary adjustment
const CATEGORY_ORDER = ['LR-1', 'LR-2', 'LR-3', 'LR-4', 'LR-5'];

/**
 * Run the full LI-RADS categorization.
 * @param {Object} formState
 * @returns {Object} Result with category, label, management, features summary
 */
export function calculateLirads(formState) {
  // --- Early exits ---
  if (formState.definitelyBenign === 'yes') {
    return buildResult('LR-1', formState, 'Definitely benign observation');
  }
  if (formState.probablyBenign === 'yes') {
    return buildResult('LR-2', formState, 'Probably benign observation');
  }
  if (formState.tumorInVein === 'yes') {
    return buildResult('LR-TIV', formState, 'Tumor in vein');
  }
  if (formState.lrmFeatures === 'yes') {
    return buildResult('LR-M', formState, 'Non-HCC malignancy features');
  }

  // --- Major features categorization ---
  const sizeMm = formState.size;
  if (sizeMm == null) {
    return buildResult(null, formState, 'Enter observation size to categorize');
  }

  const hasAPHE = formState.aphe === 'yes';
  const hasWashout = formState.washout === 'yes';
  const hasCapsule = formState.capsule === 'yes';
  const hasGrowth = formState.thresholdGrowth === 'yes';

  // Count additional major features (washout + capsule + threshold growth)
  const additionalCount = [hasWashout, hasCapsule, hasGrowth].filter(Boolean).length;

  // Size group
  const sizeGroup = sizeMm < 10 ? 0 : sizeMm < 20 ? 1 : 2;

  // Lookup
  const table = hasAPHE ? TABLE_WITH_APHE : TABLE_NO_APHE;
  const featureCol = Math.min(additionalCount, 2);
  let category = table[sizeGroup][featureCol];

  // --- Ancillary feature adjustment ---
  const upgradeCount = countAncillary(formState, 'favoringHCC');
  const downgradeCount = countAncillary(formState, 'favoringBenign');

  let adjustment = 0;
  let adjustmentNote = '';

  if (upgradeCount > 0 && downgradeCount === 0) {
    adjustment = 1;
    adjustmentNote = `Upgraded by ancillary features favoring HCC`;
  } else if (downgradeCount > 0 && upgradeCount === 0) {
    adjustment = -1;
    adjustmentNote = `Downgraded by ancillary features favoring benign`;
  }

  if (adjustment !== 0) {
    const idx = CATEGORY_ORDER.indexOf(category);
    if (idx !== -1) {
      const newIdx = Math.max(0, Math.min(CATEGORY_ORDER.length - 1, idx + adjustment));
      const newCategory = CATEGORY_ORDER[newIdx];

      // Cannot upgrade to LR-5 via ancillary features
      if (adjustment > 0 && newCategory === 'LR-5') {
        adjustmentNote = 'Ancillary features favor HCC but cannot upgrade to LR-5';
      } else {
        category = newCategory;
      }
    }
  }

  // Build feature summary
  const features = [];
  if (hasAPHE) features.push('APHE');
  if (hasWashout) features.push('Washout');
  if (hasCapsule) features.push('Capsule');
  if (hasGrowth) features.push('Threshold growth');
  const featureSummary = features.length > 0 ? features.join(', ') : 'None';

  const reason = `${sizeMm} mm, ${hasAPHE ? 'APHE+' : 'APHE-'}, ${additionalCount} additional feature${additionalCount !== 1 ? 's' : ''}`;

  return buildResult(category, formState, reason, {
    featureSummary,
    additionalCount,
    adjustmentNote,
    sizeMm,
  });
}

function buildResult(category, formState, reason, extra = {}) {
  const info = category ? CATEGORY_INFO[category] : null;
  const sizeMm = extra.sizeMm ?? formState.size;

  return {
    category: category || '--',
    categoryLabel: info?.label || 'Incomplete',
    categoryFullLabel: category ? `${category} - ${info.label}` : '--',
    categoryLevel: info?.level || 0,
    management: info?.management || '',
    reason,
    featureSummary: extra.featureSummary || '',
    additionalCount: extra.additionalCount ?? 0,
    adjustmentNote: extra.adjustmentNote || '',
    sizeMm,
    sizeProvided: sizeMm != null,
    sizeCm: sizeMm != null ? (sizeMm / 10).toFixed(1) : null,
    locationProvided: !!formState.location,
    location: formState.location || '',
  };
}

function countAncillary(formState, group) {
  let count = 0;
  // Ancillary feature keys are stored as formState[featureId] = true/false
  const prefix = group === 'favoringHCC' ? 'anc_hcc_' : 'anc_benign_';
  for (const [key, val] of Object.entries(formState)) {
    if (key.startsWith(prefix) && val) count++;
  }
  return count;
}
