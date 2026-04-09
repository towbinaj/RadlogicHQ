/**
 * PRETEXT staging calculator.
 * CDE: RDES358 / RDE2549 (PRETEXT Group)
 *
 * Group is determined by the number of contiguous tumor-free liver sections.
 * The 5 sections are: Caudate (C), Right Posterior (RP), Right Anterior (RA),
 * Left Medial (LM), Left Lateral (LL).
 *
 * Grouping logic from the PRETEXT lookup table:
 *   Group 1: Tumor confined to 1 section, 3+ contiguous sections free
 *   Group 2: Tumor in 1-2 sections, 2 contiguous sections free
 *   Group 3: Tumor in 2-3 sections, only 1 contiguous section free
 *   Group 4: Tumor in all sections, no section free
 */

// Complete lookup table from the Excel reference.
// Key = sorted involved section IDs joined by comma.
// Value = PRETEXT group.
const GROUP_TABLE = {
  // Group 1 — single section, favorable location
  'rightPosterior': 1,
  'leftLateral': 1,

  // Group 2
  'caudate': 2,
  'rightAnterior': 2,
  'leftMedial': 2,
  'caudate,rightPosterior': 2,
  'caudate,leftLateral': 2,
  'caudate,rightAnterior': 2,
  'caudate,leftMedial': 2,
  'rightPosterior,rightAnterior': 2,
  'leftMedial,leftLateral': 2,
  'caudate,rightPosterior,rightAnterior': 2,
  'caudate,leftMedial,leftLateral': 2,
  'rightPosterior,leftLateral': 2,
  'rightAnterior,leftLateral': 2,
  'rightPosterior,leftMedial': 2,

  // Group 3
  'rightAnterior,leftMedial': 3,
  'rightAnterior,leftLateral': 3,
  'rightPosterior,rightAnterior,leftMedial': 3,
  'rightPosterior,rightAnterior,leftLateral': 3,
  'rightPosterior,leftMedial,leftLateral': 3,
  'rightAnterior,leftMedial,leftLateral': 3,
  'caudate,rightAnterior,leftMedial': 3,
  'caudate,rightAnterior,leftLateral': 3,
  'caudate,rightPosterior,leftMedial': 3,
  'caudate,rightPosterior,leftLateral': 3,
  'caudate,leftMedial,rightAnterior': 3,
  'caudate,rightPosterior,rightAnterior,leftLateral': 3,
  'caudate,rightPosterior,rightAnterior,leftMedial': 3,
  'caudate,rightPosterior,leftMedial,leftLateral': 3,
  'caudate,rightAnterior,leftMedial,leftLateral': 3,
  'rightPosterior,rightAnterior,leftMedial,leftLateral': 3,

  // Group 4
  'caudate,rightPosterior,rightAnterior,leftMedial,leftLateral': 4,
  'rightPosterior,rightAnterior,leftMedial,leftLateral': 4,
};

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

  // Look up group from table
  const key = involved.join(',');
  let group = GROUP_TABLE[key];

  // Fallback: if exact combo not found, estimate by count
  if (group == null) {
    if (involvedCount === 1) group = 2;
    else if (involvedCount === 2) group = 3;
    else if (involvedCount === 3) group = 3;
    else if (involvedCount >= 4) group = 4;
  }

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

  const fullStaging = group
    ? `PRETEXT ${group}${positiveAnnotations.length > 0 ? ' ' + positiveAnnotations.join('') : ''}`
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
    ...annotationDetails,
    sizeMm,
    sizeProvided: sizeMm != null,
    sizeCm: sizeMm != null ? (sizeMm / 10).toFixed(1) : null,
  };
}
