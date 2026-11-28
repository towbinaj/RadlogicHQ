/**
 * Bosniak Classification v2019 categorization logic.
 * Feature-based classification - not point-scored.
 *
 * Reference: Silverman SG et al. Radiology 2019;292(2):475-488.
 * doi: 10.1148/radiol.2019182646. CT table as reproduced in Cancers 2024
 * (doi 10.3390/cancers16101926, Table 2); MRI table in JMRI 2021
 * (doi 10.1002/jmri.27364, Table 1).
 *
 * Modality comes first: the class I/II content criteria differ (CT
 * attenuation in HU vs MRI signal), calcification is a CT criterion only,
 * and an unenhanced study can be assigned at most class II.
 *
 * Highest class wins:
 *   IV  - enhancing nodule (>=4 mm obtuse convex protrusion, or any size acute)
 *   III - enhancing thick (>=4 mm) or irregular (<=3 mm obtuse protrusions) wall/septa
 *   IIF - enhancing minimally thickened (3 mm) wall/septa, or many (>=4) thin
 *         enhancing septa; MRI: heterogeneously T1 hyperintense (fat-sat)
 *   II  - few (1-3) thin septa, any calcification (CT), class II attenuation
 *         (CT) or signal (MRI) types, non-enhancing features, unenhanced study
 *   I   - thin smooth wall, simple fluid on an enhanced exam, no septa or
 *         calcification (the wall may enhance)
 * Enhancement: unequivocal visual enhancement, or >=20 HU (CT) / >=15% signal
 * increase (MRI). v2019 has no separate "perceived vs measurable" step.
 */

const CATEGORY_INFO = {
  'I':   { level: 1, label: 'Benign',                    management: 'No further workup. Simple cyst.' },
  'II':  { level: 2, label: 'Benign',                    management: 'No further workup. Minimally complex cyst.' },
  'IIF': { level: 3, label: 'Likely Benign - Follow-up', management: 'Follow-up imaging recommended (initially at 6 months, then annually for 5 years).' },
  'III': { level: 4, label: 'Indeterminate',             management: 'Surgical excision or active surveillance. Approximately 50% are malignant.' },
  'IV':  { level: 5, label: 'Likely Malignant',          management: 'Surgical management recommended. Majority are malignant.' },
};

// Content (homogeneous attenuation / signal) options valid for each exam.
export const CONTENT_BY_EXAM = {
  ct: {
    protocol: ['simple', 'hyper70', 'nonenh20', 'tooSmall', 'hetero'],
    enhanced: ['simple', 'pv2130', 'tooSmall', 'hetero'],
    unenhanced: ['simple', 'hyper70', 'tooSmall', 'hetero'],
  },
  mri: {
    enhanced: ['simple', 't1bright', 't1hetero', 'tooSmall'],
    unenhanced: ['simple', 't1bright', 't1hetero', 'tooSmall'],
  },
};

const CONTENT_II_REASON = {
  hyper70: 'homogeneous >=70 HU at unenhanced CT',
  nonenh20: 'homogeneous non-enhancing >20 HU at renal mass protocol CT',
  pv2130: 'homogeneous 21-30 HU at portal venous phase CT',
  tooSmall: 'homogeneous, too small to characterize',
  t1bright: 'homogeneous markedly T1 hyperintense (about 2.5x renal parenchyma, fat-saturated)',
};

const ENHANCING = new Set(['present', 'perceived', 'measurable']); // legacy ids count

/**
 * Run the Bosniak v2019 classification.
 * @param {Object} formState
 * @returns {Object} Result with category, label, management
 */
