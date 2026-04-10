/**
 * Fetal brain biometry calculator.
 * Compares measurements to GA-specific reference means.
 */

import { BPD_MEANS, CEREBELLUM_MEANS } from './definition.js';

export function calculateFetalBiometry(formState) {
  const { ga, bpd, cerebellum, cisternaMagna } = formState;
  const hasGa = ga != null && ga >= 20 && ga <= 40;

  // BPD comparison
  const hasBpd = bpd != null && bpd > 0;
  let bpdMean = null;
  let bpdDiff = null;
  let bpdInterpretation = '';
  if (hasGa && hasBpd) {
    bpdMean = BPD_MEANS[ga] || null;
    if (bpdMean) {
      bpdDiff = Math.round((bpd - bpdMean) * 10) / 10;
      if (Math.abs(bpdDiff) <= 5) bpdInterpretation = 'Within normal range';
      else if (bpdDiff > 5) bpdInterpretation = 'Above expected mean';
      else bpdInterpretation = 'Below expected mean';
    }
  }

  // Cerebellar diameter comparison
  const hasCerebellum = cerebellum != null && cerebellum > 0;
  let cerebellumMean = null;
  let cerebellumDiff = null;
  let cerebellumInterpretation = '';
  if (hasGa && hasCerebellum) {
    cerebellumMean = CEREBELLUM_MEANS[ga] || null;
    if (cerebellumMean) {
      cerebellumDiff = Math.round((cerebellum - cerebellumMean) * 10) / 10;
      if (Math.abs(cerebellumDiff) <= 3) cerebellumInterpretation = 'Within normal range';
      else if (cerebellumDiff > 3) cerebellumInterpretation = 'Above expected mean';
      else cerebellumInterpretation = 'Below expected mean';
    }
  }

  // Cisterna magna — normal 2-10mm, GA-independent
  const hasCm = cisternaMagna != null && cisternaMagna >= 0;
  let cmInterpretation = '';
  if (hasCm) {
    if (cisternaMagna >= 2 && cisternaMagna <= 10) cmInterpretation = 'Normal (2\u201310 mm)';
    else if (cisternaMagna > 10) cmInterpretation = 'Enlarged (>10 mm)';
    else cmInterpretation = 'Small (<2 mm)';
  }

  return {
    gaLabel: hasGa ? `${ga} weeks` : '',
    gaProvided: hasGa,
    bpdLabel: hasBpd ? `${bpd} mm` : '--',
    bpdProvided: hasBpd,
    bpdMean: bpdMean != null ? `${bpdMean} mm` : '',
    bpdDiff: bpdDiff != null ? `${bpdDiff >= 0 ? '+' : ''}${bpdDiff} mm` : '',
    bpdInterpretation,
    bpdInterpretationProvided: !!bpdInterpretation,
    cerebellumLabel: hasCerebellum ? `${cerebellum} mm` : '--',
    cerebellumProvided: hasCerebellum,
    cerebellumMean: cerebellumMean != null ? `${cerebellumMean} mm` : '',
    cerebellumDiff: cerebellumDiff != null ? `${cerebellumDiff >= 0 ? '+' : ''}${cerebellumDiff} mm` : '',
    cerebellumInterpretation,
    cerebellumInterpretationProvided: !!cerebellumInterpretation,
    cmLabel: hasCm ? `${cisternaMagna} mm` : '--',
    cmProvided: hasCm,
    cmInterpretation,
    cmInterpretationProvided: !!cmInterpretation,
    level: 0,
  };
}
