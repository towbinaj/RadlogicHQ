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

// Cignini P et al. PLoS One 2016;11:e0147528, Table 3 (normal-based
// centiles by completed week, 20-35 weeks).
describe('calculateFetalPF — vermian height vs Cignini 2016 centiles', () => {
  it('mean at 21 weeks is within normal range', () => {
    const r = calculateFetalPF({ ga: 21, vermianHeight: 11.96 });
    expect(r.vhInterpretation).toMatch(/within normal range/i);
    expect(r.vhExpected).toBe('11.96 mm');
  });

  it('21 weeks, 9.5 mm (below the 1st centile 10.40) flags hypoplasia', () => {
    const r = calculateFetalPF({ ga: 21, vermianHeight: 9.5 });
    expect(r.vhInterpretation).toMatch(/below 1st centile/i);
    expect(r.vhInterpretation).toMatch(/hypoplasia/i);
    expect(r.level).toBeGreaterThanOrEqual(3);
  });

  it('21 weeks, 10.6 mm (between 1st 10.40 and 5th 10.86) is below the 5th centile', () => {
    const r = calculateFetalPF({ ga: 21, vermianHeight: 10.6 });
    expect(r.vhInterpretation).toMatch(/below 5th centile/i);
    expect(r.vhInterpretation).not.toMatch(/1st/);
  });

  it('30 weeks, 22.0 mm (above 95th 21.65) is above the 95th centile', () => {
    expect(calculateFetalPF({ ga: 30, vermianHeight: 22.0 }).vhInterpretation).toMatch(/above 95th centile/i);
  });

  it('uses the completed week (21.6 weeks -> 21-week row)', () => {
    expect(calculateFetalPF({ ga: 21.6, vermianHeight: 9.5 }).vhInterpretation).toMatch(/below 1st/i);
  });

  it('outside 20-35 weeks: no interpretation, reference range noted', () => {
    const r = calculateFetalPF({ ga: 18, vermianHeight: 9 });
    expect(r.vhInterpretation).toBe('');
    expect(r.vhExpectedProvided).toBe(false);
    expect(r.vhNote).toMatch(/20-35 weeks/);
    expect(calculateFetalPF({ ga: 37, vermianHeight: 22 }).vhInterpretation).toBe('');
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
      vermianHeight: 12, // below the 25-week 1st centile (12.77)
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
