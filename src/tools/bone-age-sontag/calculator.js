/**
 * Sontag bone age calculator.
 *
 * Reference: Sontag LW, Snell D, Anderson M. Rate of appearance of
 * ossification centers from birth to the age of five years.
 * Am J Dis Child 1939.
 *
 * Currently operates on manually-entered boneAgeYears / boneAgeMonths,
 * mirroring the Greulich & Pyle flow. The ossificationCount field is
 * captured for display only.
 *
 * TODO: replace the manual bone-age entry with a sex-specific
 * count → bone-age lookup against the Sontag 1939 tables. When that
 * lands, the `it.todo(...)` cases in calculator.test.js become the
 * test-first failing scaffolds for the new logic. See docs/test.md
 * section 10.
 */

import { interpretBoneAge } from '../bone-age/brush.js';

export function calculateBoneAgeSontag(formState) {
  const {
    sex,
    chronoYears,
    chronoMonths,
    boneAgeYears,
    boneAgeMonths,
    ossificationCount,
  } = formState;

  const sexLabels = { male: 'Male', female: 'Female' };

  const hasChrono = chronoYears != null || chronoMonths != null;
  const chronoTotal = (chronoYears || 0) + (chronoMonths || 0) / 12;
  const chronoLabel = hasChrono
    ? formatAge(chronoYears || 0, chronoMonths || 0)
    : '';

  let boneAgeTotal = null;
  let boneAgeLabel = '';
  if (boneAgeYears != null || boneAgeMonths != null) {
    boneAgeTotal = (boneAgeYears || 0) + (boneAgeMonths || 0) / 12;
    boneAgeLabel = formatAge(boneAgeYears || 0, boneAgeMonths || 0);
  }

  let difference = null;
  let interpretation = '';
  let level = 0;
  let brush = interpretBoneAge(sex, null, null);
  if (hasChrono && boneAgeTotal != null) {
    difference = Math.round((boneAgeTotal - chronoTotal) * 10) / 10;
    // Greulich & Pyle Brush Foundation SD by age and sex (CA +/- 2 SD).
    brush = interpretBoneAge(sex, chronoTotal * 12, boneAgeTotal * 12);
    interpretation = brush.interpretation;
    level = brush.level;
  }

  return {
    methodLabel: 'Sontag',
    sexLabel: sexLabels[sex] || '',
    sexProvided: !!sex,
    chronoLabel,
    chronoProvided: hasChrono,
    boneAgeLabel,
    boneAgeProvided: boneAgeTotal != null,
    ossificationCount: ossificationCount != null ? ossificationCount : null,
    ossificationProvided: ossificationCount != null,
    difference,
    differenceLabel: difference != null
      ? `${difference >= 0 ? '+' : ''}${difference.toFixed(1)} years`
      : '--',
    differenceProvided: difference != null,
    interpretation,
    interpretationProvided: !!interpretation,
    level,
    zLabel: brush.zLabel,
    normalRangeLabel: brush.normalRangeLabel,
    normalRangeProvided: !!brush.normalRangeLabel,
    sdLabel: brush.sdLabel,
    interpretationNote: brush.note,
    interpretationNoteProvided: !!brush.note,
  };
}

function formatAge(years, months) {
  const parts = [];
  if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
  return parts.join(' ') || '0';
}
