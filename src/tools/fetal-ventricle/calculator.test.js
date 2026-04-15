import { describe, it, expect } from 'vitest';
import { calculateFetalVentricle } from './calculator.js';

// Retroactive coverage for commit 6e6515b (Phase 2 bilateral refactor).
// See docs/test.md section 9.

describe('calculateFetalVentricle — single-side category boundaries', () => {
  it('width 8 mm → Normal (<10 mm), level 1', () => {
    const r = calculateFetalVentricle({ side: 'right', width: 8 });
    expect(r.bilateral).toBe(false);
    expect(r.category).toBe('Normal');
    expect(r.categoryLabel).toBe('Normal (<10 mm)');
    expect(r.level).toBe(1);
    expect(r.widthLabel).toBe('8 mm');
    expect(r.sideLabel).toBe('Right');
  });

  it('width 9.9 mm → Normal (just under threshold)', () => {
    const r = calculateFetalVentricle({ side: 'right', width: 9.9 });
    expect(r.category).toBe('Normal');
    expect(r.level).toBe(1);
  });

  it('width 10 mm → Mild (10–12 mm boundary)', () => {
    const r = calculateFetalVentricle({ side: 'right', width: 10 });
    expect(r.category).toBe('Mild ventriculomegaly');
    expect(r.categoryLabel).toContain('Mild');
    expect(r.level).toBe(2);
  });

  it('width 11 mm → Mild', () => {
    const r = calculateFetalVentricle({ side: 'left', width: 11 });
    expect(r.category).toBe('Mild ventriculomegaly');
    expect(r.level).toBe(2);
  });

  it('width 12 mm → Moderate (mild→moderate boundary)', () => {
    const r = calculateFetalVentricle({ side: 'right', width: 12 });
    expect(r.category).toBe('Moderate ventriculomegaly');
    expect(r.level).toBe(3);
  });

  it('width 14.9 mm → Moderate (just under severe)', () => {
    const r = calculateFetalVentricle({ side: 'right', width: 14.9 });
    expect(r.category).toBe('Moderate ventriculomegaly');
    expect(r.level).toBe(3);
  });

  it('width 15 mm → Severe (moderate→severe boundary)', () => {
    const r = calculateFetalVentricle({ side: 'right', width: 15 });
    expect(r.category).toBe('Severe ventriculomegaly');
    expect(r.categoryLabel).toContain('Severe');
    expect(r.level).toBe(5);
  });

  it('width 25 mm → Severe', () => {
    const r = calculateFetalVentricle({ side: 'right', width: 25 });
    expect(r.category).toBe('Severe ventriculomegaly');
    expect(r.level).toBe(5);
  });
});

describe('calculateFetalVentricle — bilateral', () => {
  it('combines widths into widthLabel and picks more severe category', () => {
    const r = calculateFetalVentricle({
      side: 'bilateral',
      rightWidth: 11, leftWidth: 13,
    });
    expect(r.bilateral).toBe(true);
    expect(r.sideLabel).toBe('Bilateral');
    expect(r.widthLabel).toBe('Right 11 mm, Left 13 mm');
    // Left is moderate (13 mm) → overall moderate.
    expect(r.category).toBe('Moderate ventriculomegaly');
    expect(r.level).toBe(3);
    expect(r.rightCategory).toBe('Mild ventriculomegaly');
    expect(r.leftCategory).toBe('Moderate ventriculomegaly');
    expect(r.rightWidthProvided).toBe(true);
    expect(r.leftWidthProvided).toBe(true);
  });

  it('right-dominant severity sets overall category to right', () => {
    const r = calculateFetalVentricle({
      side: 'bilateral',
      rightWidth: 16, leftWidth: 8,
    });
    expect(r.category).toBe('Severe ventriculomegaly');
    expect(r.level).toBe(5);
  });

  it('both normal returns Normal category', () => {
    const r = calculateFetalVentricle({
      side: 'bilateral',
      rightWidth: 8, leftWidth: 9,
    });
    expect(r.category).toBe('Normal');
    expect(r.level).toBe(1);
  });

  it('bilateral with only right filled uses right side for overall', () => {
    const r = calculateFetalVentricle({
      side: 'bilateral',
      rightWidth: 11,
    });
    expect(r.bilateral).toBe(true);
    expect(r.widthLabel).toBe('Right 11 mm');
    expect(r.rightWidthProvided).toBe(true);
    expect(r.leftWidthProvided).toBe(false);
    expect(r.category).toBe('Mild ventriculomegaly');
    expect(r.level).toBe(2);
  });

  it('bilateral with no widths returns placeholder', () => {
    const r = calculateFetalVentricle({ side: 'bilateral' });
    expect(r.bilateral).toBe(true);
    expect(r.widthLabel).toBe('--');
    expect(r.widthProvided).toBe(false);
    expect(r.category).toBe('');
    expect(r.level).toBe(0);
  });
});

describe('calculateFetalVentricle — edge cases', () => {
  it('unset width returns placeholder in single-side', () => {
    const r = calculateFetalVentricle({ side: 'right' });
    expect(r.widthLabel).toBe('--');
    expect(r.widthProvided).toBe(false);
    expect(r.categoryLabel).toBe('');
    expect(r.level).toBe(0);
  });

  it('negative width is treated as unset', () => {
    const r = calculateFetalVentricle({ side: 'right', width: -5 });
    expect(r.widthProvided).toBe(false);
    expect(r.category).toBe('');
    expect(r.level).toBe(0);
  });

  it('GA renders weeks label when provided', () => {
    const r = calculateFetalVentricle({ side: 'right', width: 8, ga: 22 });
    expect(r.gaLabel).toBe('22 weeks');
    expect(r.gaProvided).toBe(true);
  });
});
