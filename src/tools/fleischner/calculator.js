/**
 * Fleischner Society 2017 recommendation logic.
 * Lookup-table based — not point-scored.
 *
 * Reference: MacMahon H et al. Radiology 2017;284(1):228-243.
 * doi: 10.1148/radiol.2017161659
 */

/**
 * Recommendation levels (1 = lowest concern, 5 = highest).
 * Level drives the badge color in the UI.
 */
const RECOMMENDATIONS = {
  'no-follow-up': {
    level: 1,
    label: 'No Routine Follow-up',
    management: 'No routine follow-up recommended.',
  },
  'optional-12mo': {
    level: 2,
    label: 'Optional CT at 12 Months',
    management: 'Optional CT at 12 months.',
  },
  'ct-6-12mo': {
    level: 2,
    label: 'CT at 6-12 Months',
    management: 'CT at 6-12 months to confirm stability.',
  },
  'ct-6-12mo-then-18-24mo': {
    level: 3,
    label: 'CT at 6-12, Then 18-24 Months',
    management: 'CT at 6-12 months, then consider CT at 18-24 months.',
  },
  'ct-6-12mo-18-24mo': {
    level: 3,
    label: 'CT at 6-12, Then 18-24 Months',
    management: 'CT at 6-12 months, then CT at 18-24 months.',
  },
  'ct-3-6mo-then-18-24mo': {
    level: 3,
    label: 'CT at 3-6, Then 18-24 Months',
    management: 'CT at 3-6 months, then consider CT at 18-24 months.',
  },
  'ct-3-6mo-18-24mo': {
    level: 3,
    label: 'CT at 3-6, Then 18-24 Months',
    management: 'CT at 3-6 months, then CT at 18-24 months.',
  },
  'ct-3mo-pet-biopsy': {
    level: 4,
    label: 'CT at 3 Months, PET/CT, or Biopsy',
    management: 'Consider CT at 3 months, PET/CT, or tissue sampling.',
  },
  'ct-3-6mo-suspicious': {
    level: 4,
    label: 'CT at 3-6 Months',
    management: 'CT at 3-6 months. Management based on most suspicious nodule.',
  },
  'gg-ct-6-12mo-then-2yr': {
    level: 2,
    label: 'CT at 6-12 Months, Then q2yr x5yr',
    management: 'CT at 6-12 months to confirm persistence, then CT every 2 years until 5 years.',
  },
  'gg-ct-2-4yr': {
    level: 2,
    label: 'CT at 2 and 4 Years',
    management: 'CT at 2 and 4 years to confirm stability.',
  },
  'gg-ct-3-6mo-suspicious': {
    level: 3,
    label: 'CT at 3-6 Months',
    management: 'CT at 3-6 months. Management based on most suspicious nodule.',
  },
  'ps-ct-3-6mo-annual': {
    level: 3,
    label: 'CT at 3-6 Months, Then Annual x5yr',
    management: 'CT at 3-6 months to confirm persistence. If unchanged, annual CT for 5 years.',
  },
  'ps-ct-3-6mo-then-2-4yr': {
    level: 3,
    label: 'CT at 3-6 Months, Then 2 and 4 Years',
    management: 'CT at 3-6 months. If stable, consider CT at 2 and 4 years.',
  },
  'ps-ct-3-6mo-suspicious': {
    level: 4,
    label: 'CT at 3-6 Months',
    management: 'CT at 3-6 months. Management based on most suspicious nodule.',
  },
};

/**
 * Lookup tables indexed by [sizeGroup][riskOrCount].
 *
 * Solid nodules:
 *   sizeGroup: 0 = <6mm, 1 = 6-8mm, 2 = >8mm
 *   risk: 0 = low, 1 = high
 *
 * Ground glass nodules:
 *   sizeGroup: 0 = <6mm, 1 = >=6mm
 *
 * Part-solid nodules:
 *   sizeGroup: 0 = <6mm, 1 = >=6mm
 */

const SOLID_SINGLE = [
  // <6mm
  ['no-follow-up', 'optional-12mo'],
  // 6-8mm
  ['ct-6-12mo-then-18-24mo', 'ct-6-12mo-18-24mo'],
  // >8mm (same regardless of risk)
  ['ct-3mo-pet-biopsy', 'ct-3mo-pet-biopsy'],
];

const SOLID_MULTIPLE = [
  // <6mm
  ['no-follow-up', 'optional-12mo'],
  // 6-8mm
  ['ct-3-6mo-then-18-24mo', 'ct-3-6mo-18-24mo'],
  // >8mm (same regardless of risk)
  ['ct-3-6mo-suspicious', 'ct-3-6mo-suspicious'],
];

