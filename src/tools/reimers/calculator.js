/**
 * Reimers' Migration Index calculator.
 * Migration % = (M1 / M2) × 100
 *   M1 = uncovered femoral head length
 *   M2 = femoral head length (total width)
 */

function round1(val) {
  return Math.round(val * 10) / 10;
}

/**
 * @param {Object} formState
 * @returns {Object} Result with right/left migration percentages
 */
export function calculateReimers(formState) {
  const { rightM1, rightM2, leftM1, leftM2, coxaValga } = formState;

  const hasRight = rightM1 != null && rightM1 >= 0 && rightM2 != null && rightM2 > 0;
  const hasLeft = leftM1 != null && leftM1 >= 0 && leftM2 != null && leftM2 > 0;

  const rightPct = hasRight ? round1((rightM1 / rightM2) * 100) : null;
  const leftPct = hasLeft ? round1((leftM1 / leftM2) * 100) : null;

  const coxaValgaLabel = coxaValga === 'present'
    ? 'There is apparent coxa valga alignment of the proximal femurs.'
    : coxaValga === 'absent'
      ? 'There is no apparent coxa valga alignment of the proximal femurs.'
      : '';

  return {
    rightM1: rightM1 ?? null,
    rightM2: rightM2 ?? null,
    leftM1: leftM1 ?? null,
    leftM2: leftM2 ?? null,
    rightPct,
    leftPct,
    rightProvided: hasRight,
    leftProvided: hasLeft,
    coxaValga: coxaValga || '',
    coxaValgaProvided: !!coxaValga,
    coxaValgaLabel,
  };
}
