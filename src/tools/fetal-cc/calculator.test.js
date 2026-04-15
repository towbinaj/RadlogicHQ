import { describe, it, expect } from 'vitest';
import { calculateFetalCC } from './calculator.js';
import { expectedCCLength } from './definition.js';

// Retroactive coverage for the measurement tool backlog.
// See docs/test.md section 9.

describe('calculateFetalCC — GA validation', () => {
  it('GA 20 (lower boundary) accepted', () => {
    const r = calculateFetalCC({ ga: 20, ccLength: expectedCCLength(20) });
    expect(r.gaProvided).toBe(true);
    expect(r.expectedProvided).toBe(true);
  });

  it('GA 40 (upper boundary) accepted', () => {
    const r = calculateFetalCC({ ga: 40, ccLength: expectedCCLength(40) });
    expect(r.gaProvided).toBe(true);
  });

  it('GA 19 (below range) → not provided', () => {
    const r = calculateFetalCC({ ga: 19, ccLength: 25 });
    expect(r.gaProvided).toBe(false);
    expect(r.interpretation).toBe('');
  });

  it('GA 41 (above range) → not provided', () => {
    const r = calculateFetalCC({ ga: 41, ccLength: 45 });
    expect(r.gaProvided).toBe(false);
  });
});

describe('calculateFetalCC — diff → interpretation', () => {
  it('exact expected → Within normal range (level 1)', () => {
    const expected = expectedCCLength(25);
    const r = calculateFetalCC({ ga: 25, ccLength: expected });
    expect(r.interpretation).toBe('Within normal range');
    expect(r.level).toBe(1);
  });

  it('+6 mm → Within normal range (boundary)', () => {
    const r = calculateFetalCC({
      ga: 25, ccLength: expectedCCLength(25) + 6,
    });
    expect(r.interpretation).toBe('Within normal range');
    expect(r.level).toBe(1);
  });

  it('+7 mm → Above expected mean (level 2)', () => {
    const r = calculateFetalCC({
      ga: 25, ccLength: expectedCCLength(25) + 7,
    });
    expect(r.interpretation).toMatch(/Above expected/);
    expect(r.level).toBe(2);
  });

  it('-7 mm → Below expected, CC hypogenesis flag (level 3)', () => {
    const r = calculateFetalCC({
      ga: 25, ccLength: expectedCCLength(25) - 7,
    });
    expect(r.interpretation).toMatch(/hypogenesis/i);
    expect(r.level).toBe(3);
  });

  it('diffLabel includes sign', () => {
    const r = calculateFetalCC({
      ga: 25, ccLength: expectedCCLength(25) + 2,
    });
    expect(r.diffLabel).toBe('+2 mm');
  });
});

describe('calculateFetalCC — absent flag', () => {
  it('absent=true overrides level to 5', () => {
    const r = calculateFetalCC({ ga: 25, absent: true });
    expect(r.absent).toBe(true);
    expect(r.ccLabel).toBe('Absent');
    expect(r.level).toBe(5);
    expect(r.ccProvided).toBe(true);
  });

  it('absent=true with ccLength also present → level stays 5', () => {
    const r = calculateFetalCC({ ga: 25, absent: true, ccLength: 30 });
    expect(r.level).toBe(5);
  });
});

describe('calculateFetalCC — incomplete', () => {
  it('no ccLength and not absent → placeholder, level 0', () => {
    const r = calculateFetalCC({ ga: 25 });
    expect(r.ccLabel).toBe('--');
    expect(r.ccProvided).toBe(false);
    expect(r.level).toBe(0);
  });

  it('no GA → no expected, no interpretation', () => {
    const r = calculateFetalCC({ ccLength: 30 });
    expect(r.expectedProvided).toBe(false);
    expect(r.interpretation).toBe('');
    expect(r.level).toBe(0);
  });
});
