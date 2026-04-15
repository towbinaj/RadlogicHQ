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
  if (hasChrono && boneAgeTotal != null) {
    difference = Math.round((boneAgeTotal - chronoTotal) * 10) / 10;
    if (Math.abs(difference) <= 1) {
      interpretation = 'Concordant with chronological age';
      level = 1;
    } else if (difference > 1) {
      interpretation = `Advanced by approximately ${Math.abs(difference).toFixed(1)} years`;
      level = 3;
    } else {
      interpretation = `Delayed by approximately ${Math.abs(difference).toFixed(1)} years`;
      level = 3;
    }
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
  };
}

function formatAge(years, months) {
  const parts = [];
  if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
  return parts.join(' ') || '0';
}
