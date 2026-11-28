/**
 * NASCET carotid stenosis calculator.
 *
 * % Stenosis = (1 - Dstenosis / Ddistal) × 100
 *
 * Severity: <50% mild, 50–69% moderate, ≥70% severe.
 */

export function calculateNascet(formState) {
  const { stenosisDiam, distalDiam, side } = formState;

  const entered = stenosisDiam != null && distalDiam != null;
  // Impossible measurements are flagged rather than reported as a stenosis.
  const invalid = entered && (stenosisDiam < 0 || distalDiam <= 0 || stenosisDiam > distalDiam);
  const occluded = entered && !invalid && stenosisDiam === 0;
  const pct = entered && !invalid && !occluded
    ? Math.round((1 - stenosisDiam / distalDiam) * 1000) / 10 : null;

  let severity = '';
  let level = 0;
  let note = '';
  if (invalid) {
    note = 'Stenosis diameter must be between 0 and the distal ICA diameter: check measurements.';
  } else if (occluded) {
    // No residual lumen: occlusion, not a NASCET percentage.
    severity = 'Occlusion';
    level = 5;
  } else if (pct != null) {
    if (pct < 50) { severity = 'Mild'; level = 1; }
    else if (pct < 70) { severity = 'Moderate'; level = 3; }
    else { severity = 'Severe'; level = 5; }
  }

  const sideLabels = { right: 'Right', left: 'Left' };
  const ica = side && sideLabels[side] ? `${sideLabels[side]} ICA` : 'ICA';
  const impressionText = invalid ? note
    : occluded ? `${ica} occlusion.`
      : pct != null ? `${ica}: ${pct}% stenosis by NASCET criteria (${severity.toLowerCase()}).` : '';

  return {
    pct,
    pctLabel: occluded ? 'occluded' : pct != null ? `${pct}%` : '--',
    pctProvided: pct != null,
    severity,
    severityProvided: !!severity,
    level,
    note,
    noteProvided: !!note,
    impressionText,
    methodLabel: 'NASCET',
    modality: 'angio',
    occluded,
    sideLabel: sideLabels[side] || '',
    sideProvided: !!side,
    stenosisDiam,
    distalDiam,
  };
}

// --- Duplex ultrasound: SRU consensus (Grant EG et al. Radiology
// 2003;229:340-346). Primary parameters: ICA PSV and plaque estimate;
// additional: ICA/CCA PSV ratio and ICA EDV. PSV 125/230 cm/s, ratio 2/4
// and EDV 100 cm/s confirmed via Gornik 2021 (doi 10.1177/1358863X211011253);
// EDV 40 cm/s and the near-occlusion/occlusion rows from the consensus table
// (not re-checked against the original here).
const US_CATS = {
  normal: { label: 'No stenosis', pct: 'no', severity: 'Normal', level: 1 },
  lt50: { label: '<50%', pct: '<50%', severity: 'Mild', level: 1 },
  '50to69': { label: '50-69%', pct: '50-69%', severity: 'Moderate', level: 3 },
  ge70: { label: '>=70% (short of near occlusion)', pct: '>=70%', severity: 'Severe', level: 5 },
  nearOcclusion: { label: 'Near occlusion', pct: 'near occlusion', severity: 'Near occlusion', level: 5 },
  occlusion: { label: 'Total occlusion', pct: 'occlusion', severity: 'Occlusion', level: 5 },
};

/** SRU category implied by an additional parameter alone. */
function usCatFromRatio(r) { return r == null ? null : r < 2 ? 'lt50' : r <= 4 ? '50to69' : 'ge70'; }
function usCatFromEdv(e) { return e == null ? null : e < 40 ? 'lt50' : e <= 100 ? '50to69' : 'ge70'; }

export function calculateCarotidUS(formState) {
  const { psv, edv, ratio, plaque, flow, side } = formState;
  const sideLabels = { right: 'Right', left: 'Left' };
  const ica = side && sideLabels[side] ? `${sideLabels[side]} ICA` : 'ICA';

  let category = null;
  if (flow === 'absent') category = 'occlusion';
  else if (flow === 'nearOcclusion') category = 'nearOcclusion';
  else if (psv != null && psv >= 0) {
    if (psv < 125) category = plaque === 'none' ? 'normal' : 'lt50';
    else if (psv <= 230) category = '50to69';
    else category = 'ge70';
  }

  const notes = [];
  const rank = ['normal', 'lt50', '50to69', 'ge70'];
  const norm = (c) => (c === 'normal' ? 'lt50' : c);
  if (category && rank.includes(category)) {
    const extra = [['ICA/CCA ratio', usCatFromRatio(ratio)], ['EDV', usCatFromEdv(edv)]]
      .filter(([, c]) => c && c !== norm(category))
      .map(([n, c]) => `${n} suggests ${US_CATS[c].label}`);
    if (extra.length) notes.push(`Additional parameters discordant with PSV: ${extra.join('; ')}.`);
    if (plaque === 'lt50' && psv >= 125) notes.push('Plaque estimate <50% with PSV >=125 cm/s: correlate.');
    if (plaque === 'ge50' && psv < 125) notes.push('Plaque estimate >=50% with PSV <125 cm/s: correlate.');
  }
  const note = notes.join(' ');
  const info = category ? US_CATS[category] : null;

  let impressionText = '';
  if (category === 'occlusion') impressionText = `${ica} occlusion (no detectable flow).`;
  else if (category === 'nearOcclusion') impressionText = `${ica} near occlusion.`;
  else if (category === 'normal') impressionText = `${ica}: no stenosis by SRU duplex US criteria (ICA PSV ${psv} cm/s).`;
  else if (info) impressionText = `${ica}: ${info.label.replace(' (short of near occlusion)', '')} stenosis by SRU duplex US criteria (ICA PSV ${psv} cm/s).`;

  const plaqueLabels = { none: 'None visible', lt50: '<50% diameter reduction', ge50: '>=50% diameter reduction' };
  return {
    modality: 'us',
    methodLabel: 'SRU duplex US criteria',
    category,
    pct: null,
    pctLabel: info ? info.label : '--',
    badgeLabel: info ? info.pct : '--',
    pctProvided: !!info,
    severity: info?.severity || '',
    severityProvided: !!info,
    level: info?.level || 0,
    note,
    noteProvided: !!note,
    occluded: category === 'occlusion',
    impressionText,
    sideLabel: sideLabels[side] || '',
    sideProvided: !!side,
    psvLabel: psv != null ? `${psv} cm/s` : '',
    psvProvided: psv != null,
    edvLabel: edv != null ? `${edv} cm/s` : '',
    edvProvided: edv != null,
    ratioLabel: ratio != null ? String(ratio) : '',
    ratioProvided: ratio != null,
    plaqueLabel: plaqueLabels[plaque] || '',
    plaqueProvided: !!plaqueLabels[plaque],
  };
}

/**
 * Carotid stenosis by modality: 'angio' (CTA / MRA / DSA, NASCET diameter
 * method; default) or 'us' (duplex ultrasound, SRU velocity criteria). The
 * NASCET diameter formula does not apply to duplex ultrasound.
 */
export function calculateCarotid(formState) {
  return formState.modality === 'us' ? calculateCarotidUS(formState) : calculateNascet(formState);
}
