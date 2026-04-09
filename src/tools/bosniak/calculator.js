/**
 * Bosniak Classification v2019 categorization logic.
 * Feature-based classification — not point-scored.
 *
 * Reference: Silverman SG et al. Radiology 2019;292(2):475-488.
 * doi: 10.1148/radiol.2019182646
 *
 * Classification hierarchy (highest class wins):
 *   IV  — Enhancing soft tissue component
 *   III — Thickened/irregular wall or septa with measurable enhancement
 *   IIF — Minimally thickened smooth wall/septa, OR ≥3 thin smooth septa
 *   II  — 1-2 thin smooth septa (may enhance), OR perceived enhancement, OR any calcification
 *   I   — Simple cyst: thin smooth wall, no septa, no enhancement
 */

const CATEGORY_INFO = {
  'I':   { level: 1, label: 'Benign',                    management: 'No further workup. Simple cyst.' },
  'II':  { level: 2, label: 'Benign',                    management: 'No further workup. Minimally complex cyst.' },
  'IIF': { level: 3, label: 'Likely Benign — Follow-up', management: 'Follow-up imaging recommended (initially at 6 months, then annually for 5 years).' },
  'III': { level: 4, label: 'Indeterminate',             management: 'Surgical excision or active surveillance. Approximately 50% are malignant.' },
  'IV':  { level: 5, label: 'Likely Malignant',          management: 'Surgical management recommended. Majority are malignant.' },
};

/**
 * Run the Bosniak v2019 classification.
 * @param {Object} formState
 * @returns {Object} Result with category, label, management
 */
export function calculateBosniak(formState) {
  const { septa, wall, enhancement, softTissue } = formState;

  // Need at minimum wall or soft tissue assessment
  if (!wall && !softTissue) {
    return buildResult(null, formState, 'Select wall characteristics');
  }

  // --- IV: Enhancing soft tissue component ---
  if (softTissue === 'present') {
    return buildResult('IV', formState, 'Enhancing soft tissue component');
  }

  // --- III: Thickened/irregular wall or septa with measurable enhancement ---
  if (wall === 'thickIrregular' || septa === 'thickIrregular') {
    const features = [];
    if (wall === 'thickIrregular') features.push('thickened/irregular wall');
    if (septa === 'thickIrregular') features.push('thickened/irregular septa');
    return buildResult('III', formState, features.join(', '));
  }

  // --- IIF: Minimally thickened smooth wall or septa, OR ≥3 thin smooth septa ---
  if (wall === 'minThickSmooth' || septa === 'minThickSmooth' || septa === 'thinSmoothMany') {
    const features = [];
    if (wall === 'minThickSmooth') features.push('minimally thickened smooth wall');
    if (septa === 'minThickSmooth') features.push('minimally thickened smooth septa');
    if (septa === 'thinSmoothMany') features.push('≥3 thin smooth septa');
    return buildResult('IIF', formState, features.join(', '));
  }

  // --- II: 1-2 thin smooth septa, perceived enhancement, calcification ---
  if (septa === 'thinSmooth' || enhancement === 'perceived') {
    const features = [];
    if (septa === 'thinSmooth') features.push('1-2 thin smooth septa');
    if (enhancement === 'perceived') features.push('perceived enhancement');
    return buildResult('II', formState, features.join(', '));
  }

  // --- I: Simple cyst ---
  if (wall === 'thinSmooth' && (!septa || septa === 'none')) {
    return buildResult('I', formState, 'Simple cyst — thin smooth wall, no septa');
  }

  // Default: if wall is thin smooth but features incomplete
  if (wall === 'thinSmooth') {
    return buildResult('I', formState, 'Simple cyst');
  }

  return buildResult(null, formState, 'Select features to classify');
}

function buildResult(category, formState, reason) {
  const info = category ? CATEGORY_INFO[category] : null;
  const sizeMm = formState.size;

  const septalLabels = {
    none: 'No septa',
    thinSmooth: '1-2 thin smooth septa',
    thinSmoothMany: '≥3 thin smooth septa',
    minThickSmooth: 'Minimally thickened smooth septa',
    thickIrregular: 'Thickened/irregular septa',
  };

  const wallLabels = {
    thinSmooth: 'Thin smooth wall',
    minThickSmooth: 'Minimally thickened smooth wall',
    thickIrregular: 'Thickened/irregular wall',
  };

  const enhancementLabels = {
    none: 'No enhancement',
    perceived: 'Perceived (not measurable)',
    measurable: 'Measurable enhancement',
  };

  const calcLabels = {
    none: 'None',
    thin: 'Thin/fine',
    thick: 'Thick/nodular',
  };

  const softTissueLabels = {
    absent: 'Absent',
    present: 'Present',
  };

  const modalityLabels = {
    ct: 'CT',
    mri: 'MRI',
  };

  return {
    category: category ? `Bosniak ${category}` : '--',
    categoryShort: category || '--',
    categoryLabel: info?.label || 'Incomplete',
    categoryFullLabel: category ? `Bosniak ${category} - ${info.label}` : '--',
    categoryLevel: info?.level || 0,
    management: info?.management || '',
    reason,
    modalityLabel: modalityLabels[formState.modality] || 'Not specified',
    septalLabel: septalLabels[formState.septa] || 'Not assessed',
    wallLabel: wallLabels[formState.wall] || 'Not assessed',
    enhancementLabel: enhancementLabels[formState.enhancement] || 'Not assessed',
    calcificationLabel: calcLabels[formState.calcification] || 'Not assessed',
    softTissueLabel: softTissueLabels[formState.softTissue] || 'Not assessed',
    sizeMm,
    sizeProvided: sizeMm != null,
    sizeCm: sizeMm != null ? (sizeMm / 10).toFixed(1) : null,
    locationProvided: !!formState.location,
    location: formState.location || '',
  };
}
