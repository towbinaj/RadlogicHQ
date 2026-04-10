/**
 * Fetal corpus callosum calculator.
 * Compares measured CC length to expected by GA (Harreld polynomial).
 */

import { expectedCCLength } from './definition.js';

export function calculateFetalCC(formState) {
  const { ga, ccLength } = formState;

  const hasGa = ga != null && ga >= 20 && ga <= 40;
  const hasCc = ccLength != null && ccLength > 0;

  const expected = hasGa ? expectedCCLength(ga) : null;

  let diff = null;
  let interpretation = '';
  let level = 0;

  if (hasCc && expected != null) {
    diff = Math.round((ccLength - expected) * 10) / 10;
    // Approximate ±2 SD as ~±6mm based on published ranges
    if (Math.abs(diff) <= 6) { interpretation = 'Within normal range'; level = 1; }
    else if (diff > 6) { interpretation = 'Above expected mean'; level = 2; }
    else { interpretation = 'Below expected mean — consider CC hypogenesis'; level = 3; }
  }

  const absent = formState.absent === true;

  return {
    gaLabel: hasGa ? `${ga} weeks` : '',
    gaProvided: hasGa,
    ccLabel: hasCc ? `${ccLength} mm` : absent ? 'Absent' : '--',
    ccProvided: hasCc || absent,
    expectedLabel: expected != null ? `${expected} mm` : '',
    expectedProvided: expected != null,
    diffLabel: diff != null ? `${diff >= 0 ? '+' : ''}${diff} mm` : '',
    diffProvided: diff != null,
    interpretation,
    interpretationProvided: !!interpretation,
    absent,
    absentProvided: absent,
    level: absent ? 5 : level,
  };
}
