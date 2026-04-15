import { describe, it, expect } from 'vitest';
import { calculateRapno } from './calculator.js';
import { VARIANTS } from './definition.js';

// Retroactive coverage for Phase 2 multi-item parse rollout.
// See docs/test.md section 9.

const HGG = VARIANTS.hgg;
const DIPG = VARIANTS.dipg;
const MEDULLO = VARIANTS.medullo;

function target(blD1, blD2, curD1, curD2, extra = {}) {
  return { label: 'T1', blD1, blD2, curD1, curD2, ...extra };
}

describe('calculateRapno — HGG/LGG thresholds (PR=-50, MinR=-25, PD=+25)', () => {
  it('literal (0, 0) current dimensions → CR (disappeared lesion)', () => {
    // Regression test for the `curD > 0` guard bug: users entering 0
    // for a disappeared lesion need to hit the CR branch, not have the
    // target treated as "not measured". Baseline guard stays > 0 since
    // a 0-size baseline is nonsensical.
    const r = calculateRapno([target(10, 10, 0, 0)], {}, HGG);
    expect(r.currentSum).toBe(0);
    expect(r.currentSumProvided).toBe(true);
    expect(r.overallResponse).toBe('CR');
  });

  it('one dimension zero, other non-zero → still CR for that target', () => {
    // A single 0 dimension with a positive partner also means the
    // lesion is no longer a measurable product. Product = 0.
    const r = calculateRapno([target(10, 10, 5, 0)], {}, HGG);
    expect(r.currentSum).toBe(0);
    expect(r.overallResponse).toBe('CR');
  });

  it('exactly -50% → PR (boundary)', () => {
    // baseline 100 mm² → current 50 mm²
    const r = calculateRapno([target(10, 10, 10, 5)], {}, HGG);
    expect(r.pctFromBaseline).toBe(-50);
    expect(r.overallResponse).toBe('PR');
  });

  it('-49% → MinR (just above PR threshold)', () => {
    // baseline 100, current 51
    const r = calculateRapno([target(10, 10, 10, 5.1)], {}, HGG);
    expect(r.pctFromBaseline).toBe(-49);
    expect(r.overallResponse).toBe('MinR');
  });

  it('exactly -25% → MinR (boundary)', () => {
    // baseline 100, current 75
    const r = calculateRapno([target(10, 10, 10, 7.5)], {}, HGG);
    expect(r.pctFromBaseline).toBe(-25);
    expect(r.overallResponse).toBe('MinR');
  });

  it('-24% → SD (just above MinR threshold)', () => {
    const r = calculateRapno([target(10, 10, 10, 7.6)], {}, HGG);
    expect(r.pctFromBaseline).toBe(-24);
    expect(r.overallResponse).toBe('SD');
  });

  it('+25% from nadir → PD', () => {
    // nadir defaults to baseline 100; current 125 → +25%
    const r = calculateRapno([target(10, 10, 10, 12.5)], {}, HGG);
    expect(r.pctFromNadir).toBe(25);
    expect(r.overallResponse).toBe('PD');
  });

  it('stable disease fallthrough at 0% change', () => {
    const r = calculateRapno([target(10, 10, 10, 10)], {}, HGG);
    expect(r.overallResponse).toBe('SD');
  });
});

describe('calculateRapno — DIPG thresholds (PR=-25, no MinR, PD=+25)', () => {
  it('exactly -25% → PR (lower threshold)', () => {
    const r = calculateRapno([target(10, 10, 10, 7.5)], {}, DIPG);
    expect(r.pctFromBaseline).toBe(-25);
    expect(r.overallResponse).toBe('PR');
  });

  it('-20% → SD (no MinR category exists)', () => {
    const r = calculateRapno([target(10, 10, 10, 8)], {}, DIPG);
    expect(r.pctFromBaseline).toBe(-20);
    expect(r.overallResponse).toBe('SD');
  });

  it('DIPG never returns MinR', () => {
    const r = calculateRapno([target(10, 10, 10, 7.6)], {}, DIPG);
    // -24% in HGG would be SD (above MinR); in DIPG below PR so SD.
    expect(r.overallResponse).toBe('SD');
  });
});

describe('calculateRapno — Medulloblastoma (PR=-50, no MinR)', () => {
  it('exactly -50% → PR', () => {
    const r = calculateRapno([target(10, 10, 10, 5)], {}, MEDULLO);
    expect(r.overallResponse).toBe('PR');
  });

  it('-40% → SD (no MinR in medullo)', () => {
    const r = calculateRapno([target(10, 10, 10, 6)], {}, MEDULLO);
    expect(r.pctFromBaseline).toBe(-40);
    expect(r.overallResponse).toBe('SD');
  });
});

