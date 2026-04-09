/**
 * Leg Length Discrepancy calculator.
 * Computes which side is longer and by how much.
 */

/**
 * @param {Object} formState
 * @returns {Object} Result with discrepancy, longer side, labels
 */
export function calculateLegLength(formState) {
  const { rightLength, leftLength, rightAlignment, leftAlignment, physes } = formState;

  const hasRight = rightLength != null && rightLength > 0;
  const hasLeft = leftLength != null && leftLength > 0;

  let longerSide = '';
  let discrepancy = null;
  let discrepancyLabel = '';

  if (hasRight && hasLeft) {
    const diff = Math.abs(rightLength - leftLength);
    discrepancy = Math.round(diff * 10) / 10; // round to 0.1 cm

    if (rightLength > leftLength) {
      longerSide = 'right';
      discrepancyLabel = `The right lower extremity is longer by ${discrepancy} cm.`;
    } else if (leftLength > rightLength) {
      longerSide = 'left';
      discrepancyLabel = `The left lower extremity is longer by ${discrepancy} cm.`;
    } else {
      longerSide = 'equal';
      discrepancyLabel = 'The lower extremities are equal in length.';
    }
  }

  const alignmentLabels = {
    'neutral': 'neutral',
    'mild-valgus': 'mild valgus',
    'moderate-valgus': 'moderate valgus',
    'severe-valgus': 'severe valgus',
    'mild-varus': 'mild varus',
    'moderate-varus': 'moderate varus',
    'severe-varus': 'severe varus',
  };

  const physesLabels = {
    'open': 'open',
    'closing': 'closing',
    'closed': 'closed',
  };

  return {
    rightLength: hasRight ? rightLength : null,
    leftLength: hasLeft ? leftLength : null,
    rightLengthProvided: hasRight,
    leftLengthProvided: hasLeft,
    bothProvided: hasRight && hasLeft,
    longerSide,
    discrepancy,
    discrepancyLabel,
    rightAlignmentLabel: alignmentLabels[rightAlignment] || '',
    leftAlignmentLabel: alignmentLabels[leftAlignment] || '',
    rightAlignmentProvided: !!rightAlignment,
    leftAlignmentProvided: !!leftAlignment,
    physesLabel: physesLabels[physes] || '',
    physesProvided: !!physes,
  };
}
