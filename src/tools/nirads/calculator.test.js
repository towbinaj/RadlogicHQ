import { describe, it, expect } from 'vitest';
import { calculateNirads } from './calculator.js';

// Retroactive coverage for the decision-tree tool backlog.
// See docs/test.md section 9.

describe('calculateNirads — primary category level mapping', () => {
  it.each([
    ['1',  1],
    ['2a', 2],
    ['2b', 2],
    ['3',  4],
    ['4',  5],
  ])('primary category %s → level %d', (primaryCategory, expected) => {
    const r = calculateNirads({ primaryCategory });
    expect(r.level).toBe(expected);
  });

  it('unset primary → level 0 and placeholder', () => {
    const r = calculateNirads({});
    expect(r.primaryCategory).toBe('--');
    expect(r.primaryProvided).toBe(false);
    expect(r.level).toBe(0);
  });
});

describe('calculateNirads — primary metadata', () => {
  it('populates findings, management, and recurrence for 2b', () => {
    const r = calculateNirads({ primaryCategory: '2b' });
    expect(r.primaryLabel).toContain('Low suspicion (deep)');
    expect(r.primaryFindings).toMatch(/submucosal/i);
    expect(r.primaryManagement).toMatch(/Short-interval/i);
    expect(r.primaryRecurrence).toBe('approx 29%');
  });

  it('category 3 management = biopsy', () => {
    const r = calculateNirads({ primaryCategory: '3' });
    expect(r.primaryManagement).toMatch(/Biopsy/);
    expect(r.primaryRecurrence).toBe('approx 74%');
  });

  it('category 1 recurrence approx 4%', () => {
    const r = calculateNirads({ primaryCategory: '1' });
    expect(r.primaryRecurrence).toBe('approx 4%');
  });
});

describe('calculateNirads — neck category level mapping', () => {
  it.each([
    ['1', 1],
    ['2', 2],
    ['3', 4],
    ['4', 5],
  ])('neck category %s → level %d', (neckCategory, expected) => {
    const r = calculateNirads({ neckCategory });
    expect(r.level).toBe(expected);
  });

  it('populates neck management', () => {
    expect(calculateNirads({ neckCategory: '3' }).neckManagement).toMatch(/Biopsy/);
    expect(calculateNirads({ neckCategory: '4' }).neckManagement).toMatch(/Treatment/);
  });

  it('unset neck → no label', () => {
    const r = calculateNirads({});
    expect(r.neckCategory).toBe('--');
    expect(r.neckProvided).toBe(false);
  });
});

describe('calculateNirads — combined level (max)', () => {
  it('primary 3 + neck 1 → level 4 (primary dominant)', () => {
    const r = calculateNirads({ primaryCategory: '3', neckCategory: '1' });
    expect(r.level).toBe(4);
  });

  it('primary 1 + neck 3 → level 4 (neck dominant)', () => {
    const r = calculateNirads({ primaryCategory: '1', neckCategory: '3' });
    expect(r.level).toBe(4);
  });

  it('primary 4 + neck 1 → level 5 (primary 4 wins everything)', () => {
    const r = calculateNirads({ primaryCategory: '4', neckCategory: '1' });
    expect(r.level).toBe(5);
  });

  it('both unset → level 0', () => {
    expect(calculateNirads({}).level).toBe(0);
  });

  it('primary 2a + neck 2 → level 2 (equal)', () => {
    const r = calculateNirads({ primaryCategory: '2a', neckCategory: '2' });
    expect(r.level).toBe(2);
  });
});
