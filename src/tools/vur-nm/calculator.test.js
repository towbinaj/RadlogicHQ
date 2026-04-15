import { describe, it, expect } from 'vitest';
import { calculateVurNm } from './calculator.js';

// Retroactive coverage for commit c7f6932 (laterality parse handler).
// See docs/test.md section 9.

describe('calculateVurNm — single-side grade levels', () => {
  it.each([
    ['mild',     'Mild',     2],
    ['moderate', 'Moderate', 3],
    ['severe',   'Severe',   5],
  ])('grade %s maps to label "%s" and level %d', (grade, label, level) => {
    const r = calculateVurNm({ side: 'right', grade });
    expect(r.bilateral).toBe(false);
    expect(r.gradeLabel).toBe(label);
    expect(r.level).toBe(level);
    expect(r.sideLabel).toBe('Right');
  });

  it('populates description from grade info', () => {
    const r = calculateVurNm({ side: 'left', grade: 'severe' });
    expect(r.description).toMatch(/dilated ureter/i);
  });
});

describe('calculateVurNm — bilateral', () => {
  it('combines both sides into gradeLabel', () => {
    const r = calculateVurNm({
      side: 'bilateral',
      rightGrade: 'moderate', leftGrade: 'mild',
    });
    expect(r.bilateral).toBe(true);
    expect(r.sideLabel).toBe('Bilateral');
    expect(r.gradeLabel).toContain('Right: Moderate');
    expect(r.gradeLabel).toContain('Left: Mild');
    expect(r.grade).toBe('R:moderate L:mild');
    expect(r.level).toBe(3);
  });

  it('picks max level when right is severe', () => {
    const r = calculateVurNm({
      side: 'bilateral',
      rightGrade: 'severe', leftGrade: 'mild',
    });
    expect(r.level).toBe(5);
  });

  it('bilateral with only left filled', () => {
    const r = calculateVurNm({
      side: 'bilateral',
      leftGrade: 'moderate',
    });
    expect(r.bilateral).toBe(true);
    expect(r.gradeLabel).toBe('Left: Moderate');
    expect(r.rightProvided).toBe(false);
    expect(r.leftProvided).toBe(true);
    expect(r.level).toBe(3);
  });

  it('bilateral with no grades returns placeholder', () => {
    const r = calculateVurNm({ side: 'bilateral' });
    expect(r.bilateral).toBe(true);
    expect(r.gradeLabel).toBe('--');
    expect(r.gradeProvided).toBe(false);
    expect(r.level).toBe(0);
  });
});

describe('calculateVurNm — edge cases', () => {
  it('unset grade returns placeholder in single-side', () => {
    const r = calculateVurNm({ side: 'right' });
    expect(r.gradeLabel).toBe('--');
    expect(r.gradeProvided).toBe(false);
    expect(r.level).toBe(0);
  });
});
