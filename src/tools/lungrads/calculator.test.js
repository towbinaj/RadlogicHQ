import { describe, it, expect } from 'vitest';
import { calculateLungrads } from './calculator.js';

// Retroactive coverage for Phase 2 multi-item parse rollout.
// See docs/test.md section 9.

describe('calculateLungrads — incomplete inputs', () => {
  it('no noduleType returns incomplete', () => {
    const r = calculateLungrads({ size: 8 });
    expect(r.category).toBe('--');
    expect(r.categoryLabel).toBe('Incomplete');
  });

  it('no size returns incomplete', () => {
    const r = calculateLungrads({ noduleType: 'solid' });
    expect(r.category).toBe('--');
    expect(r.sizeProvided).toBe(false);
  });
});

describe('calculateLungrads — solid nodule size boundaries', () => {
  it.each([
    [5.9, '2'],
    [6,   '3'],
    [7.9, '3'],
    [8,   '4A'],
    [14.9, '4A'],
    [15,  '4B'],
    [25,  '4B'],
  ])('solid %d mm → category %s', (size, expected) => {
    const r = calculateLungrads({ noduleType: 'solid', size });
    expect(r.category).toBe(expected);
  });
});

describe('calculateLungrads — ground glass size boundary', () => {
  it('GGN <30 mm → category 2', () => {
    const r = calculateLungrads({ noduleType: 'groundGlass', size: 25 });
    expect(r.category).toBe('2');
  });

  it('GGN exactly 30 mm → category 3 (boundary)', () => {
    const r = calculateLungrads({ noduleType: 'groundGlass', size: 30 });
    expect(r.category).toBe('3');
  });
});

describe('calculateLungrads — part-solid nodule', () => {
  it('total <6 mm → category 2 (solid component irrelevant)', () => {
    const r = calculateLungrads({
      noduleType: 'partSolid', size: 5, solidSize: 4,
    });
    expect(r.category).toBe('2');
  });

  it('total ≥6 mm, solid <6 mm → category 3', () => {
    const r = calculateLungrads({
      noduleType: 'partSolid', size: 10, solidSize: 4,
    });
    expect(r.category).toBe('3');
  });

  it('total ≥6 mm, solid 6-<8 mm → category 4A', () => {
    const r = calculateLungrads({
      noduleType: 'partSolid', size: 12, solidSize: 7,
    });
    expect(r.category).toBe('4A');
  });

  it('total ≥6 mm, solid ≥8 mm → category 4B', () => {
    const r = calculateLungrads({
      noduleType: 'partSolid', size: 12, solidSize: 10,
    });
    expect(r.category).toBe('4B');
  });

  it('part-solid >=6 mm with missing solidSize is incomplete (not silently 0 mm)', () => {
    const r = calculateLungrads({
      noduleType: 'partSolid', size: 10,
    });
    expect(r.category).toBe('--');
  });
});

describe('calculateLungrads — growth adjustments', () => {
  it('new solid ≥6 mm → upgraded to 4A', () => {
    const r = calculateLungrads({
      noduleType: 'solid', size: 7, priorComparison: 'new',
    });
    // Base 7 mm solid = 3, but "new" upgrades to 4A.
    expect(r.category).toBe('4A');
  });

  it('new solid 4-5 mm → upgraded from 2 to 3', () => {
    const r = calculateLungrads({
      noduleType: 'solid', size: 5, priorComparison: 'new',
    });
    expect(r.category).toBe('3');
  });

  it('new solid <4 mm stays at 2', () => {
    const r = calculateLungrads({
      noduleType: 'solid', size: 3, priorComparison: 'new',
    });
    expect(r.category).toBe('2');
  });

  it('growing solid <8 mm → 4A (v2022), not one-step upgrade to 3', () => {
    const r = calculateLungrads({
      noduleType: 'solid', size: 5, priorComparison: 'growing',
    });
    expect(r.category).toBe('4A');
  });

  it('growing upgrades 3 → 4A', () => {
    const r = calculateLungrads({
      noduleType: 'solid', size: 7, priorComparison: 'growing',
    });
    expect(r.category).toBe('4A');
  });

  it('growing upgrades 4A → 4B', () => {
    const r = calculateLungrads({
      noduleType: 'solid', size: 10, priorComparison: 'growing',
    });
    expect(r.category).toBe('4B');
  });
});

