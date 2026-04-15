import { describe, it, expect } from 'vitest';
import { calculateBoneAge } from './calculator.js';

// Retroactive coverage for the MSK/orthopedic tool backlog.
// See docs/test.md section 9. As of the Sontag split, this file
// covers ONLY the Greulich & Pyle calculator. Sontag-specific
// tests (method label, ossification count passthrough) live in
// src/tools/bone-age-sontag/calculator.test.js.

describe('calculateBoneAge — concordance', () => {
  it('exact match → Concordant (level 1)', () => {
    const r = calculateBoneAge({
      chronoYears: 8, chronoMonths: 0,
      boneAgeYears: 8, boneAgeMonths: 0,
    });
    expect(r.difference).toBe(0);
    expect(r.interpretation).toBe('Concordant with chronological age');
    expect(r.level).toBe(1);
    expect(r.differenceLabel).toBe('+0.0 years');
  });

  it('+1 year → Concordant (boundary)', () => {
    const r = calculateBoneAge({
      chronoYears: 8, boneAgeYears: 9,
    });
    expect(r.difference).toBe(1);
    expect(r.interpretation).toBe('Concordant with chronological age');
    expect(r.level).toBe(1);
  });

  it('-1 year → Concordant (boundary)', () => {
    const r = calculateBoneAge({
      chronoYears: 8, boneAgeYears: 7,
    });
    expect(r.difference).toBe(-1);
    expect(r.level).toBe(1);
  });
});

describe('calculateBoneAge — advanced', () => {
  it('+1.1 years → Advanced (level 3)', () => {
    // 8y 0m chrono vs 9y 2m bone age → +1.17y rounds to +1.2
    const r = calculateBoneAge({
      chronoYears: 8, chronoMonths: 0,
      boneAgeYears: 9, boneAgeMonths: 2,
    });
    expect(r.difference).toBe(1.2);
    expect(r.interpretation).toMatch(/Advanced by approximately 1.2 years/);
    expect(r.level).toBe(3);
    expect(r.differenceLabel).toBe('+1.2 years');
  });

  it('large advance → level 3', () => {
    const r = calculateBoneAge({
      chronoYears: 6, boneAgeYears: 10,
    });
    expect(r.interpretation).toMatch(/Advanced by approximately 4.0 years/);
    expect(r.level).toBe(3);
  });
});

describe('calculateBoneAge — delayed', () => {
  it('-1.5 years → Delayed (level 3)', () => {
    const r = calculateBoneAge({
      chronoYears: 10, chronoMonths: 0,
      boneAgeYears: 8, boneAgeMonths: 6,
    });
    expect(r.difference).toBe(-1.5);
    expect(r.interpretation).toMatch(/Delayed by approximately 1.5 years/);
    expect(r.level).toBe(3);
  });

  it('differenceLabel includes sign for negative difference', () => {
    const r = calculateBoneAge({
      chronoYears: 10, boneAgeYears: 7,
    });
    expect(r.differenceLabel).toBe('-3.0 years');
  });
});

describe('calculateBoneAge — age formatting', () => {
  it('years + months → "8 years 6 months"', () => {
    const r = calculateBoneAge({ chronoYears: 8, chronoMonths: 6 });
    expect(r.chronoLabel).toBe('8 years 6 months');
  });

  it('singular units: 1 year 1 month', () => {
    const r = calculateBoneAge({ chronoYears: 1, chronoMonths: 1 });
    expect(r.chronoLabel).toBe('1 year 1 month');
  });

  it('months only', () => {
    const r = calculateBoneAge({ chronoMonths: 6 });
    expect(r.chronoLabel).toBe('6 months');
  });

  it('zero years zero months → "0"', () => {
    const r = calculateBoneAge({ chronoYears: 0, chronoMonths: 0 });
    expect(r.chronoLabel).toBe('0');
  });
});

describe('calculateBoneAge — metadata', () => {
  it('methodLabel is hardcoded to Greulich & Pyle', () => {
    const r = calculateBoneAge({ sex: 'male' });
    expect(r.methodLabel).toBe('Greulich & Pyle');
    expect(r.sexLabel).toBe('Male');
  });

  it('female sex label', () => {
    const r = calculateBoneAge({ sex: 'female' });
    expect(r.sexLabel).toBe('Female');
  });
});

describe('calculateBoneAge — incomplete', () => {
  it('no chronological age → no difference', () => {
    const r = calculateBoneAge({ boneAgeYears: 8 });
    expect(r.chronoProvided).toBe(false);
    expect(r.boneAgeProvided).toBe(true);
    expect(r.differenceProvided).toBe(false);
    expect(r.level).toBe(0);
  });

  it('no bone age → no difference', () => {
    const r = calculateBoneAge({ chronoYears: 8 });
    expect(r.boneAgeProvided).toBe(false);
    expect(r.differenceProvided).toBe(false);
    expect(r.level).toBe(0);
  });

  it('nothing provided → no label, no interpretation', () => {
    const r = calculateBoneAge({});
    expect(r.chronoLabel).toBe('');
    expect(r.boneAgeLabel).toBe('');
    expect(r.interpretation).toBe('');
    expect(r.differenceLabel).toBe('--');
    expect(r.level).toBe(0);
  });
});
