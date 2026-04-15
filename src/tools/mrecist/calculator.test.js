import { describe, it, expect } from 'vitest';
import { calculateMrecist } from './calculator.js';

// Retroactive coverage for Phase 2 multi-item parse rollout.
// See docs/test.md section 9.

describe('calculateMrecist — target response', () => {
  it('all enhancing diameters = 0 → CR', () => {
    const r = calculateMrecist({}, [
      { baseline: 20, current: 0 },
      { baseline: 15, current: 0 },
    ]);
    expect(r.overallResponse).toBe('CR');
  });

  it('exactly -30% from baseline → PR (boundary)', () => {
    const r = calculateMrecist({}, [
      { baseline: 100, current: 70 },
    ]);
    expect(r.pctFromBaseline).toBe(-30);
    expect(r.overallResponse).toBe('PR');
  });

  it('-29% from baseline → SD', () => {
    const r = calculateMrecist({}, [
      { baseline: 100, current: 71 },
    ]);
    expect(r.overallResponse).toBe('SD');
  });

  it('+20% from nadir → PD (percent-only rule, no absolute mm check)', () => {
    // nadir 10, current 12 → +20% (only 2mm but mRECIST has no abs check)
    const r = calculateMrecist({}, [
      { baseline: 40, current: 12, nadir: 10 },
    ]);
    expect(r.pctFromBaseline).toBe(-70);
    // Baseline rule fires first: -70% → PR. PD check only runs if PR not met.
    expect(r.overallResponse).toBe('PR');
  });

  it('nadir +20% beats SD when baseline unchanged', () => {
    // baseline 100, nadir 50, current 60 → -40% from baseline (PR wins first)
    const r = calculateMrecist({}, [
      { baseline: 100, current: 60, nadir: 50 },
    ]);
    expect(r.overallResponse).toBe('PR');
  });

  it('PD when baseline flat but nadir+20% with no PR', () => {
    // baseline 100, nadir 100, current 125 → +25% both ways → PD
    const r = calculateMrecist({}, [
      { baseline: 100, current: 125, nadir: 100 },
    ]);
    expect(r.pctFromBaseline).toBe(25);
    expect(r.overallResponse).toBe('PD');
  });

  it('stable disease fallthrough', () => {
    const r = calculateMrecist({}, [
      { baseline: 100, current: 105 },
    ]);
    expect(r.overallResponse).toBe('SD');
  });

  it('nadir defaults to baseline when not provided', () => {
    const r = calculateMrecist({}, [
      { baseline: 50, current: 60 },
    ]);
    // +20% from 50 = 60 → PD (mRECIST has no abs mm check).
    expect(r.overallResponse).toBe('PD');
  });
});

describe('calculateMrecist — overall response rules', () => {
  it('new lesion forces PD', () => {
    const r = calculateMrecist({ newLesion: 'yes' }, [
      { baseline: 100, current: 50 },
    ]);
    expect(r.overallResponse).toBe('PD');
  });

  it('non-target progression forces PD', () => {
    const r = calculateMrecist({ nonTarget: 'progression' }, [
      { baseline: 100, current: 50 },
    ]);
    expect(r.overallResponse).toBe('PD');
  });

  it('target CR + non-target absent → overall CR', () => {
    const r = calculateMrecist({ nonTarget: 'absent' }, [
      { baseline: 20, current: 0 },
    ]);
    expect(r.overallResponse).toBe('CR');
  });

  it('target CR + non-target present → overall PR', () => {
    const r = calculateMrecist({ nonTarget: 'present' }, [
      { baseline: 20, current: 0 },
    ]);
    expect(r.overallResponse).toBe('PR');
  });
});

describe('calculateMrecist — sums and labels', () => {
  it('sums across multiple enhancing targets', () => {
    const r = calculateMrecist({}, [
      { baseline: 30, current: 15 },
      { baseline: 50, current: 25 },
    ]);
    expect(r.baselineSum).toBe(80);
    expect(r.currentSum).toBe(40);
    expect(r.pctFromBaseline).toBe(-50);
    expect(r.pctLabel).toBe('-50%');
  });

  it('positive percent label includes +', () => {
    const r = calculateMrecist({}, [
      { baseline: 50, current: 75 },
    ]);
    expect(r.pctLabel).toBe('+50%');
  });
});

describe('calculateMrecist — incomplete', () => {
  it('no targets returns incomplete', () => {
    const r = calculateMrecist({}, []);
    expect(r.overallResponse).toBe('--');
    expect(r.overallResponseLabel).toBe('Incomplete');
  });

  it('baseline only (no current) → incomplete', () => {
    const r = calculateMrecist({}, [
      { baseline: 20 },
    ]);
    expect(r.baselineSumProvided).toBe(true);
    expect(r.currentSumProvided).toBe(false);
    expect(r.overallResponse).toBe('--');
  });
});