describe('calculateLungrads — suspicious features (X modifier)', () => {
  it('suspicious on category 3 → 4X', () => {
    const r = calculateLungrads({
      noduleType: 'solid', size: 7, suspicious: 'present',
    });
    expect(r.category).toBe('4X');
  });

  it('suspicious on category 4A → 4X', () => {
    const r = calculateLungrads({
      noduleType: 'solid', size: 10, suspicious: 'present',
    });
    expect(r.category).toBe('4X');
  });

  it('suspicious on category 2 does NOT upgrade', () => {
    const r = calculateLungrads({
      noduleType: 'solid', size: 5, suspicious: 'present',
    });
    expect(r.category).toBe('2');
  });
});

describe('calculateLungrads — metadata', () => {
  it('populates sizeCm and noduleTypeLabel', () => {
    const r = calculateLungrads({
      noduleType: 'groundGlass', size: 25,
    });
    expect(r.sizeCm).toBe('2.5');
    expect(r.noduleTypeLabel).toBe('Ground glass');
  });

  it('reason string describes the inputs', () => {
    const r = calculateLungrads({
      noduleType: 'partSolid', size: 12, solidSize: 7,
      priorComparison: 'growing',
    });
    expect(r.reason).toContain('Part-solid');
    expect(r.reason).toContain('12 mm');
    expect(r.reason).toContain('solid component 7 mm');
    expect(r.reason).toContain('growing');
  });

  it('category 4B carries Very Suspicious management', () => {
    const r = calculateLungrads({ noduleType: 'solid', size: 20 });
    expect(r.management).toMatch(/tissue sampling/i);
    expect(r.categoryLevel).toBe(5);
  });
});

// --- Audit fix: ACR Lung-RADS v2022 new / growing rules ---
describe('calculateLungrads — v2022 new and growing nodules', () => {
  const c = (fs) => calculateLungrads(fs).category;

  it.each([
    // solid, new
    [{ noduleType: 'solid', size: 3, priorComparison: 'new' }, '2'],
    [{ noduleType: 'solid', size: 5, priorComparison: 'new' }, '3'],
    [{ noduleType: 'solid', size: 7, priorComparison: 'new' }, '4A'],
    [{ noduleType: 'solid', size: 8, priorComparison: 'new' }, '4B'],
    [{ noduleType: 'solid', size: 20, priorComparison: 'new' }, '4B'],
    // solid, growing
    [{ noduleType: 'solid', size: 7.9, priorComparison: 'growing' }, '4A'],
    [{ noduleType: 'solid', size: 8, priorComparison: 'growing' }, '4B'],
    // part-solid, new / growing
    [{ noduleType: 'partSolid', size: 5, priorComparison: 'new' }, '3'],
    [{ noduleType: 'partSolid', size: 5, priorComparison: 'growing' }, '3'],
    [{ noduleType: 'partSolid', size: 10, solidSize: 3, priorComparison: 'new' }, '4A'],
    [{ noduleType: 'partSolid', size: 10, solidSize: 4, priorComparison: 'new' }, '4B'],
    [{ noduleType: 'partSolid', size: 10, solidSize: 5, priorComparison: 'growing' }, '4B'],
    // ground glass, growing <30 mm stays 2
    [{ noduleType: 'groundGlass', size: 20, priorComparison: 'growing' }, '2'],
    [{ noduleType: 'groundGlass', size: 30, priorComparison: 'new' }, '3'],
  ])('%j -> %s', (fs, cat) => {
    expect(c(fs)).toBe(cat);
  });

  it('baseline categories unchanged', () => {
    expect(c({ noduleType: 'solid', size: 20 })).toBe('4B');
    expect(c({ noduleType: 'solid', size: 10 })).toBe('4A');
    expect(c({ noduleType: 'partSolid', size: 10, solidSize: 7 })).toBe('4A');
  });

  it('part-solid >=6 mm without a solid component size is incomplete', () => {
    const r = calculateLungrads({ noduleType: 'partSolid', size: 10 });
    expect(r.category).toBe('--');
  });
});
