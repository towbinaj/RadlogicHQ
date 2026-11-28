/**
 * PRETEXT staging calculator.
 * CDE: RDES358 / RDE2549 (PRETEXT Group)
 *
 * Group is determined by the number of contiguous tumor-free liver sections.
 * The 5 sections are: Caudate (C), Right Posterior (RP), Right Anterior (RA),
 * Left Medial (LM), Left Lateral (LL).
 *
 * Group = 4 minus the largest run of contiguous tumor-free sections
 * (RP, RA, LM, LL); caudate involvement -> at least Group II.
 */

// PRETEXT group (Towbin AJ et al., Pediatr Radiol 2018; PRETEXT 2017):
// 4 minus the largest number of contiguous tumor-free sections, with the
// four sections in anatomic order RP - RA - LM - LL. Caudate involvement
// makes the tumor at least PRETEXT II. Computed rather than looked up: the
// previous hand-written table had two wrong entries (RP+LM, C+RP+LL) and
// duplicate keys.
const LINEAR_SECTIONS = ['rightPosterior', 'rightAnterior', 'leftMedial', 'leftLateral'];

export function pretextGroup(involved) {
  let best = 0;
  let run = 0;
  for (const s of LINEAR_SECTIONS) {
    run = involved.includes(s) ? 0 : run + 1;
    best = Math.max(best, run);
  }
  let group = 4 - best;
  if (involved.includes('caudate')) group = Math.max(group, 2);
  return group;
}

// Canonical section order for consistent key generation
const SECTION_ORDER = ['caudate', 'rightPosterior', 'rightAnterior', 'leftMedial', 'leftLateral'];

const GROUP_INFO = {
  1: { label: 'PRETEXT I',   management: 'Tumor confined to one section; three contiguous sections are tumor-free.' },
  2: { label: 'PRETEXT II',  management: 'Tumor involves one or two sections; two contiguous sections are tumor-free.' },
  3: { label: 'PRETEXT III', management: 'Tumor involves two or three sections; only one section or two non-contiguous sections are tumor-free.' },
  4: { label: 'PRETEXT IV',  management: 'Tumor involves all four sections (or all five including caudate).' },
};

/**
 * @param {Object} formState
 * @returns {Object}
 */
export function calculatePretext(formState) {
  // Determine involved sections
  const involved = SECTION_ORDER.filter((s) => formState[s] === 'yes');
  const involvedCount = involved.length;

  if (involvedCount === 0) {
    return buildResult(null, formState, 'Select involved liver sections');
  }

  const group = pretextGroup(involved);

  const sectionLabels = involved.map((s) => {
    const map = { caudate: 'C', rightPosterior: 'RP', rightAnterior: 'RA', leftMedial: 'LM', leftLateral: 'LL' };
    return map[s];
  });

  const reason = `${sectionLabels.join(', ')} involved (${involvedCount}/5 sections)`;
  return buildResult(group, formState, reason);
}

function buildResult(group, formState, reason) {
  const info = group ? GROUP_INFO[group] : null;

  // Build annotation summary
  const annotationCodes = ['V', 'P', 'E', 'F', 'R', 'N', 'M'];
  const annotationLabels = {
    V: 'Hepatic venous/IVC involvement',
    P: 'Portal venous involvement',
    E: 'Extrahepatic disease',
    F: 'Multifocal tumors',
    R: 'Tumor rupture',
    N: 'Nodal metastases',
    M: 'Distant metastases',
  };

  const positiveAnnotations = [];
  const unknownAnnotations = [];
  const annotationDetails = {};

  for (const code of annotationCodes) {
    const val = formState['ann_' + code];
    const label = val === 'yes' ? 'Positive' : val === 'no' ? 'Negative' : val === 'unknown' ? 'Unknown' : 'Not assessed';
    annotationDetails[code] = label;
    annotationDetails[code + 'Provided'] = !!val;
    if (val === 'yes') positiveAnnotations.push(code);
    if (val === 'unknown') unknownAnnotations.push(code);
  }

  const annotationSummary = positiveAnnotations.length > 0
    ? positiveAnnotations.join('')
    : 'None';

  // PRETEXT 2017 annotation factors: C (caudate involvement) is shown with
  // the others, e.g. "PRETEXT II C V".
  const ROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };
  const stagingAnnotations = [
    ...(formState.caudate === 'yes' ? ['C'] : []),
    ...positiveAnnotations,
  ];
  const fullStaging = group
    ? `PRETEXT ${ROMAN[group]}${stagingAnnotations.length > 0 ? ' ' + stagingAnnotations.join(' ') : ''}`
    : '--';

  // Section involvement summary
  const sectionMap = { caudate: 'C', rightPosterior: 'RP', rightAnterior: 'RA', leftMedial: 'LM', leftLateral: 'LL' };
  const sectionDetails = {};
  for (const s of SECTION_ORDER) {
    const val = formState[s];
    sectionDetails[sectionMap[s]] = val === 'yes' ? 'Involved' : val === 'no' ? 'Free' : 'Not assessed';
  }

  const sizeMm = formState.maxDiameter;

  return {
    group: group || null,
    groupLabel: info?.label || '--',
    groupFullLabel: fullStaging,
    groupLevel: group || 0,
    management: info?.management || '',
    reason,
    annotationSummary,
    positiveAnnotations,
    annotationDetails,
    sectionDetails,
    ...sectionDetails,
    ...annotationDetails,
    sizeMm,
    sizeProvided: sizeMm != null,
    sizeCm: sizeMm != null ? (sizeMm / 10).toFixed(1) : null,
  };
}

const ANNOTATION_CODES = ['V', 'P', 'E', 'F', 'R', 'N', 'M'];

/**
 * parseFindings output -> form state. The parse rules key annotations by
 * code (V, P...); the UI and calculator use ann_V, ann_P...
 */
export function pretextFormStateFromParse(parsed) {
  const fs = {};
  for (const [k, v] of Object.entries(parsed)) {
    fs[ANNOTATION_CODES.includes(k) ? 'ann_' + k : k] = v;
  }
  return fs;
}
