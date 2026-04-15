import { describe, it, expect } from 'vitest';
import { calculateBoneAgeSontag } from './calculator.js';

// Sontag bone age is now a separate calculator from the Greulich & Pyle
// hand-atlas method. The Sontag method (Sontag/Snell/Anderson 1939) derives
// bone age from the number of ossification centers in infancy, so the
// calculation pathway will eventually diverge from G&P: instead of the user
// typing a bone age in years/months, the user will enter an ossification
// count and the calculator will look it up in a sex-specific table.
//
// For now this file locks in CURRENT behavior (manual years/months input
// with Sontag method label) plus `it.todo()` scaffolding for the future
// count → bone-age lookup. When the user implements the Sontag table, the
// failing tests below (currently todo placeholders) become the test-first
// failing cases for the new logic.
//
// See docs/test.md section 10 for the test-first rule.

describe('calculateBoneAgeSontag — concordance (manual BA entry, current behavior)', () => {
  it('exact match → Concordant (level 1)', () => {
    const r = calculateBoneAgeSontag({
      chronoYears: 1, chronoMonths: 0,
      boneAgeYears: 1, boneAgeMonths: 0,
    });
    expect(r.difference).toBe(0);
    expect(r.interpretation).toBe('Concordant with chronological age');
    expect(r.level).toBe(1);
  });

  it('+1 year → still Concordant at the boundary', () => {
    const r = calculateBoneAgeSontag({
      chronoYears: 2, boneAgeYears: 3,
    });
    expect(r.difference).toBe(1);
    expect(r.level).toBe(1);
  });
});

describe('calculateBoneAgeSontag — advanced / delayed', () => {
  it('+1.5 years → Advanced (level 3)', () => {
    // chrono 1y 0m (1.0) vs bone age 2y 6m (2.5) → +1.5
    const r = calculateBoneAgeSontag({
      chronoYears: 1, chronoMonths: 0,
      boneAgeYears: 2, boneAgeMonths: 6,
    });
    expect(r.difference).toBe(1.5);
    expect(r.interpretation).toMatch(/Advanced by approximately 1.5 years/);
    expect(r.level).toBe(3);
  });

  it('-1.5 years → Delayed (level 3)', () => {
    const r = calculateBoneAgeSontag({
      chronoYears: 3, chronoMonths: 0,
      boneAgeYears: 1, boneAgeMonths: 6,
    });
    expect(r.difference).toBe(-1.5);
    expect(r.interpretation).toMatch(/Delayed by approximately 1.5 years/);
    expect(r.level).toBe(3);
  });

  it('differenceLabel carries sign + one decimal', () => {
    const r = calculateBoneAgeSontag({
      chronoYears: 2, boneAgeYears: 4,
    });
    expect(r.differenceLabel).toBe('+2.0 years');
  });
});

describe('calculateBoneAgeSontag — metadata', () => {
  it('methodLabel is hardcoded to Sontag', () => {
    const r = calculateBoneAgeSontag({});
    expect(r.methodLabel).toBe('Sontag');
  });

  it('sexLabel populated for male/female', () => {
    expect(calculateBoneAgeSontag({ sex: 'male' }).sexLabel).toBe('Male');
    expect(calculateBoneAgeSontag({ sex: 'female' }).sexLabel).toBe('Female');
  });

  it('ossificationCount passthrough for display, including 0', () => {
    const r0 = calculateBoneAgeSontag({ ossificationCount: 0 });
    expect(r0.ossificationCount).toBe(0);
    expect(r0.ossificationProvided).toBe(true);

    const r4 = calculateBoneAgeSontag({ ossificationCount: 4 });
    expect(r4.ossificationCount).toBe(4);
  });

  it('chronoLabel formats infancy ages (months only)', () => {
    const r = calculateBoneAgeSontag({ chronoMonths: 9 });
    expect(r.chronoLabel).toBe('9 months');
  });

  it('chronoLabel formats "1 year 1 month" with singular units', () => {
    const r = calculateBoneAgeSontag({ chronoYears: 1, chronoMonths: 1 });
    expect(r.chronoLabel).toBe('1 year 1 month');
  });
});

describe('calculateBoneAgeSontag — incomplete', () => {
  it('no input → level 0, placeholder labels, no interpretation', () => {
    const r = calculateBoneAgeSontag({});
    expect(r.chronoLabel).toBe('');
    expect(r.boneAgeLabel).toBe('');
    expect(r.differenceLabel).toBe('--');
    expect(r.interpretation).toBe('');
    expect(r.level).toBe(0);
  });

  it('chrono only (no BA) → no difference', () => {
    const r = calculateBoneAgeSontag({ chronoYears: 1 });
    expect(r.chronoProvided).toBe(true);
    expect(r.boneAgeProvided).toBe(false);
    expect(r.differenceProvided).toBe(false);
    expect(r.level).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Scaffolding for the future ossification-count → bone-age lookup.
// When the Sontag table lands, fill in the expected count→age values and
// remove the `.todo` marker. Each test below should then be a failing
// assertion until the lookup function is implemented (test-first rule).
//
// Reference tables to consult when filling these in:
//   Sontag LW, Snell D, Anderson M. Rate of appearance of ossification
//   centers from birth to the age of five years. Am J Dis Child 1939.
// ---------------------------------------------------------------------------
describe('calculateBoneAgeSontag — ossification count → bone age lookup (future)', () => {
  it.todo('male count 3 at birth → ~0 months bone age');
  it.todo('male count 6 → ~6 months bone age (boundary between age brackets)');
  it.todo('male count 9 → ~12 months bone age');
  it.todo('female count matches male count - 1 offset (female advanced)');
  it.todo('count 0 → neonatal / preterm bone age');
  it.todo('count above max table entry → clamped to oldest bracket');
  it.todo('explicit boneAgeYears/Months overrides the count lookup');
  it.todo('sex unset → uses combined average (or flag as incomplete)');
});