const GG_SINGLE = [
  'no-follow-up',         // <6mm
  'gg-ct-6-12mo-then-2yr', // >=6mm
];

const GG_MULTIPLE = [
  'gg-ct-2-4yr',              // <6mm
  'gg-ct-3-6mo-suspicious',   // >=6mm
];

const PS_SINGLE = [
  'no-follow-up',          // <6mm
  'ps-ct-3-6mo-annual',    // >=6mm
];

const PS_MULTIPLE = [
  'ps-ct-3-6mo-then-2-4yr',  // <6mm
  'ps-ct-3-6mo-suspicious',  // >=6mm
];

/**
 * Run the Fleischner 2017 categorization.
 * @param {Object} formState
 * @returns {Object} Result with recommendation, label, management
 */
export function calculateFleischner(formState) {
  const { noduleType, noduleCount, riskLevel } = formState;
  const sizeMm = formState.size;

  if (!noduleType) {
    return buildResult(null, formState, 'Select nodule type');
  }
  if (!noduleCount) {
    return buildResult(null, formState, 'Select single or multiple');
  }
  if (sizeMm == null) {
    return buildResult(null, formState, 'Enter nodule size');
  }

  let recKey;

  if (noduleType === 'solid') {
    if (!riskLevel) {
      // For >8mm solid, risk doesn't matter
      if (sizeMm > 8) {
        const sizeGroup = 2;
        recKey = noduleCount === 'single'
          ? SOLID_SINGLE[sizeGroup][0]
          : SOLID_MULTIPLE[sizeGroup][0];
      } else {
        return buildResult(null, formState, 'Select risk level');
      }
    } else {
      const sizeGroup = sizeMm < 6 ? 0 : sizeMm <= 8 ? 1 : 2;
      const riskCol = riskLevel === 'high' ? 1 : 0;
      recKey = noduleCount === 'single'
        ? SOLID_SINGLE[sizeGroup][riskCol]
        : SOLID_MULTIPLE[sizeGroup][riskCol];
    }
  } else if (noduleType === 'groundGlass') {
    const sizeGroup = sizeMm < 6 ? 0 : 1;
    recKey = noduleCount === 'single'
      ? GG_SINGLE[sizeGroup]
      : GG_MULTIPLE[sizeGroup];
  } else if (noduleType === 'partSolid') {
    const sizeGroup = sizeMm < 6 ? 0 : 1;
    recKey = noduleCount === 'single'
      ? PS_SINGLE[sizeGroup]
      : PS_MULTIPLE[sizeGroup];
  }

  if (!recKey) {
    return buildResult(null, formState, 'Incomplete inputs');
  }

  const rec = RECOMMENDATIONS[recKey];
  const reason = buildReason(formState, sizeMm);
  return buildResult(recKey, formState, reason);
}

function buildReason(formState, sizeMm) {
  const parts = [];
  if (formState.noduleType === 'solid') parts.push('Solid');
  else if (formState.noduleType === 'groundGlass') parts.push('Ground glass');
  else if (formState.noduleType === 'partSolid') parts.push('Part-solid');

  parts.push(formState.noduleCount === 'single' ? 'single' : 'multiple');
  parts.push(`${sizeMm} mm`);

  if (formState.noduleType === 'solid' && formState.riskLevel) {
    parts.push(formState.riskLevel === 'high' ? 'high risk' : 'low risk');
  }

  return parts.join(', ');
}

function buildResult(recKey, formState, reason) {
  const rec = recKey ? RECOMMENDATIONS[recKey] : null;
  const sizeMm = formState.size;

  const typeLabels = {
    solid: 'Solid',
    groundGlass: 'Ground glass',
    partSolid: 'Part-solid',
  };

  const countLabels = {
    single: 'Single',
    multiple: 'Multiple',
  };

  const riskLabels = {
    low: 'Low risk',
    high: 'High risk',
  };

  return {
    recommendation: recKey || '--',
    recommendationLabel: rec?.label || 'Incomplete',
    recommendationFullLabel: rec ? rec.label : '--',
    recommendationLevel: rec?.level || 0,
    management: rec?.management || '',
    reason,
    noduleTypeLabel: typeLabels[formState.noduleType] || '',
    noduleCountLabel: countLabels[formState.noduleCount] || '',
    riskLevelLabel: riskLabels[formState.riskLevel] || 'Not assessed',
    riskNeeded: formState.noduleType === 'solid' && (sizeMm == null || sizeMm <= 8),
    sizeMm,
    sizeProvided: sizeMm != null,
    sizeCm: sizeMm != null ? (sizeMm / 10).toFixed(1) : null,
    locationProvided: !!formState.location,
    location: formState.location || '',
  };
}
