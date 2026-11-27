/**
 * Fetal posterior fossa calculator.
 */

import { cigniniRow, fetalPFDefinition } from './definition.js';

export function calculateFetalPF(formState) {
  const { ga, vermianHeight, vermianAP, tva, brainstemAP } = formState;

  const hasGa = ga != null && ga >= 17 && ga <= 40;

  // Vermian height comparison
  const hasVh = vermianHeight != null && vermianHeight > 0;
  // Cignini 2016 centiles (20-35 weeks). Outside that range the value is
  // reported without interpretation rather than extrapolated.
  const ref = hasGa ? cigniniRow(ga) : null;
  const expectedVh = ref ? ref.mean : null;
  let vhInterpretation = '';
  let vhLevel = 0;
  if (hasVh && ref) {
    if (vermianHeight < ref.p1) { vhInterpretation = 'Below 1st centile - consider vermian hypoplasia'; vhLevel = 3; }
    else if (vermianHeight < ref.p5) { vhInterpretation = 'Below 5th centile'; vhLevel = 2; }
    else if (vermianHeight > ref.p95) { vhInterpretation = 'Above 95th centile'; vhLevel = 2; }
    else vhInterpretation = 'Within normal range (5th-95th centile)';
  }
  const vhNote = hasVh && !ref ? 'No reference: Cignini 2016 covers 20-35 weeks' : '';

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
    vhNote, vhNoteProvided: !!vhNote,
    vapLabel: hasVap ? `${vermianAP} mm` : '--', vapProvided: hasVap,
    tvaLabel: hasTva ? `${tva}\u00b0` : '--', tvaProvided: hasTva,
    tvaCategory, tvaCategoryDesc, tvaCategoryProvided: !!tvaCategory,
    bsLabel: hasBs ? `${brainstemAP} mm` : '--', bsProvided: hasBs,
    level: Math.max(tvaLevel, vhLevel),
  };
}
