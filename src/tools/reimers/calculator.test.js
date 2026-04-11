import { describe, it, expect } from 'vitest';
import { calculateReimers } from './calculator.js';

describe('calculateReimers', () => {
  it('calculates right side migration percentage', () => {
    const result = calculateReimers({ rightM1: 5, rightM2: 20 });
    expect(result.rightPct).toBe(25);
    expect(result.rightProvided).toBe(true);
  });

  it('calculates both sides', () => {
    const result = calculateReimers({
      rightM1: 5, rightM2: 20,
      leftM1: 10, leftM2: 20,
    });
    expect(result.rightPct).toBe(25);
    expect(result.leftPct).toBe(50);
    expect(result.rightProvided).toBe(true);
    expect(result.leftProvided).toBe(true);
  });

  it('returns null pct when M2 is missing', () => {
    const result = calculateReimers({ rightM1: 5 });
    expect(result.rightPct).toBeNull();
    expect(result.rightProvided).toBe(false);
  });

  it('returns null pct when M2 is 0 (division by zero)', () => {
    const result = calculateReimers({ rightM1: 5, rightM2: 0 });
    expect(result.rightPct).toBeNull();
    expect(result.rightProvided).toBe(false);
  });

  it('coxaValga present → descriptive label', () => {
    const result = calculateReimers({ coxaValga: 'present' });
    expect(result.coxaValgaLabel).toContain('coxa valga');
    expect(result.coxaValgaProvided).toBe(true);
  });

  it('coxaValga absent → negative label', () => {
    const result = calculateReimers({ coxaValga: 'absent' });
    expect(result.coxaValgaLabel).toContain('no apparent coxa valga');
    expect(result.coxaValgaProvided).toBe(true);
  });

  it('coxaValga null → empty label', () => {
    const result = calculateReimers({});
    expect(result.coxaValgaLabel).toBe('');
    expect(result.coxaValgaProvided).toBe(false);
  });

  it('handles decimal results with rounding', () => {
    // 7 / 30 * 100 = 23.333... → should round to 23.3
    const result = calculateReimers({ rightM1: 7, rightM2: 30 });
    expect(result.rightPct).toBe(23.3);
  });
});