export function calculateBosniak(formState) {
  const { modality, exam, septa, wall, softTissue } = formState;

  if (modality !== 'ct' && modality !== 'mri') {
    return buildResult(null, formState, 'Select modality (CT or MRI)');
  }
  const exams = CONTENT_BY_EXAM[modality];
  if (!exams[exam]) {
    return buildResult(null, formState, modality === 'ct'
      ? 'Select CT exam (renal mass protocol, single-phase enhanced, or unenhanced)'
      : 'Select MRI exam (with or without contrast)');
  }
  const isCT = modality === 'ct';
  const contrast = exam !== 'unenhanced';
  const content = exams[exam].includes(formState.content) ? formState.content : null;
  const calcified = isCT && (formState.calcification === 'thin' || formState.calcification === 'thick');
  const enh = !contrast ? null : ENHANCING.has(formState.enhancement) ? 'present'
    : formState.enhancement === 'none' ? 'none' : undefined;

  const notes = [];
  if (!contrast) notes.push('Unenhanced study: the highest assignable Bosniak class is II.');
  if (isCT && formState.calcification === 'thick') {
    notes.push('Thick or nodular calcification may obscure enhancing features; consider MRI.');
  }
  if (isCT && content === 'hyper70' && formState.size > 30) {
    notes.push('Hyperattenuating homogeneous mass larger than 3 cm: consider MRI.');
  }
  const note = notes.join(' ');

  if (!wall && !softTissue) return buildResult(null, formState, 'Select wall characteristics', note);

  const twoFeatures = [];

  // --- IV: enhancing nodule ---
  if (softTissue === 'present') {
    if (contrast && enh === undefined) return buildResult(null, formState, 'Select enhancement (a nodule must enhance for class IV)', note);
    if (enh === 'present') return buildResult('IV', formState, 'Enhancing nodule', note);
    twoFeatures.push(contrast ? 'non-enhancing nodule' : 'nodule (enhancement not assessable)');
  }

  // --- III / IIF wall and septal features: must enhance ---
  const thick = wall === 'thickIrregular' || septa === 'thickIrregular';
  const minimal = wall === 'minThickSmooth' || septa === 'minThickSmooth' || septa === 'thinSmoothMany';
  if (thick || minimal) {
    if (contrast && enh === undefined) {
      return buildResult(null, formState, 'Select enhancement (IIF and III wall/septal features must enhance)', note);
    }
    if (enh === 'present') {
      const features = [];
      if (wall === 'thickIrregular') features.push('enhancing thick/irregular wall');
      if (septa === 'thickIrregular') features.push('enhancing thick/irregular septa');
      if (thick) return buildResult('III', formState, features.join(', '), note);
      if (wall === 'minThickSmooth') features.push('enhancing minimally thickened smooth wall');
      if (septa === 'minThickSmooth') features.push('enhancing minimally thickened smooth septa');
      if (septa === 'thinSmoothMany') features.push('>=4 thin smooth enhancing septa');
      return buildResult('IIF', formState, features.join(', '), note);
    }
    twoFeatures.push(contrast
      ? 'wall or septal thickening without enhancement (does not meet IIF/III)'
      : 'wall or septal thickening (enhancement not assessable)');
  }

  // --- IIF (MRI): heterogeneously T1 hyperintense; contrast-enhanced exam only ---
  if (content === 't1hetero') {
    if (contrast) return buildResult('IIF', formState, 'heterogeneously hyperintense at unenhanced fat-saturated T1W MRI', note);
    twoFeatures.push('heterogeneously T1 hyperintense (unenhanced MRI)');
  }

  // --- II features ---
  if (septa === 'thinSmooth') twoFeatures.push('1-3 thin smooth septa');
  if (calcified) twoFeatures.push('calcification');
  if (content && CONTENT_II_REASON[content]) twoFeatures.push(CONTENT_II_REASON[content]);
  if (content === 'simple' && !contrast) {
    twoFeatures.push(isCT ? 'homogeneous -9 to 20 HU at unenhanced CT' : 'homogeneous fluid signal at unenhanced MRI');
  }
  if (twoFeatures.length) return buildResult('II', formState, twoFeatures.join(', '), note);

  // --- Heterogeneous at CT without other features: needs MRI first ---
  if (content === 'hetero') {
    return buildResult(null, formState, 'Heterogeneous at CT: MRI recommended before assigning a Bosniak class', note);
  }

  // --- I: simple cyst on an enhanced exam ---
  if (wall === 'thinSmooth' && (!septa || septa === 'none')) {
    if (!content) {
      return buildResult(null, formState, isCT ? 'Select attenuation (HU) to classify' : 'Select signal to classify', note);
    }
    if (content === 'simple' && contrast) {
      return buildResult('I', formState, isCT
        ? 'Simple cyst: thin smooth wall, -9 to 20 HU, no septa or calcification'
        : 'Simple cyst: thin smooth wall, fluid signal similar to CSF, no septa', note);
    }
  }

  return buildResult(null, formState, 'Select features to classify', note);
}

