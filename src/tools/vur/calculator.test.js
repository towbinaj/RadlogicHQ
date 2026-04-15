import { describe, it, expect } from 'vitest';
import { calculateVurVcug } from './calculator.js';

// Retroactive coverage for commit c7f6932 (laterality parse handler).
// See docs/test.md section 9.

describe('calculateVurVcug — single-side grade levels', () => {
  it.each([
    ['I',   'Grade I',   2],
    ['II',  'Grade II',  2],
    ['III', 'Grade III', 3],
    ['IV',  'Grade IV',  5],
    ['V',   'Grade V',   5],
  ])('grade %s maps to label "%s" and level %d', (grade, label, level) => {
    const r = calculateVurVcug({ side: 'right', grade });
    expect(r.bilateral).toBe(false);
    expect(r.gradeLabel).toBe(label);
    expect(r.level).toBe(level);
    expect(r.sideLabel).toBe('Right');
    expect(r.gradeProvided).toBe(true);
  });

  it('populates description from grade info', () => {
    const r = calculateVurVcug({ side: 'left', grade: 'IV' });
    expect(r.description).toMatch(/tortuous ureter/i);
  });
});

describe('calculateVurVcug — bilateral', () => {
  it('combines both sides into gradeLabel', () => {
    const r = calculateVurVcug({
      side: 'bilateral',
      rightGrade: 'III', leftGrade: 'II',
    });
    expect(r.bilateral).toBe(true);
    expect(r.sideLabel).toBe('Bilateral');
    expect(r.gradeLabel).toContain('Right: Grade III');
    expect(r.gradeLabel).toContain('Left: Grade II');
    expect(r.grade).toBe('R:III L:II');
    // Max(3, 2) = 3.
    expect(r.level).toBe(3);
    expect(r.rightProvided).toBe(true);
    expect(r.leftProvided).toBe(true);
  });

  it('picks max level when left is more severe', () => {
    const r = calculateVurVcug({
      side: 'bilateral',
      rightGrade: 'I', leftGrade: 'V',
    });
    expect(r.level).toBe(5);
  });

  it('bilateral with only one side filled', () => {
    const r = calculateVurVcug({
      side: 'bilateral',
      rightGrade: 'IV',
    });
    expect(r.bilateral).toBe(true);
    expect(r.gradeLabel).toBe('Right: Grade IV');
    expect(r.rightProvided).toBe(true);
    expect(r.leftProvided).toBe(false);
    expect(r.grade).toBe('IV');
    expect(r.level).toBe(5);
  });

  it('bilateral with no grades returns placeholder', () => {
    const r = calculateVurVcug({ side: 'bilateral' });
    expect(r.bilateral).toBe(true);
    expect(r.gradeLabel).toBe('--');
    expect(r.gradeProvided).toBe(false);
    expect(r.level).toBe(0);
  });
});

describe('calculateVurVcug — edge cases', () => {
  it('unset grade returns placeholder in single-side', () => {
    const r = calculateVurVcug({ side: 'right' });
    expect(r.gradeLabel).toBe('--');
    expect(r.gradeProvided).toBe(false);
    expect(r.level).toBe(0);
  });
});
