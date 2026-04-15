import { describe, it, expect } from 'vitest';
import { calculateLegLength, calculateSegmental } from './calculator.js';

// Retroactive coverage for the measurement tool backlog.
// See docs/test.md section 9.

describe('calculateLegLength — total mode discrepancy', () => {
  it('right longer than left → right longer label', () => {
    const r = calculateLegLength({ rightLength: 85.5, leftLength: 83.0 });
    expect(r.bothProvided).toBe(true);
    expect(r.longerSide).toBe('right');
    expect(r.discrepancy).toBeCloseTo(2.5, 1);
    expect(r.discrepancyLabel).toContain('right');
    expect(r.discrepancyLabel).toContain('2.5 cm');
  });

  it('left longer than right → left longer label', () => {
    const r = calculateLegLength({ rightLength: 80, leftLength: 82 });
    expect(r.longerSide).toBe('left');
    expect(r.discrepancy).toBe(2);
    expect(r.discrepancyLabel).toContain('left');
  });

  it('equal lengths → "equal" longerSide + "equal in length" label', () => {
    const r = calculateLegLength({ rightLength: 80, leftLength: 80 });
    expect(r.longerSide).toBe('equal');
    expect(r.discrepancy).toBe(0);
    expect(r.discrepancyLabel).toMatch(/equal in length/i);
  });

  it('only right provided → no discrepancy computed', () => {
    const r = calculateLegLength({ rightLength: 80 });
    expect(r.rightLengthProvided).toBe(true);
    expect(r.leftLengthProvided).toBe(false);
    expect(r.bothProvided).toBe(false);
    expect(r.discrepancy).toBeNull();
  });

  it('nothing provided → all flags false', () => {
    const r = calculateLegLength({});
    expect(r.bothProvided).toBe(false);
    expect(r.longerSide).toBe('');
    expect(r.discrepancyLabel).toBe('');
  });
});

describe('calculateLegLength — alignment + physes labels', () => {
  it('maps alignment IDs to labels', () => {
    const r = calculateLegLength({
      rightAlignment: 'mild-valgus', leftAlignment: 'severe-varus',
    });
    expect(r.rightAlignmentLabel).toBe('mild valgus');
    expect(r.leftAlignmentLabel).toBe('severe varus');
    expect(r.rightAlignmentProvided).toBe(true);
  });

  it('unknown alignment ID → empty label', () => {
    const r = calculateLegLength({ rightAlignment: 'xyz' });
    expect(r.rightAlignmentLabel).toBe('');
  });

  it('maps physes state', () => {
    expect(calculateLegLength({ physes: 'open' }).physesLabel).toBe('open');
    expect(calculateLegLength({ physes: 'closed' }).physesLabel).toBe('closed');
  });
});

describe('calculateSegmental — femur + tibia sums', () => {
  it('computes per-leg totals and per-segment diffs', () => {
    const r = calculateSegmental({
      rightFemur: 45.0, leftFemur: 44.5,
      rightTibia: 38.5, leftTibia: 38.0,
    });
    expect(r.rightTotal).toBeCloseTo(83.5, 1);
    expect(r.leftTotal).toBeCloseTo(82.5, 1);
    expect(r.femurDiff).toBeCloseTo(0.5, 1);
    expect(r.tibiaDiff).toBeCloseTo(0.5, 1);
    expect(r.totalDiff).toBeCloseTo(1.0, 1);
    expect(r.longerSide).toBe('right');
    expect(r.bothFemur).toBe(true);
    expect(r.bothTibia).toBe(true);
    expect(r.bothTotal).toBe(true);
  });

  it('missing tibia on one side → no total for that leg', () => {
    const r = calculateSegmental({
      rightFemur: 45, leftFemur: 44,
      rightTibia: 38,
    });
    expect(r.rightTotal).toBeCloseTo(83, 1);
    expect(r.leftTotal).toBeNull();
    expect(r.bothTotal).toBe(false);
    expect(r.femurDiff).toBeCloseTo(1, 1);
    expect(r.tibiaDiff).toBeNull();
  });

  it('left-dominant segmental discrepancy', () => {
    const r = calculateSegmental({
      rightFemur: 40, leftFemur: 42,
      rightTibia: 35, leftTibia: 36,
    });
    expect(r.longerSide).toBe('left');
    expect(r.totalDiff).toBeCloseTo(3, 1);
  });
});