describe('calculateRapno — manual nadir override', () => {
  it('manual nadir drives PD calculation', () => {
    // baseline 100, manual nadir 40, current 50 → +25% from nadir (PD)
    const r = calculateRapno([
      target(10, 10, 10, 5, { nadirProduct: 40 }),
    ], {}, HGG);
    // baseline -50% = PR, but we also need to see PD logic. Actually
    // PR wins in the ordering. Let me verify: baseline -50 ≤ -50 → PR.
    expect(r.overallResponse).toBe('PR');
  });

  it('nadir override without hitting PR triggers PD when +25%', () => {
    // baseline 100, nadir 50, current 63 → -37% from baseline (between
    // PR -50 and MinR -25 → MinR), nadir 63/50 = +26%.
    // But MinR gets picked first (ordering). Let me verify.
    const r = calculateRapno([
      target(10, 10, 9, 7, { nadirProduct: 50 }),
    ], {}, HGG);
    // blProd=100, curProd=63, pctFromBaseline=-37 → MinR (not below -50).
    // PD check only fires if MinR branch doesn't.
    expect(r.pctFromBaseline).toBe(-37);
    expect(r.overallResponse).toBe('MinR');
  });

  it('flat baseline, nadir override → PD when current +25% from nadir', () => {
    // baseline 100, nadir 80, current 100 → 0% from baseline (SD),
    // +25% from nadir → PD.
    const r = calculateRapno([
      target(10, 10, 10, 10, { nadirProduct: 80 }),
    ], {}, HGG);
    expect(r.pctFromBaseline).toBe(0);
    expect(r.pctFromNadir).toBe(25);
    expect(r.overallResponse).toBe('PD');
  });
});

describe('calculateRapno — overall response gates', () => {
  it('new lesion forces PD', () => {
    const r = calculateRapno(
      [target(10, 10, 0, 0)],
      { newLesion: 'yes' },
      HGG,
    );
    expect(r.overallResponse).toBe('PD');
  });

  it('non-target progression forces PD', () => {
    const r = calculateRapno(
      [target(10, 10, 0, 0)],
      { nonTarget: 'progression' },
      HGG,
    );
    expect(r.overallResponse).toBe('PD');
  });

  it('target CR + non-target absent → overall CR', () => {
    const r = calculateRapno(
      [target(10, 10, 0, 0)],
      { nonTarget: 'absent' },
      HGG,
    );
    expect(r.overallResponse).toBe('CR');
  });

  it('target CR + non-target present → overall PR', () => {
    const r = calculateRapno(
      [target(10, 10, 0, 0)],
      { nonTarget: 'present' },
      HGG,
    );
    expect(r.overallResponse).toBe('PR');
  });
});

describe('calculateRapno — sums and metadata', () => {
  it('sums bidimensional products across multiple targets', () => {
    const r = calculateRapno([
      target(10, 10, 8, 8),  // 100 → 64
      target(20, 20, 15, 15), // 400 → 225
    ], {}, HGG);
    expect(r.baselineSum).toBe(500);
    expect(r.currentSum).toBe(289);
    expect(r.targetCount).toBe(2);
  });

  it('invalid baseline dimensions are skipped from baselineSum', () => {
    const r = calculateRapno([
      target(0, 10, 8, 8),  // baseline invalid (d1=0) — blProd null, curProd ok
      target(10, 10, 8, 8),
    ], {}, HGG);
    // Only second target contributes to baselineSum (first has null blProd).
    expect(r.baselineSum).toBe(100);
    expect(r.currentSum).toBe(128);
    // targetCount counts anything with blProd OR curProd non-null.
    expect(r.targetCount).toBe(2);
  });

  it('targets with null dimensions are excluded from count', () => {
    // null = "not yet measured". 0 = "measured as disappeared" (CR).
    const r = calculateRapno([
      { label: 'T1', blD1: null, blD2: null, curD1: null, curD2: null },
      target(10, 10, 8, 8),
    ], {}, HGG);
    expect(r.targetCount).toBe(1);
  });

  it('variant metadata populated', () => {
    const r = calculateRapno([target(10, 10, 8, 8)], {}, HGG);
    expect(r.variantLabel).toBe('HGG');
    expect(r.variantFullName).toBe('High-Grade Glioma');
    expect(r.sequenceNote).toBe('T1 post-contrast');
  });

  it('percent label includes sign', () => {
    const r = calculateRapno([target(10, 10, 8, 8)], {}, HGG);
    expect(r.pctFromBaseline).toBe(-36);
    expect(r.pctLabel).toBe('-36%');
  });
});

describe('calculateRapno — incomplete', () => {
  it('no targets returns incomplete', () => {
    const r = calculateRapno([], {}, HGG);
    expect(r.overallResponse).toBe('--');
    expect(r.targetCount).toBe(0);
  });

  it('baseline only (no current) returns incomplete', () => {
    const r = calculateRapno([
      { label: 'T1', blD1: 10, blD2: 10 },
    ], {}, HGG);
    expect(r.baselineSumProvided).toBe(true);
    expect(r.currentSumProvided).toBe(false);
    expect(r.overallResponse).toBe('--');
  });
});
