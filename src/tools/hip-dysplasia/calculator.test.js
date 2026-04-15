import { describe, it, expect } from 'vitest';
import { calculateHipDysplasia } from './calculator.js';

// Retroactive coverage for commit a466f33 (Phase 2 bilateral refactor).
// See docs/test.md section 9.

describe('calculateHipDysplasia — Graf single-side', () => {
  it('Type Ia returns mature label with level 1', () => {
    const r = calculateHipDysplasia(
      { side: 'right', grade: 'Ia', alpha: 62, beta: 50 },
      'graf',
    );
    expect(r.bilateral).toBe(false);
    expect(r.sideLabel).toBe('Right');
    expect(r.gradeLabel).toContain('Type Ia');
    expect(r.alphaLabel).toBe('62\u00b0');
    expect(r.betaLabel).toBe('50\u00b0');
    expect(r.level).toBe(1);
    expect(r.modeLabel).toBe('Graf');
  });

  it('Type Ib returns mature label with level 1', () => {
    const r = calculateHipDysplasia(
      { side: 'left', grade: 'Ib', alpha: 60, beta: 70 },
      'graf',
    );
    expect(r.gradeLabel).toContain('Type Ib');
    expect(r.level).toBe(1);
  });

  it('Type IIa+ returns level 2 (immature)', () => {
    const r = calculateHipDysplasia(
      { side: 'right', grade: 'IIa-plus', alpha: 55 },
      'graf',
    );
    expect(r.gradeLabel).toContain('Type IIa+');
    expect(r.level).toBe(2);
  });

  it('Type IIa- returns level 2', () => {
    const r = calculateHipDysplasia(
      { side: 'right', grade: 'IIa-minus', alpha: 55 },
      'graf',
    );
    expect(r.level).toBe(2);
  });

  it('Type IIc returns level 4 (critical)', () => {
    const r = calculateHipDysplasia(
      { side: 'right', grade: 'IIc', alpha: 45 },
      'graf',
    );
    expect(r.gradeLabel).toContain('Type IIc');
    expect(r.level).toBe(4);
  });

  it('Type IV returns level 4 (dislocated)', () => {
    const r = calculateHipDysplasia(
      { side: 'left', grade: 'IV' },
      'graf',
    );
    expect(r.gradeLabel).toContain('Type IV');
    expect(r.level).toBe(4);
  });
});

describe('calculateHipDysplasia — AAOS single-side', () => {
  it('normal returns level 1', () => {
    const r = calculateHipDysplasia(
      { side: 'right', grade: 'normal' },
      'aaos',
    );
    expect(r.gradeLabel).toBe('Normal');
    expect(r.modeLabel).toBe('AAOS');
    expect(r.level).toBe(1);
  });

  it('dysplastic returns level 2', () => {
    const r = calculateHipDysplasia(
      { side: 'left', grade: 'dysplastic' },
      'aaos',
    );
    expect(r.gradeLabel).toBe('Dysplastic');
    expect(r.level).toBe(2);
  });

  it('subluxed returns level 4', () => {
    const r = calculateHipDysplasia(
      { side: 'left', grade: 'subluxed' },
      'aaos',
    );
    expect(r.level).toBe(4);
  });

  it('dislocated returns level 4', () => {
    const r = calculateHipDysplasia(
      { side: 'right', grade: 'dislocated' },
      'aaos',
    );
    expect(r.gradeLabel).toBe('Dislocated');
    expect(r.level).toBe(4);
  });
});

describe('calculateHipDysplasia — bilateral', () => {
  it('combines Graf grades into one gradeLabel string', () => {
    const r = calculateHipDysplasia(
      {
        side: 'bilateral',
        rightGrade: 'Ib', leftGrade: 'IIc',
        rightAlpha: 60, leftAlpha: 45,
        rightBeta: 70, leftBeta: 72,
      },
      'graf',
    );
    expect(r.bilateral).toBe(true);
    expect(r.sideLabel).toBe('Bilateral');
    expect(r.gradeLabel).toContain('Right: Type Ib');
    expect(r.gradeLabel).toContain('Left: Type IIc');
    expect(r.alphaLabel).toBe('Right 60\u00b0, Left 45\u00b0');
    expect(r.betaLabel).toBe('Right 70\u00b0, Left 72\u00b0');
    // More severe side (left IIc → level 4) drives overall level.
    expect(r.level).toBe(4);
    expect(r.rightGradeProvided).toBe(true);
    expect(r.leftGradeProvided).toBe(true);
  });

  it('bilateral with only right filled still categorizes', () => {
    const r = calculateHipDysplasia(
      {
        side: 'bilateral',
        rightGrade: 'IV', rightAlpha: 30,
      },
      'graf',
    );
    expect(r.bilateral).toBe(true);
    expect(r.gradeLabel).toBe('Right: Type IV — Dislocated');
    expect(r.alphaLabel).toBe('Right 30\u00b0');
    expect(r.rightGradeProvided).toBe(true);
    expect(r.leftGradeProvided).toBe(false);
    expect(r.level).toBe(4);
  });

  it('bilateral AAOS with asymmetric severity picks max level', () => {
    const r = calculateHipDysplasia(
      {
        side: 'bilateral',
        rightGrade: 'normal', leftGrade: 'dislocated',
      },
      'aaos',
    );
    expect(r.gradeLabel).toContain('Right: Normal');
    expect(r.gradeLabel).toContain('Left: Dislocated');
    expect(r.level).toBe(4);
  });

  it('bilateral with no grades returns placeholders', () => {
    const r = calculateHipDysplasia(
      { side: 'bilateral' },
      'graf',
    );
    expect(r.bilateral).toBe(true);
    expect(r.gradeLabel).toBe('--');
    expect(r.alphaLabel).toBe('');
    expect(r.betaLabel).toBe('');
    expect(r.gradeProvided).toBe(false);
    expect(r.level).toBe(0);
  });
});

describe('calculateHipDysplasia — edge cases', () => {
  it('unset grade returns placeholder in single-side', () => {
    const r = calculateHipDysplasia(
      { side: 'right' },
      'graf',
    );
    expect(r.gradeLabel).toBe('--');
    expect(r.gradeProvided).toBe(false);
    expect(r.level).toBe(0);
  });

  it('single-side with null angles omits angle labels', () => {
    const r = calculateHipDysplasia(
      { side: 'right', grade: 'Ia' },
      'graf',
    );
    expect(r.alphaProvided).toBe(false);
    expect(r.alphaLabel).toBe('');
    expect(r.betaProvided).toBe(false);
    expect(r.betaLabel).toBe('');
  });
});