function buildResult(category, formState, reason, note = '') {
  const info = category ? CATEGORY_INFO[category] : null;
  const sizeMm = formState.size;
  const isCT = formState.modality === 'ct';

  const septalLabels = {
    none: 'No septa',
    thinSmooth: '1-3 thin smooth septa',
    thinSmoothMany: '>=4 thin smooth septa',
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
    present: 'Enhancement present',
    perceived: 'Enhancement present',
    measurable: 'Enhancement present',
  };
  const calcLabels = { none: 'None', thin: 'Thin/fine', thick: 'Thick/nodular' };
  const softTissueLabels = { absent: 'Absent', present: 'Present' };
  const modalityLabels = { ct: 'CT', mri: 'MRI' };
  const examLabels = {
    protocol: 'Renal mass protocol (unenhanced and enhanced)',
    enhanced: isCT ? 'Single-phase contrast-enhanced (portal venous)' : 'With contrast',
    unenhanced: 'Unenhanced',
  };
  const contentLabels = {
    simple: isCT ? 'Homogeneous, -9 to 20 HU' : 'Homogeneous fluid signal (similar to CSF)',
    hyper70: 'Homogeneous, >=70 HU (unenhanced)',
    nonenh20: 'Homogeneous, >20 HU, non-enhancing',
    pv2130: 'Homogeneous, 21-30 HU (portal venous)',
    tooSmall: 'Homogeneous, too small to characterize',
    hetero: 'Heterogeneous',
    t1bright: 'Homogeneous, markedly T1 hyperintense (fat-sat)',
    t1hetero: 'Heterogeneously T1 hyperintense (fat-sat)',
  };
  const contrast = formState.exam && formState.exam !== 'unenhanced';

  return {
    category: category ? `Bosniak ${category}` : '--',
    categoryShort: category || '--',
    categoryLabel: info?.label || 'Incomplete',
    categoryFullLabel: category ? `Bosniak ${category} - ${info.label}` : '--',
    categoryLevel: info?.level || 0,
    management: info?.management || '',
    reason,
    note,
    noteProvided: !!note,
    modalityLabel: modalityLabels[formState.modality] || 'Not specified',
    examLabel: examLabels[formState.exam] || '',
    examProvided: !!examLabels[formState.exam],
    contentLabel: contentLabels[formState.content] || 'Not assessed',
    contentHeading: isCT ? 'Attenuation' : 'Signal',
    septalLabel: septalLabels[formState.septa] || 'Not assessed',
    wallLabel: wallLabels[formState.wall] || 'Not assessed',
    enhancementLabel: contrast ? (enhancementLabels[formState.enhancement] || 'Not assessed') : 'Not assessable (unenhanced)',
    calcificationLabel: calcLabels[formState.calcification] || 'Not assessed',
    calcificationApplies: isCT,
    softTissueLabel: softTissueLabels[formState.softTissue] || 'Not assessed',
    sizeMm,
    sizeProvided: sizeMm != null,
    sizeCm: sizeMm != null ? (sizeMm / 10).toFixed(1) : null,
    locationProvided: !!formState.location,
    location: formState.location || '',
  };
}
