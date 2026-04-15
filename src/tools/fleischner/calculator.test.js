import { describe, it, expect } from 'vitest';
import { calculateFleischner } from './calculator.js';

// Retroactive coverage for Phase 2 multi-item parse rollout.
// See docs/test.md section 9.

describe('calculateFleischner — incomplete inputs', () => {
  it('no noduleType → incomplete', () => {
    const r = calculateFleischner({ noduleCount: 'single', size: 5 });
    expect(r.recommendation).toBe('--');
  });

  it('no noduleCount → incomplete', () => {
    const r = calculateFleischner({ noduleType: 'solid', size: 5 });
    expect(r.recommendation).toBe('--');
  });

  it('no size → incomplete', () => {
    const r = calculateFleischner({ noduleType: 'solid', noduleCount: 'single' });
    expect(r.recommendation).toBe('--');
  });

  it('solid ≤8 mm with no risk level → incomplete', () => {
    const r = calculateFleischner({
      noduleType: 'solid', noduleCount: 'single', size: 5,
    });
    expect(r.recommendation).toBe('--');
    expect(r.reason).toMatch(/risk level/i);
  });

  it('solid >8 mm with no risk level still categorizes (risk irrelevant)', () => {
    const r = calculateFleischner({
      noduleType: 'solid', noduleCount: 'single', size: 12,
    });
    expect(r.recommendation).toBe('ct-3mo-pet-biopsy');
    expect(r.recommendationLevel).toBe(4);
  });
});

describe('calculateFleischner — solid single nodule', () => {
  it('<6 mm low risk → no follow-up', () => {
    const r = calculateFleischner({
      noduleType: 'solid', noduleCount: 'single', size: 5, riskLevel: 'low',
    });
    expect(r.recommendation).toBe('no-follow-up');
    expect(r.recommendationLevel).toBe(1);
  });

  it('<6 mm high risk → optional 12mo', () => {
    const r = calculateFleischner({
      noduleType: 'solid', noduleCount: 'single', size: 5, riskLevel: 'high',
    });
    expect(r.recommendation).toBe('optional-12mo');
    expect(r.recommendationLevel).toBe(2);
  });

  it('6 mm low risk → CT 6-12 then 18-24 (boundary)', () => {
    const r = calculateFleischner({
      noduleType: 'solid', noduleCount: 'single', size: 6, riskLevel: 'low',
    });
    expect(r.recommendation).toBe('ct-6-12mo-then-18-24mo');
  });

  it('8 mm high risk → CT 6-12 + 18-24 (upper 6-8 boundary)', () => {
    const r = calculateFleischner({
      noduleType: 'solid', noduleCount: 'single', size: 8, riskLevel: 'high',
    });
    expect(r.recommendation).toBe('ct-6-12mo-18-24mo');
  });

  it('>8 mm → CT 3 months/PET/biopsy (low or high risk)', () => {
    const r = calculateFleischner({
      noduleType: 'solid', noduleCount: 'single', size: 10, riskLevel: 'low',
    });
    expect(r.recommendation).toBe('ct-3mo-pet-biopsy');
    expect(r.recommendationLevel).toBe(4);
  });
});

describe('calculateFleischner — solid multiple nodules', () => {
  it('<6 mm low risk → no follow-up', () => {
    const r = calculateFleischner({
      noduleType: 'solid', noduleCount: 'multiple', size: 5, riskLevel: 'low',
    });
    expect(r.recommendation).toBe('no-follow-up');
  });

  it('6-8 mm low risk → CT 3-6 then 18-24', () => {
    const r = calculateFleischner({
      noduleType: 'solid', noduleCount: 'multiple', size: 7, riskLevel: 'low',
    });
    expect(r.recommendation).toBe('ct-3-6mo-then-18-24mo');
  });

  it('>8 mm → CT 3-6 most suspicious', () => {
    const r = calculateFleischner({
      noduleType: 'solid', noduleCount: 'multiple', size: 12, riskLevel: 'low',
    });
    expect(r.recommendation).toBe('ct-3-6mo-suspicious');
  });
});

describe('calculateFleischner — ground glass', () => {
  it('single <6 mm → no follow-up', () => {
    const r = calculateFleischner({
      noduleType: 'groundGlass', noduleCount: 'single', size: 5,
    });
    expect(r.recommendation).toBe('no-follow-up');
  });

  it('single 6 mm → CT 6-12 then q2yr (boundary)', () => {
    const r = calculateFleischner({
      noduleType: 'groundGlass', noduleCount: 'single', size: 6,
    });
    expect(r.recommendation).toBe('gg-ct-6-12mo-then-2yr');
  });

  it('multiple <6 mm → CT at 2 and 4 years', () => {
    const r = calculateFleischner({
      noduleType: 'groundGlass', noduleCount: 'multiple', size: 5,
    });
    expect(r.recommendation).toBe('gg-ct-2-4yr');
  });

  it('multiple ≥6 mm → CT 3-6 most suspicious', () => {
    const r = calculateFleischner({
      noduleType: 'groundGlass', noduleCount: 'multiple', size: 8,
    });
    expect(r.recommendation).toBe('gg-ct-3-6mo-suspicious');
  });
});

describe('calculateFleischner — part-solid', () => {
  it('single <6 mm → no follow-up', () => {
    const r = calculateFleischner({
      noduleType: 'partSolid', noduleCount: 'single', size: 5,
    });
    expect(r.recommendation).toBe('no-follow-up');
  });

  it('single ≥6 mm → CT 3-6 then annual x5yr', () => {
    const r = calculateFleischner({
      noduleType: 'partSolid', noduleCount: 'single', size: 8,
    });
    expect(r.recommendation).toBe('ps-ct-3-6mo-annual');
  });

  it('multiple <6 mm → CT 3-6 then 2 and 4 yr', () => {
    const r = calculateFleischner({
      noduleType: 'partSolid', noduleCount: 'multiple', size: 5,
    });
    expect(r.recommendation).toBe('ps-ct-3-6mo-then-2-4yr');
  });

  it('multiple ≥6 mm → CT 3-6 most suspicious', () => {
    const r = calculateFleischner({
      noduleType: 'partSolid', noduleCount: 'multiple', size: 8,
    });
    expect(r.recommendation).toBe('ps-ct-3-6mo-suspicious');
  });
});

describe('calculateFleischner — metadata', () => {
  it('populates sizeCm + reason', () => {
    const r = calculateFleischner({
      noduleType: 'solid', noduleCount: 'single', size: 10, riskLevel: 'high',
    });
    expect(r.sizeCm).toBe('1.0');
    expect(r.reason).toContain('Solid');
    expect(r.reason).toContain('single');
    expect(r.reason).toContain('10 mm');
    expect(r.reason).toContain('high risk');
  });

  it('riskNeeded flag set when solid ≤8 mm with no size', () => {
    const r = calculateFleischner({
      noduleType: 'solid', noduleCount: 'single',
    });
    expect(r.riskNeeded).toBe(true);
  });
});
