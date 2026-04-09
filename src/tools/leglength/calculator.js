/**
 * Leg Length Discrepancy calculator.
 * Supports both total and segmental modes.
 */

const ALIGNMENT_LABELS = {
  'neutral': 'neutral',
  'mild-valgus': 'mild valgus',
  'moderate-valgus': 'moderate valgus',
  'severe-valgus': 'severe valgus',
  'mild-varus': 'mild varus',
  'moderate-varus': 'moderate varus',
  'severe-varus': 'severe varus',
};

const PHYSES_LABELS = {
  'open': 'open',
  'closing': 'closing',
  'closed': 'closed',
};

function round1(val) {
  return Math.round(val * 10) / 10;
}

function computeDiscrepancy(rightVal, leftVal) {
  const hasRight = rightVal != null && rightVal > 0;
  const hasLeft = leftVal != null && leftVal > 0;

  if (!hasRight || !hasLeft) return { diff: null, longerSide: '', label: '' };

  const diff = round1(Math.abs(rightVal - leftVal));

  if (rightVal > leftVal) {
    return { diff, longerSide: 'right', label: `The right lower extremity is longer by ${diff} cm.` };
  } else if (leftVal > rightVal) {
    return { diff, longerSide: 'left', label: `The left lower extremity is longer by ${diff} cm.` };
  }
  return { diff: 0, longerSide: 'equal', label: 'The lower extremities are equal in length.' };
}

/**
 * Total mode calculation.
 */
export function calculateLegLength(formState) {
  const { rightLength, leftLength, rightAlignment, leftAlignment, physes } = formState;

  const hasRight = rightLength != null && rightLength > 0;
  const hasLeft = leftLength != null && leftLength > 0;
  const disc = computeDiscrepancy(rightLength, leftLength);

  return {
    rightLength: hasRight ? rightLength : null,
    leftLength: hasLeft ? leftLength : null,
    rightLengthProvided: hasRight,
    leftLengthProvided: hasLeft,
    bothProvided: hasRight && hasLeft,
    longerSide: disc.longerSide,
    discrepancy: disc.diff,
    discrepancyLabel: disc.label,
    rightAlignmentLabel: ALIGNMENT_LABELS[rightAlignment] || '',
    leftAlignmentLabel: ALIGNMENT_LABELS[leftAlignment] || '',
    rightAlignmentProvided: !!rightAlignment,
    leftAlignmentProvided: !!leftAlignment,
    physesLabel: PHYSES_LABELS[physes] || '',
    physesProvided: !!physes,
  };
}

/**
 * Segmental mode calculation.
 */
export function calculateSegmental(formState) {
  const { rightFemur, leftFemur, rightTibia, leftTibia } = formState;

  const hasRF = rightFemur != null && rightFemur > 0;
  const hasLF = leftFemur != null && leftFemur > 0;
  const hasRT = rightTibia != null && rightTibia > 0;
  const hasLT = leftTibia != null && leftTibia > 0;

  // Auto-compute totals
  const rightTotal = (hasRF && hasRT) ? round1(rightFemur + rightTibia) : null;
  const leftTotal = (hasLF && hasLT) ? round1(leftFemur + leftTibia) : null;

  // Per-segment differences
  const femurDisc = (hasRF && hasLF) ? round1(Math.abs(rightFemur - leftFemur)) : null;
  const tibiaDisc = (hasRT && hasLT) ? round1(Math.abs(rightTibia - leftTibia)) : null;
  const totalDisc = computeDiscrepancy(rightTotal, leftTotal);

  return {
    rightFemur: hasRF ? rightFemur : null,
    leftFemur: hasLF ? leftFemur : null,
    rightTibia: hasRT ? rightTibia : null,
    leftTibia: hasLT ? leftTibia : null,
    rightTotal,
    leftTotal,
    femurDiff: femurDisc,
    tibiaDiff: tibiaDisc,
    totalDiff: totalDisc.diff,
    longerSide: totalDisc.longerSide,
    discrepancy: totalDisc.diff,
    bothFemur: hasRF && hasLF,
    bothTibia: hasRT && hasLT,
    bothTotal: rightTotal != null && leftTotal != null,
  };
}
