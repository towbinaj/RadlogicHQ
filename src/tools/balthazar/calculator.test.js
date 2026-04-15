import { describe, it, expect } from 'vitest';
import { calculateBalthazar } from './calculator.js';

// Retroactive coverage for the other-RADS tool backlog.
// See docs/test.md section 9.

describe('calculateBalthazar — grade points', () => {
  it.each([
    ['A', 0],
    ['B', 1],
    ['C', 2],
    ['D', 3],
    ['E', 4],
  ])('grade %s → %d points', (grade, points) => {
    const r = calculateBalthazar({ grade, necrosis: 'none' });
    expect(r.gradePoints).toBe(points);
    expect(r.gradeProvided).toBe(true);
  });

  it('unset grade → null points and incomplete CTSI', () => {
    const r = calculateBalthazar({ necrosis: 'none' });
    expect(r.gradePoints).toBeNull();
    expect(r.gradeProvided).toBe(false);
    expect(r.ctsi).toBeNull();
    expect(r.ctsiLabel).toBe('--');
    expect(r.level).toBe(0);
  });
});

describe('calculateBalthazar — necrosis points', () => {
  it.each([
    ['none',  0],
    ['lt30',  2],
    ['30-50', 4],
    ['gt50',  6],
  ])('necrosis %s → %d points', (necrosis, points) => {
    const r = calculateBalthazar({ grade: 'A', necrosis });
    expect(r.necrosisPoints).toBe(points);
    expect(r.necrosisProvided).toBe(true);
  });

  it('unset necrosis → null points', () => {
    const r = calculateBalthazar({ grade: 'A' });
    expect(r.necrosisPoints).toBeNull();
    expect(r.necrosisProvided).toBe(false);
    expect(r.ctsi).toBeNull();
  });
});

describe('calculateBalthazar — CTSI severity boundaries', () => {
  it('CTSI 0 → Mild (level 1)', () => {
    const r = calculateBalthazar({ grade: 'A', necrosis: 'none' });
    expect(r.ctsi).toBe(0);
    expect(r.severity).toBe('Mild');
    expect(r.level).toBe(1);
    expect(r.ctsiLabel).toBe('0/10');
  });

  it('CTSI 3 → Mild upper edge', () => {
    // grade D (3) + necrosis none (0) = 3
    const r = calculateBalthazar({ grade: 'D', necrosis: 'none' });
    expect(r.ctsi).toBe(3);
    expect(r.severity).toBe('Mild');
    expect(r.level).toBe(1);
  });

  it('CTSI 4 → Moderate (mild→moderate boundary)', () => {
    // grade E (4) + necrosis none (0) = 4
    const r = calculateBalthazar({ grade: 'E', necrosis: 'none' });
    expect(r.ctsi).toBe(4);
    expect(r.severity).toBe('Moderate');
    expect(r.level).toBe(3);
  });

  it('CTSI 6 → Moderate upper edge', () => {
    // grade E (4) + necrosis lt30 (2) = 6
    const r = calculateBalthazar({ grade: 'E', necrosis: 'lt30' });
    expect(r.ctsi).toBe(6);
    expect(r.severity).toBe('Moderate');
    expect(r.level).toBe(3);
  });

  it('CTSI 7 → Severe (moderate→severe boundary)', () => {
    // grade D (3) + necrosis 30-50 (4) = 7
    const r = calculateBalthazar({ grade: 'D', necrosis: '30-50' });
    expect(r.ctsi).toBe(7);
    expect(r.severity).toBe('Severe');
    expect(r.level).toBe(5);
  });

  it('CTSI 10 → Severe (maximum)', () => {
    // grade E (4) + necrosis gt50 (6) = 10
    const r = calculateBalthazar({ grade: 'E', necrosis: 'gt50' });
    expect(r.ctsi).toBe(10);
    expect(r.severity).toBe('Severe');
    expect(r.level).toBe(5);
    expect(r.ctsiLabel).toBe('10/10');
  });
});

describe('calculateBalthazar — necrosis label mapping', () => {
  it('lt30 → "<30%"', () => {
    const r = calculateBalthazar({ grade: 'A', necrosis: 'lt30' });
    expect(r.necrosisLabel).toBe('<30%');
  });

  it('gt50 → ">50%"', () => {
    const r = calculateBalthazar({ grade: 'A', necrosis: 'gt50' });
    expect(r.necrosisLabel).toBe('>50%');
  });

  it('30-50 uses en-dash', () => {
    const r = calculateBalthazar({ grade: 'A', necrosis: '30-50' });
    expect(r.necrosisLabel).toBe('30–50%');
  });
});
