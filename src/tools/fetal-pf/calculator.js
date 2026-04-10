/**
 * Fetal posterior fossa calculator.
 */

import { expectedVermianHeight, fetalPFDefinition } from './definition.js';

export function calculateFetalPF(formState) {
  const { ga, vermianHeight, vermianAP, tva, brainstemAP } = formState;

  const hasGa = ga != null && ga >= 17 && ga <= 40;

  // Vermian height comparison
  const hasVh = vermianHeight != null && vermianHeight > 0;
  const expectedVh = hasGa ? expectedVermianHeight(ga) : null;
  let vhDiff = null;
  let vhInterpretation = '';
  if (hasVh && expectedVh != null) {
    vhDiff = Math.round((vermianHeight - expectedVh) * 10) / 10;
    if (Math.abs(vhDiff) <= 3) vhInterpretation = 'Within normal range';
    else if (vhDiff > 3) vhInterpretation = 'Above expected';
    else vhInterpretation = 'Below expected — consider vermian hypoplasia';
  }

  // TVA categorization (GA-independent)
  const hasTva = tva != null && tva >= 0;
  let tvaCategory = '';
  let tvaCategoryDesc = '';
  let tvaLevel = 0;
  if (hasTva) {
    const cat = fetalPFDefinition.tvaCategories.find((c) => tva < c.max);
    if (cat) { tvaCategory = cat.label; tvaCategoryDesc = cat.description; }
    tvaLevel = tva < 18 ? 1 : tva < 30 ? 2 : tva < 70 ? 3 : 5;
  }

  const hasVap = vermianAP != null && vermianAP > 0;
  const hasBs = brainstemAP != null && brainstemAP > 0;

  return {
    gaLabel: hasGa ? `${ga} weeks` : '', gaProvided: hasGa,
    vhLabel: hasVh ? `${vermianHeight} mm` : '--', vhProvided: hasVh,
    vhExpected: expectedVh != null ? `${expectedVh} mm` : '', vhExpectedProvided: expectedVh != null,
    vhInterpretation, vhInterpretationProvided: !!vhInterpretation,
    vapLabel: hasVap ? `${vermianAP} mm` : '--', vapProvided: hasVap,
    tvaLabel: hasTva ? `${tva}\u00b0` : '--', tvaProvided: hasTva,
    tvaCategory, tvaCategoryDesc, tvaCategoryProvided: !!tvaCategory,
    bsLabel: hasBs ? `${brainstemAP} mm` : '--', bsProvided: hasBs,
    level: Math.max(tvaLevel, vhInterpretation.includes('hypoplasia') ? 3 : 0),
  };
}
