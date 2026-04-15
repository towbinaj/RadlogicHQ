import { describe, it, expect } from 'vitest';
import { calculateRecist } from './calculator.js';

// Retroactive coverage for Phase 2 multi-item parse rollout.
// See docs/test.md section 9.

describe('calculateRecist — target response', () => {
  it('all current = 0 → CR', () => {
    const r = calculateRecist({}, [
      { label: 'L1', baseline: 20, current: 0 },
      { label: 'L2', baseline: 15, current: 0 },
    ]);
    expect(r.targetResponse).toBe('CR');
    expect(r.overallResponse).toBe('CR');
  });

  it('exactly -30% from baseline → PR (boundary)', () => {
    // baseline 100, current 70 → -30%
    const r = calculateRecist({}, [
      { label: 'L1', baseline: 100, current: 70 },
    ]);
    expect(r.pctFromBaseline).toBe(-30);
    expect(r.targetResponse).toBe('PR');
  });

  it('-29% from baseline → SD (just below PR threshold)', () => {
    // baseline 100, current 71 → -29%
    const r = calculateRecist({}, [
      { label: 'L1', baseline: 100, current: 71 },
    ]);
    expect(r.pctFromBaseline).toBe(-29);
    expect(r.targetResponse).toBe('SD');
  });

  it('+20% from nadir AND +5mm absolute → PD (both conditions)', () => {
    // nadir 25, current 30 → +20% and +5mm
    const r = calculateRecist({}, [
      { label: 'L1', baseline: 40, current: 30, nadir: 25 },
    ]);
    expect(r.pctFromNadir).toBe(20);
    expect(r.absIncreaseFromNadir).toBe(5);
    expect(r.targetResponse).toBe('PD');
  });

  it('+20% from nadir but only +3mm absolute → SD (absolute not met)', () => {
    // nadir 15, current 18 → +20% but +3mm
    const r = calculateRecist({}, [
      { label: 'L1', baseline: 40, current: 18, nadir: 15 },
    ]);
    expect(r.pctFromNadir).toBe(20);
    expect(r.absIncreaseFromNadir).toBe(3);
    // Target has also fallen >=30% from baseline (18 vs 40 = -55%), so PR.
    expect(r.targetResponse).toBe('PR');
  });

  it('+15% from nadir → SD (percent not met)', () => {
    // nadir 20, current 23 → +15%
    const r = calculateRecist({}, [
      { label: 'L1', baseline: 25, current: 23, nadir: 20 },
    ]);
    expect(r.pctFromNadir).toBe(15);
    expect(r.targetResponse).toBe('SD');
  });

  it('stable disease: +5% from baseline → SD', () => {
    const r = calculateRecist({}, [
      { label: 'L1', baseline: 100, current: 105 },
    ]);
    expect(r.targetResponse).toBe('SD');
  });

  it('nadir defaults to baseline when not provided', () => {
    const r = calculateRecist({}, [
      { label: 'L1', baseline: 50, current: 60 },
    ]);
    // nadirSum = baselineSum = 50, +20% from 50 = 60, absolute = 10mm → PD.
    expect(r.nadirSum).toBe(50);
    expect(r.targetResponse).toBe('PD');
  });
});

describe('calculateRecist — overall response PD short-circuit', () => {
  it('new lesion forces overall PD (regardless of target)', () => {
    const r = calculateRecist({ newLesion: 'yes' }, [
      { label: 'L1', baseline: 100, current: 50 },  // would be PR
    ]);
    expect(r.targetResponse).toBe('PR');
    expect(r.overallResponse).toBe('PD');
  });

  it('non-target progression forces overall PD', () => {
    const r = calculateRecist({ nonTarget: 'progression' }, [
      { label: 'L1', baseline: 100, current: 50 },
    ]);
    expect(r.overallResponse).toBe('PD');
  });
});

describe('calculateRecist — CR + non-target interaction', () => {
  it('target CR + non-target absent → overall CR', () => {
    const r = calculateRecist({ nonTarget: 'absent' }, [
      { label: 'L1', baseline: 20, current: 0 },
    ]);
    expect(r.overallResponse).toBe('CR');
  });

  it('target CR + non-target present (non-CR/non-PD) → overall PR', () => {
    const r = calculateRecist({ nonTarget: 'present' }, [
      { label: 'L1', baseline: 20, current: 0 },
    ]);
    expect(r.overallResponse).toBe('PR');
  });
});

describe('calculateRecist — sums and metadata', () => {
  it('sums baseline and current across multiple targets', () => {
    const r = calculateRecist({}, [
      { label: 'L1', baseline: 30, current: 20 },
      { label: 'L2', baseline: 40, current: 30 },
      { label: 'L3', baseline: 50, current: 35 },
    ]);
    expect(r.baselineSum).toBe(120);
    expect(r.currentSum).toBe(85);
    expect(r.pctFromBaseline).toBeCloseTo(-29.2, 1);
    expect(r.targetCount).toBe(3);
  });

  it('percent labels include sign', () => {
    const r = calculateRecist({}, [
      { label: 'L1', baseline: 100, current: 50 },
    ]);
    expect(r.pctFromBaselineLabel).toBe('-50%');
  });

  it('current > baseline produces positive percent label', () => {
    const r = calculateRecist({}, [
      { label: 'L1', baseline: 40, current: 60 },
    ]);
    expect(r.pctFromBaselineLabel).toBe('+50%');
  });

  it('ignores invalid baseline (<=0)', () => {
    const r = calculateRecist({}, [
      { label: 'L1', baseline: 0, current: 10 },
      { label: 'L2', baseline: 20, current: 15 },
    ]);
    expect(r.baselineSum).toBe(20);
  });
});

describe('calculateRecist — incomplete', () => {
  it('no targets returns incomplete', () => {
    const r = calculateRecist({}, []);
    expect(r.targetResponse).toBe('--');
    expect(r.overallResponse).toBe('--');
    expect(r.targetCount).toBe(0);
  });

  it('targets with only baseline (no current) are incomplete', () => {
    const r = calculateRecist({}, [
      { label: 'L1', baseline: 20 },
    ]);
    expect(r.baselineSumProvided).toBe(true);
    expect(r.currentSumProvided).toBe(false);
    expect(r.targetResponse).toBe('--');
  });
});
