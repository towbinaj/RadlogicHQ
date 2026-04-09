/**
 * MIBG Score calculator — Curie and SIOPEN modes.
 *
 * Curie: 10 segments × 0-3 = max 30. Threshold: ≤2 favorable, >2 unfavorable.
 * SIOPEN: 12 segments × 0-6 = max 72. Threshold: ≤3 favorable, >3 unfavorable.
 */

import { curieDefinition } from './definition.js';

/**
 * @param {Object} segmentScores — keyed by segment id, value is score string
 * @param {string} mode — 'curie' or 'siopen'
 * @returns {Object}
 */
export function calculateMibg(segmentScores, mode) {
  const segments = mode === 'siopen'
    ? curieDefinition.siopenSegments
    : curieDefinition.curieSegments;

  const maxPerSegment = mode === 'siopen' ? 6 : 3;
  const maxTotal = segments.length * maxPerSegment;
  const threshold = mode === 'siopen' ? 3 : 2;

  let total = 0;
  let assessed = 0;
  const segmentDetails = [];

  for (const seg of segments) {
    const val = segmentScores[seg.id];
    const score = val != null ? parseInt(val) : null;
    if (score != null && !isNaN(score)) {
      total += score;
      assessed++;
    }
    segmentDetails.push({
      id: seg.id,
      label: seg.label,
      score: score != null ? score : null,
    });
  }

  const allAssessed = assessed === segments.length;
  const favorable = allAssessed && total <= threshold;
  const unfavorable = allAssessed && total > threshold;

  let interpretation = '';
  let level = 0;
  if (allAssessed) {
    if (favorable) {
      interpretation = `Score ≤${threshold}: Favorable prognosis`;
      level = 1;
    } else {
      interpretation = `Score >${threshold}: Unfavorable prognosis`;
      level = 4;
    }
  }

  const modeLabel = mode === 'siopen' ? 'SIOPEN' : 'Curie';

  return {
    mode,
    modeLabel,
    total: assessed > 0 ? total : null,
    maxTotal,
    totalLabel: assessed > 0 ? `${total} / ${maxTotal}` : '--',
    assessed,
    segmentCount: segments.length,
    allAssessed,
    favorable,
    unfavorable,
    threshold,
    interpretation,
    level,
    segmentDetails,
  };
}
