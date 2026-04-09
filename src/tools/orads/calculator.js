/**
 * O-RADS US v2022 classification logic.
 *
 * Reference: Andreotti RF et al. Radiology 2020;294(1):168-185.
 *
 * Classification:
 *   0 — Incomplete / cannot be classified
 *   1 — Physiologic (normal follicle ≤3 cm in premenopausal)
 *   2 — Almost certainly benign (<1% malignancy risk)
 *   3 — Low risk (1-10%)
 *   4 — Intermediate risk (10-50%)
 *   5 — High risk (>50%)
 */

const CATEGORY_INFO = {
  0: { level: 0, label: 'Incomplete',                management: 'Additional imaging needed.' },
  1: { level: 1, label: 'Normal / Physiologic',      management: 'No follow-up needed.' },
  2: { level: 2, label: 'Almost Certainly Benign',    management: '<1% malignancy risk. Follow-up may be considered based on lesion type.' },
  3: { level: 3, label: 'Low Risk',                   management: '1-10% malignancy risk. Follow-up ultrasound recommended.' },
  4: { level: 4, label: 'Intermediate Risk',          management: '10-50% malignancy risk. Surgical evaluation or MRI recommended.' },
  5: { level: 5, label: 'High Risk',                  management: '>50% malignancy risk. Surgical management recommended.' },
};

/**
 * @param {Object} formState
 * @returns {Object}
 */
export function calculateOrads(formState) {
  const { classicBenign, morphology, colorScore, ascites, peritoneal } = formState;
  const sizeMm = formState.size;

  // Peritoneal nodularity → O-RADS 5
  if (peritoneal === 'present') {
    return buildResult(5, formState, 'Peritoneal nodularity');
  }

  // Classic benign descriptors → O-RADS 2
  if (classicBenign && classicBenign !== 'no') {
    // Simple cyst ≤3 cm could be O-RADS 1 (physiologic)
    if (classicBenign === 'simpleCyst' && sizeMm != null && sizeMm <= 30) {
      return buildResult(1, formState, 'Simple cyst ≤3 cm (physiologic)');
    }
    return buildResult(2, formState, 'Classic benign descriptor');
  }

  if (!morphology) {
    return buildResult(null, formState, 'Select morphology or classic benign descriptor');
  }

  const cs = colorScore ? parseInt(colorScore) : null;

  // Unilocular, smooth inner wall
  if (morphology === 'unilocularSmooth') {
    if (cs === 1 || cs === 2) return buildResult(2, formState, 'Unilocular smooth, color score 1-2');
    if (cs === 3 || cs === 4) return buildResult(3, formState, 'Unilocular smooth, color score 3-4');
    return buildResult(null, formState, 'Select color score');
  }

  // Unilocular, irregular inner wall
  if (morphology === 'unilocularIrregular') {
    if (cs === 1 || cs === 2) return buildResult(3, formState, 'Unilocular irregular, color score 1-2');
    if (cs === 3 || cs === 4) return buildResult(4, formState, 'Unilocular irregular, color score 3-4');
    return buildResult(null, formState, 'Select color score');
  }

  // Multilocular, smooth
  if (morphology === 'multilocularSmooth') {
    if (cs === 1 || cs === 2) return buildResult(3, formState, 'Multilocular smooth, color score 1-2');
    if (cs === 3 || cs === 4) return buildResult(4, formState, 'Multilocular smooth, color score 3-4');
    return buildResult(null, formState, 'Select color score');
  }

  // Multilocular, irregular
  if (morphology === 'multilocularIrregular') {
    if (cs === 1 || cs === 2) return buildResult(4, formState, 'Multilocular irregular, color score 1-2');
    if (cs === 3 || cs === 4) return buildResult(5, formState, 'Multilocular irregular, color score 3-4');
    return buildResult(null, formState, 'Select color score');
  }

  // Solid, smooth
  if (morphology === 'solidSmooth') {
    if (cs === 1 || cs === 2) return buildResult(3, formState, 'Solid smooth, color score 1-2');
    if (cs === 3 || cs === 4) return buildResult(4, formState, 'Solid smooth, color score 3-4');
    return buildResult(null, formState, 'Select color score');
  }

  // Solid, irregular
  if (morphology === 'solidIrregular') {
    return buildResult(5, formState, 'Solid irregular morphology');
  }

  return buildResult(null, formState, 'Incomplete inputs');
}

function buildResult(category, formState, reason) {
  const info = category != null ? CATEGORY_INFO[category] : null;
  const sizeMm = formState.size;

  const classicLabels = {
    no: '', simpleCyst: 'Simple cyst', hemorrhagicCyst: 'Hemorrhagic cyst',
    dermoid: 'Dermoid', endometrioma: 'Endometrioma', paraovarian: 'Paraovarian cyst',
    hydrosalpinx: 'Hydrosalpinx',
  };

  const morphLabels = {
    unilocularSmooth: 'Unilocular, smooth', unilocularIrregular: 'Unilocular, irregular inner wall',
    multilocularSmooth: 'Multilocular, smooth', multilocularIrregular: 'Multilocular, irregular',
    solidSmooth: 'Solid, smooth', solidIrregular: 'Solid, irregular',
  };

  const csLabels = { '1': '1 — No flow', '2': '2 — Minimal', '3': '3 — Moderate', '4': '4 — Abundant' };

  return {
    category: category != null ? `O-RADS ${category}` : '--',
    categoryShort: category != null ? String(category) : '--',
    categoryLabel: info?.label || 'Incomplete',
    categoryFullLabel: category != null ? `O-RADS ${category} - ${info.label}` : '--',
    categoryLevel: info?.level ?? 0,
    management: info?.management || '',
    reason,
    classicBenignLabel: classicLabels[formState.classicBenign] || 'None',
    morphologyLabel: morphLabels[formState.morphology] || 'Not assessed',
    colorScoreLabel: csLabels[formState.colorScore] || 'Not assessed',
    ascitesLabel: formState.ascites === 'present' ? 'Present' : formState.ascites === 'absent' ? 'Absent' : 'Not assessed',
    peritonealLabel: formState.peritoneal === 'present' ? 'Present' : formState.peritoneal === 'absent' ? 'Absent' : 'Not assessed',
    classicBenignProvided: !!formState.classicBenign,
    morphologyProvided: !!formState.morphology,
    colorScoreProvided: !!formState.colorScore,
    ascitesProvided: !!formState.ascites,
    peritonealProvided: !!formState.peritoneal,
    sizeMm,
    sizeProvided: sizeMm != null,
    sizeCm: sizeMm != null ? (sizeMm / 10).toFixed(1) : null,
    locationProvided: !!formState.location,
    location: formState.location || '',
  };
}
