import { describe, it, expect } from 'vitest';
import { calculateKL } from './calculator.js';

// Retroactive coverage for commit ee55036 (Phase 2 bilateral refactor).
// See docs/test.md section 9.

describe('calculateKL — single-side grade boundaries', () => {
  it.each([
    ['0', 'Grade 0 — Normal', 1],
    ['1', 'Grade 1 — Doubtful', 1],
    ['2', 'Grade 2 — Minimal', 2],
    ['3', 'Grade 3 — Moderate', 3],
    ['4', 'Grade 4 — Severe', 5],
  ])('grade %s maps to label "%s" and level %d', (grade, label, level) => {
    const r = calculateKL({ side: 'right', grade, joint: 'knee' });
    expect(r.bilateral).toBe(false);
    expect(r.gradeLabel).toBe(label);
    expect(r.level).toBe(level);
    expect(r.jointLabel).toBe('Knee');
    expect(r.sideLabel).toBe('Right');
  });

  it('populates findings from grade info', () => {
    const r = calculateKL({ side: 'left', grade: '3', joint: 'hip' });
    expect(r.findings).toMatch(/joint space narrowing/i);
    expect(r.jointLabel).toBe('Hip');
  });
});

describe('calculateKL — bilateral', () => {
  it('combines both sides into gradeLabel', () => {
    const r = calculateKL({
      side: 'bilateral',
      rightGrade: '3', leftGrade: '2',
      joint: 'knee',
    });
    expect(r.bilateral).toBe(true);
    expect(r.sideLabel).toBe('Bilateral');
    expect(r.gradeLabel).toContain('Right: Grade 3');
    expect(r.gradeLabel).toContain('Left: Grade 2');
    expect(r.jointLabel).toBe('Knee');
    // Max of levels 3 and 2.
    expect(r.level).toBe(3);
    expect(r.rightGradeProvided).toBe(true);
    expect(r.leftGradeProvided).toBe(true);
    // grade compact form.
    expect(r.grade).toBe('R:3 L:2');
  });

  it('picks max level when left is more severe', () => {
    const r = calculateKL({
      side: 'bilateral',
      rightGrade: '1', leftGrade: '4',
      joint: 'knee',
    });
    expect(r.level).toBe(5);
  });

  it('bilateral with only right side filled', () => {
    const r = calculateKL({
      side: 'bilateral',
      rightGrade: '4',
      joint: 'hip',
    });
    expect(r.bilateral).toBe(true);
    expect(r.gradeLabel).toBe('Right: Grade 4 — Severe');
    expect(r.rightGradeProvided).toBe(true);
    expect(r.leftGradeProvided).toBe(false);
    expect(r.grade).toBe('4');
    expect(r.level).toBe(5);
  });

  it('bilateral with no grades returns placeholder', () => {
    const r = calculateKL({ side: 'bilateral', joint: 'knee' });
    expect(r.bilateral).toBe(true);
    expect(r.gradeLabel).toBe('--');
    expect(r.gradeProvided).toBe(false);
    expect(r.level).toBe(0);
  });
});

describe('calculateKL — edge cases', () => {
  it('unset grade returns placeholder in single-side', () => {
    const r = calculateKL({ side: 'right', joint: 'knee' });
    expect(r.gradeLabel).toBe('--');
    expect(r.gradeProvided).toBe(false);
    expect(r.level).toBe(0);
  });

  it('unset joint leaves jointLabel empty', () => {
    const r = calculateKL({ side: 'right', grade: '2' });
    expect(r.jointLabel).toBe('');
    expect(r.jointProvided).toBe(false);
  });
});

describe('KL impression wording (audit 2026-11-28)', () => {
  it('grade 0 and 1 are not called osteoarthritis', () => {
    expect(calculateKL({ side: 'right', joint: 'knee', grade: '0' }).impressionText)
      .toBe('No radiographic osteoarthritis of the right knee (Kellgren-Lawrence grade 0).');
    expect(calculateKL({ side: 'right', joint: 'knee', grade: '1' }).impressionText)
      .toBe('Doubtful osteoarthritis of the right knee (Kellgren-Lawrence grade 1).');
  });
  it('grade 2-4 and bilateral', () => {
    expect(calculateKL({ side: 'left', joint: 'hip', grade: '3' }).impressionText)
      .toBe('Left hip osteoarthritis, Kellgren-Lawrence grade 3 (moderate).');
    expect(calculateKL({ side: 'bilateral', joint: 'knee', rightGrade: '3', leftGrade: '0' }).impressionText)
      .toBe('Kellgren-Lawrence grading, knees: right grade 3 (moderate), left grade 0 (normal).');
    expect(calculateKL({}).impressionText).toBe('');
  });
});
