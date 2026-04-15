import { describe, it, expect } from 'vitest';
import { calculateFetalBiometry } from './calculator.js';
import { BPD_MEANS, CEREBELLUM_MEANS } from './definition.js';

// Retroactive coverage for the measurement tool backlog.
// See docs/test.md section 9.

describe('calculateFetalBiometry — GA validation', () => {
  it('GA 20 (lower boundary) accepted', () => {
    const r = calculateFetalBiometry({ ga: 20, bpd: BPD_MEANS[20] });
    expect(r.gaProvided).toBe(true);
    expect(r.gaLabel).toBe('20 weeks');
    expect(r.bpdInterpretation).toBe('Within normal range');
  });

  it('GA 40 (upper boundary) accepted', () => {
    const r = calculateFetalBiometry({ ga: 40, bpd: BPD_MEANS[40] });
    expect(r.gaProvided).toBe(true);
  });

  it('GA 19 (below range) rejected', () => {
    const r = calculateFetalBiometry({ ga: 19, bpd: 45 });
    expect(r.gaProvided).toBe(false);
    expect(r.bpdInterpretation).toBe('');
  });

  it('GA 41 (above range) rejected', () => {
    const r = calculateFetalBiometry({ ga: 41, bpd: 95 });
    expect(r.gaProvided).toBe(false);
  });

  it('null GA is not provided', () => {
    expect(calculateFetalBiometry({}).gaProvided).toBe(false);
  });
});

describe('calculateFetalBiometry — BPD interpretation', () => {
  it('exact mean → Within normal range (diff = 0)', () => {
    const mean = BPD_MEANS[25];
    const r = calculateFetalBiometry({ ga: 25, bpd: mean });
    expect(r.bpdInterpretation).toBe('Within normal range');
    expect(r.bpdDiff).toBe('+0 mm');
  });

  it('+5 mm → Within normal range (boundary)', () => {
    const r = calculateFetalBiometry({ ga: 25, bpd: BPD_MEANS[25] + 5 });
    expect(r.bpdInterpretation).toBe('Within normal range');
    expect(r.bpdDiff).toBe('+5 mm');
  });

  it('+6 mm → Above expected mean', () => {
    const r = calculateFetalBiometry({ ga: 25, bpd: BPD_MEANS[25] + 6 });
    expect(r.bpdInterpretation).toBe('Above expected mean');
    expect(r.bpdDiff).toBe('+6 mm');
  });

  it('-6 mm → Below expected mean', () => {
    const r = calculateFetalBiometry({ ga: 25, bpd: BPD_MEANS[25] - 6 });
    expect(r.bpdInterpretation).toBe('Below expected mean');
  });

  it('missing BPD → no interpretation', () => {
    const r = calculateFetalBiometry({ ga: 25 });
    expect(r.bpdProvided).toBe(false);
    expect(r.bpdLabel).toBe('--');
    expect(r.bpdInterpretation).toBe('');
  });
});

describe('calculateFetalBiometry — Cerebellum interpretation', () => {
  it('exact mean → Within normal range', () => {
    const mean = CEREBELLUM_MEANS[30];
    const r = calculateFetalBiometry({ ga: 30, cerebellum: mean });
    expect(r.cerebellumInterpretation).toBe('Within normal range');
  });

  it('+3 mm → Within normal range (boundary)', () => {
    const r = calculateFetalBiometry({
      ga: 30, cerebellum: CEREBELLUM_MEANS[30] + 3,
    });
    expect(r.cerebellumInterpretation).toBe('Within normal range');
  });

  it('+4 mm → Above expected mean', () => {
    const r = calculateFetalBiometry({
      ga: 30, cerebellum: CEREBELLUM_MEANS[30] + 4,
    });
    expect(r.cerebellumInterpretation).toBe('Above expected mean');
  });

  it('-4 mm → Below expected mean', () => {
    const r = calculateFetalBiometry({
      ga: 30, cerebellum: CEREBELLUM_MEANS[30] - 4,
    });
    expect(r.cerebellumInterpretation).toBe('Below expected mean');
  });
});

describe('calculateFetalBiometry — Cisterna magna interpretation', () => {
  it.each([
    [2,  'Normal (2–10 mm)'],
    [5,  'Normal (2–10 mm)'],
    [10, 'Normal (2–10 mm)'],
    [11, 'Enlarged (>10 mm)'],
    [15, 'Enlarged (>10 mm)'],
    [1,  'Small (<2 mm)'],
    [0,  'Small (<2 mm)'],
  ])('CM %d mm → %s', (cisternaMagna, expected) => {
    const r = calculateFetalBiometry({ cisternaMagna });
    expect(r.cmInterpretation).toBe(expected);
    expect(r.cmLabel).toBe(`${cisternaMagna} mm`);
  });

  it('GA-independent: works without GA', () => {
    const r = calculateFetalBiometry({ cisternaMagna: 5 });
    expect(r.gaProvided).toBe(false);
    expect(r.cmInterpretation).toBe('Normal (2–10 mm)');
  });

  it('missing CM → no interpretation', () => {
    const r = calculateFetalBiometry({});
    expect(r.cmProvided).toBe(false);
    expect(r.cmLabel).toBe('--');
  });
});
