import { describe, it, expect } from 'vitest';
import { calculateFetalPF } from './calculator.js';
import { expectedVermianHeight } from './definition.js';

// Retroactive coverage for the measurement tool backlog.
// See docs/test.md section 9.

describe('calculateFetalPF — GA validation', () => {
  it('GA 17 (lower boundary) accepted', () => {
    const r = calculateFetalPF({ ga: 17 });
    expect(r.gaProvided).toBe(true);
    expect(r.gaLabel).toBe('17 weeks');
  });

  it('GA 40 (upper boundary) accepted', () => {
    const r = calculateFetalPF({ ga: 40 });
    expect(r.gaProvided).toBe(true);
  });

  it('GA 16 (below range) rejected', () => {
    const r = calculateFetalPF({ ga: 16, vermianHeight: 10 });
    expect(r.gaProvided).toBe(false);
    expect(r.vhInterpretation).toBe('');
  });

  it('GA 41 rejected', () => {
    expect(calculateFetalPF({ ga: 41 }).gaProvided).toBe(false);
  });
});

describe('calculateFetalPF — Vermian height diff', () => {
  it('exact expected → Within normal range', () => {
    const expected = expectedVermianHeight(25);
    const r = calculateFetalPF({ ga: 25, vermianHeight: expected });
    expect(r.vhInterpretation).toBe('Within normal range');
  });

  it('+3 mm → Within normal range (boundary)', () => {
    const r = calculateFetalPF({
      ga: 25, vermianHeight: expectedVermianHeight(25) + 3,
    });
    expect(r.vhInterpretation).toBe('Within normal range');
  });

  it('+4 mm → Above expected', () => {
    const r = calculateFetalPF({
      ga: 25, vermianHeight: expectedVermianHeight(25) + 4,
    });
    expect(r.vhInterpretation).toBe('Above expected');
  });

  it('-4 mm → vermian hypoplasia flag (contributes level 3)', () => {
    const r = calculateFetalPF({
      ga: 25, vermianHeight: expectedVermianHeight(25) - 4,
    });
    expect(r.vhInterpretation).toMatch(/hypoplasia/i);
    expect(r.level).toBeGreaterThanOrEqual(3);
  });
});

describe('calculateFetalPF — TVA categorization', () => {
  it.each([
    [0,   'Normal',              1],
    [17,  'Normal',              1],
    [18,  'Mildly elevated',     2],
    [29,  'Mildly elevated',     2],
    [30,  'Moderately elevated', 3],
    [69,  'Moderately elevated', 3],
    [70,  'Severely elevated',   5],
    [90,  'Severely elevated',   5],
  ])('TVA %d° → %s (level %d)', (tva, category, expectedLevel) => {
    const r = calculateFetalPF({ tva });
    expect(r.tvaCategory).toBe(category);
    expect(r.level).toBeGreaterThanOrEqual(expectedLevel);
  });

  it('TVA unset → empty category', () => {
    const r = calculateFetalPF({});
    expect(r.tvaProvided).toBe(false);
    expect(r.tvaCategory).toBe('');
  });
});

describe('calculateFetalPF — Level aggregation', () => {
  it('severe TVA dominates over normal vermian', () => {
    const r = calculateFetalPF({
      ga: 25, vermianHeight: expectedVermianHeight(25), tva: 80,
    });
    expect(r.level).toBe(5);
  });

  it('hypoplasia vermian + normal TVA → level 3', () => {
    const r = calculateFetalPF({
      ga: 25,
      vermianHeight: expectedVermianHeight(25) - 5,
      tva: 10,
    });
    expect(r.level).toBe(3);
  });
});

describe('calculateFetalPF — optional measurements', () => {
  it('vermianAP and brainstemAP passthrough to labels', () => {
    const r = calculateFetalPF({
      ga: 25, vermianAP: 12, brainstemAP: 8,
    });
    expect(r.vapLabel).toBe('12 mm');
    expect(r.vapProvided).toBe(true);
    expect(r.bsLabel).toBe('8 mm');
    expect(r.bsProvided).toBe(true);
  });

  it('missing optional measurements → placeholder', () => {
    const r = calculateFetalPF({ ga: 25 });
    expect(r.vapLabel).toBe('--');
    expect(r.bsLabel).toBe('--');
  });
});
