/**
 * ASPECTS calculator.
 *
 * Score = 10 - (number of affected regions).
 * Barber 2000: ASPECTS <=7 predicted dependence/death and symptomatic
 * hemorrhage. 0-5 is the 'large core' range of recent thrombectomy trials.
 * Bands: 8-10 limited, 6-7 moderate (<=7), 0-5 extensive (large core).
 *
 * Blank by default: with no region marked, a score of 10 is reported only
 * when the reader confirms "no early ischemic changes" (normalConfirmed).
 * An untouched form must not read as a normal study.
 */

const NOT_ASSESSED = 'Not yet assessed: mark affected regions or confirm no early ischemic changes';

// Same 10 regions on CT and MRI DWI. Wording follows the modality; the
// Barber 2000 outcome cutoff (<=7) is a CT result and is not quoted for DWI.
const BANDS = {
  ct: {
    none: 'No early ischemic changes',
    limited: 'Limited early ischemic change',
    moderate: 'Moderate early ischemic change (ASPECTS 7 or less)',
    extensive: 'Extensive early ischemic change (large core, ASPECTS 5 or less)',
  },
  dwi: {
    none: 'No acute diffusion restriction',
    limited: 'Limited extent of diffusion restriction',
    moderate: 'Moderate extent of diffusion restriction',
    extensive: 'Extensive diffusion restriction (DWI-ASPECTS 5 or less)',
  },
};

export function calculateAspects(affected, side, normalConfirmed = false, modality = 'ct') {
  const bands = BANDS[modality] || BANDS.ct;
  const aspectsName = modality === 'dwi' ? 'DWI-ASPECTS' : 'ASPECTS';
  const affectedHeading = modality === 'dwi' ? 'Regions with acute diffusion restriction' : 'Regions with early ischemic changes';
  const affectedCount = affected.size;
  const sideLabel = side === 'left' ? 'Left' : side === 'right' ? 'Right' : '';

  if (affectedCount === 0 && !normalConfirmed) {
    return {
      score: '--',
      scoreLabel: '--',
      affectedCount: 0,
      interpretation: NOT_ASSESSED,
      level: 0,
      sideLabel,
      sideProvided: !!side,
      affectedText: 'None',
      affectedProvided: false,
      assessed: false,
      aspectsName,
      affectedHeading,
    };
  }

  const score = 10 - affectedCount;

  let interpretation = '';
  let level = 0;
  if (affectedCount === 0) {
    interpretation = bands.none;
    level = 1;
  } else if (score >= 8) {
    interpretation = bands.limited;
    level = 2;
  } else if (score >= 6) {
    interpretation = bands.moderate;
    level = 3;
  } else {
    interpretation = bands.extensive;
    level = 5;
  }

  // Build affected regions text
  const affectedList = [];
  for (const id of affected) {
    affectedList.push(id);
  }
  const affectedText = affectedList.length > 0
    ? affectedList.join(', ')
    : 'None';

  return {
    score,
    scoreLabel: String(score),
    affectedCount,
    interpretation,
    level,
    sideLabel,
    sideProvided: !!side,
    affectedText,
    affectedProvided: affectedCount > 0,
    assessed: true,
    aspectsName,
    affectedHeading,
  };
}

/**
 * True when pasted report text states a normal ASPECTS ("ASPECTS 10",
 * "ASPECTS: 10/10", "no early/acute ischemic changes"). Used by the paste
 * handler to set normalConfirmed when no regions were parsed.
 */
export function detectNormalAspects(text = '') {
  return /\bASPECTS\b\D{0,20}\b10\b/i.test(text)
    || /\bno (?:acute |early )?ischemic changes?\b/i.test(text)
    || /\bno (?:acute )?(?:diffusion restriction|restricted diffusion)\b/i.test(text);
}
