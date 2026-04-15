import { describe, it, expect } from 'vitest';
import { calculateFetalLung } from './calculator.js';

// Retroactive coverage for the measurement tool backlog.
// See docs/test.md section 9.

// Rypens expected volume: 0.002 * GA^2.913
function expectedAt(ga) {
  return Math.round(0.002 * Math.pow(ga, 2.913) * 10) / 10;
}

describe('calculateFetalLung — GA validation', () => {
  it('GA 20 (lower boundary) accepted', () => {
    const r = calculateFetalLung({ ga: 20, observedVolume: 20 });
    expect(r.gaProvided).toBe(true);
    expect(r.expectedProvided).toBe(true);
  });

  it('GA 40 (upper boundary) accepted', () => {
    const r = calculateFetalLung({ ga: 40, observedVolume: 100 });
    expect(r.gaProvided).toBe(true);
  });

  it('GA 19 rejected', () => {
    const r = calculateFetalLung({ ga: 19, observedVolume: 20 });
    expect(r.gaProvided).toBe(false);
    expect(r.expectedProvided).toBe(false);
    expect(r.oeProvided).toBe(false);
  });

  it('GA 41 rejected', () => {
    expect(calculateFetalLung({ ga: 41, observedVolume: 100 }).gaProvided).toBe(false);
  });
});

describe('calculateFetalLung — expected (Rypens) formula', () => {
  it('matches 0.002 × GA^2.913 at GA 25', () => {
    const r = calculateFetalLung({ ga: 25, observedVolume: expectedAt(25) });
    expect(r.expectedLabel).toBe(`${expectedAt(25)} mL`);
    // Observed == expected → O/E = 100%
    expect(r.oeRatio).toBeCloseTo(100, 1);
  });

  it('O/E ratio computed correctly for half-observed', () => {
    const expected = expectedAt(28);
    const r = calculateFetalLung({ ga: 28, observedVolume: expected / 2 });
    expect(r.oeRatio).toBeCloseTo(50, 1);
  });
});

describe('calculateFetalLung — severity categories', () => {
  it.each([
    [10,  'Severe',   5],
    [24.9, 'Severe',  5],
    [25,  'Moderate', 3],
    [34.9, 'Moderate',3],
    [35,  'Mild',     1],
    [60,  'Mild',     1],
    [100, 'Mild',     1],
  ])('O/E %d%% → %s (level %d)', (targetOE, severity, level) => {
    // Compute observed that yields the target O/E.
    const expected = expectedAt(28);
    const observed = (targetOE / 100) * expected;
    const r = calculateFetalLung({ ga: 28, observedVolume: observed });
    expect(r.severity).toBe(severity);
    expect(r.level).toBe(level);
  });
});

describe('calculateFetalLung — CDH side + liver position', () => {
  it('left CDH + liver up', () => {
    const r = calculateFetalLung({
      ga: 28, observedVolume: 20, cdhSide: 'left', liverPosition: 'up',
    });
    expect(r.cdhSideLabel).toBe('Left');
    expect(r.liverLabel).toMatch(/Liver up/);
    expect(r.cdhSideProvided).toBe(true);
    expect(r.liverProvided).toBe(true);
  });

  it('right CDH + liver down', () => {
    const r = calculateFetalLung({
      ga: 28, observedVolume: 20, cdhSide: 'right', liverPosition: 'down',
    });
    expect(r.cdhSideLabel).toBe('Right');
    expect(r.liverLabel).toMatch(/not herniated/);
  });

  it('unset side + liver → empty labels', () => {
    const r = calculateFetalLung({ ga: 28, observedVolume: 20 });
    expect(r.cdhSideLabel).toBe('');
    expect(r.liverLabel).toBe('');
  });
});

describe('calculateFetalLung — incomplete', () => {
  it('no observed volume → no O/E', () => {
    const r = calculateFetalLung({ ga: 28 });
    expect(r.observedProvided).toBe(false);
    expect(r.oeProvided).toBe(false);
    expect(r.severity).toBe('');
    expect(r.level).toBe(0);
  });
});
