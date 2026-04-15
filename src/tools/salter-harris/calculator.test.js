import { describe, it, expect } from 'vitest';
import { calculateSalterHarris } from './calculator.js';

// Retroactive coverage for the decision-tree tool backlog.
// See docs/test.md section 9.

describe('calculateSalterHarris — type → level mapping', () => {
  it.each([
    ['I',   2],
    ['II',  2],
    ['III', 3],
    ['IV',  5],
    ['V',   5],
  ])('type %s → level %d', (type, expected) => {
    const r = calculateSalterHarris({ type });
    expect(r.level).toBe(expected);
    expect(r.typeProvided).toBe(true);
  });

  it('unset type → level 0 and placeholder', () => {
    const r = calculateSalterHarris({});
    expect(r.type).toBe('--');
    expect(r.typeLabel).toBe('--');
    expect(r.level).toBe(0);
  });
});

describe('calculateSalterHarris — type metadata', () => {
  it('Type I populates anatomy and prognosis', () => {
    const r = calculateSalterHarris({ type: 'I' });
    expect(r.typeLabel).toContain('Separation');
    expect(r.anatomy).toMatch(/Physis only/i);
    expect(r.prognosis).toBe('Excellent');
    expect(r.management).toMatch(/Immobilization/i);
  });

  it('Type II mentions Thurstan Holland fragment', () => {
    const r = calculateSalterHarris({ type: 'II' });
    expect(r.anatomy).toMatch(/Thurstan Holland/i);
    expect(r.prognosis).toBe('Good');
  });

  it('Type III is intra-articular', () => {
    const r = calculateSalterHarris({ type: 'III' });
    expect(r.anatomy).toMatch(/intra-articular/i);
    expect(r.management).toMatch(/Anatomic reduction/i);
  });

  it('Type IV requires ORIF', () => {
    const r = calculateSalterHarris({ type: 'IV' });
    expect(r.management).toMatch(/internal fixation/i);
  });

  it('Type V has poor prognosis', () => {
    const r = calculateSalterHarris({ type: 'V' });
    expect(r.prognosis).toMatch(/Poor/i);
    expect(r.anatomy).toMatch(/crush/i);
  });
});

describe('calculateSalterHarris — location passthrough', () => {
  it('populates locationLabel when provided', () => {
    const r = calculateSalterHarris({ type: 'II', location: 'distal radius' });
    expect(r.locationLabel).toBe('distal radius');
    expect(r.locationProvided).toBe(true);
  });

  it('locationProvided false when absent', () => {
    const r = calculateSalterHarris({ type: 'II' });
    expect(r.locationLabel).toBe('');
    expect(r.locationProvided).toBe(false);
  });
});
