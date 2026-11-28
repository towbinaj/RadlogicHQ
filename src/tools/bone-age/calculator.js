/**
 * Greulich & Pyle bone age calculator.
 *
 * Sontag has its own calculator in ../bone-age-sontag/calculator.js as of
 * the split (docs/test.md section 9 backlog closeout). This file is now
 * G&P-specific and no longer accepts a method parameter.
 */

import { interpretBoneAge } from './brush.js';

export function calculateBoneAge(formState) {
  const { sex, chronoYears, chronoMonths, boneAgeYears, boneAgeMonths } = formState;

  const sexLabels = { male: 'Male', female: 'Female' };
  const chronoTotal = (chronoYears || 0) + (chronoMonths || 0) / 12;
  const hasChrono = chronoYears != null || chronoMonths != null;
  const chronoLabel = hasChrono ? formatAge(chronoYears || 0, chronoMonths || 0) : '';

  let boneAgeTotal = null;
  let boneAgeLabel = '';
  let difference = null;
  let interpretation = '';
  let level = 0;
  let brush = interpretBoneAge(sex, null, null);

  if (boneAgeYears != null || boneAgeMonths != null) {
    boneAgeTotal = (boneAgeYears || 0) + (boneAgeMonths || 0) / 12;
    boneAgeLabel = formatAge(boneAgeYears || 0, boneAgeMonths || 0);
  }

  if (hasChrono && boneAgeTotal != null) {
    difference = Math.round((boneAgeTotal - chronoTotal) * 10) / 10;
    // Greulich & Pyle Brush Foundation SD by age and sex (CA +/- 2 SD).
    brush = interpretBoneAge(sex, chronoTotal * 12, boneAgeTotal * 12);
    interpretation = brush.interpretation;
    level = brush.level;
  }

  return {
    methodLabel: 'Greulich and Pyle',
    sexLabel: sexLabels[sex] || '', sexProvided: !!sex,
    chronoLabel, chronoProvided: hasChrono,
    boneAgeLabel, boneAgeProvided: boneAgeTotal != null,
    difference, differenceLabel: difference != null ? `${difference >= 0 ? '+' : ''}${difference.toFixed(1)} years` : '--',
    differenceProvided: difference != null,
    interpretation, interpretationProvided: !!interpretation, level,
    zLabel: brush.zLabel, normalRangeLabel: brush.normalRangeLabel, normalRangeProvided: !!brush.normalRangeLabel,
    sdLabel: brush.sdLabel, interpretationNote: brush.note, interpretationNoteProvided: !!brush.note,
  };
}

function formatAge(years, months) {
  const parts = [];
  if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
  return parts.join(' ') || '0';
}
