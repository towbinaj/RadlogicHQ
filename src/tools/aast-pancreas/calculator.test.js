import { describe, it, expect } from 'vitest';
import { calculateAast } from '../aast-liver/calculator.js';
import { aastPancreasDefinition } from './definition.js';

// Retroactive coverage for the AAST-family backlog.
// See docs/test.md section 9. aast-pancreas uses the shared
// calculateAast from aast-liver, exercised here against the
// pancreas definition with its duct-injury grading nuance.

function side(findingIds, multipleInjuries = false) {
  return {
    selectedFindings: new Set(findingIds),
    multipleInjuries,
  };
}

describe('calculateAast + aastPancreasDefinition — grades', () => {
  it.each([
    // Parenchymal injury
    ['contusion-minor',       1],  // Minor contusion, no duct
    ['lac-superficial',       1],  // Superficial laceration, no duct
    ['contusion-major',       2],  // Major contusion, no duct
    ['lac-major',             2],  // Major laceration, no duct
    // Ductal injury
    ['distal-transection',    3],  // Distal transection with duct (left of SMV)
    ['proximal-transection',  4],  // Proximal transection with duct (right of SMV)
    // Massive disruption
    ['massive-head',          5],  // Massive head disruption
  ])('finding %s → grade %d', (findingId, expected) => {
    const r = calculateAast(side([findingId]), aastPancreasDefinition);
    expect(r.grade).toBe(expected);
    expect(r.organ).toBe('Pancreas');
    expect(r.hasFindings).toBe(true);
  });
});

describe('calculateAast + aastPancreasDefinition — duct injury is the hinge', () => {
  it('major laceration without duct = Grade II', () => {
    const r = calculateAast(side(['lac-major']), aastPancreasDefinition);
    expect(r.grade).toBe(2);
  });

  it('distal transection with duct = Grade III', () => {
    const r = calculateAast(side(['distal-transection']), aastPancreasDefinition);
    expect(r.grade).toBe(3);
  });

  it('proximal (head-side) duct injury = Grade IV — worse than distal', () => {
    const r = calculateAast(
      side(['proximal-transection']),
      aastPancreasDefinition,
    );
    expect(r.grade).toBe(4);
  });

  it('massive head disruption = Grade V (top)', () => {
    const r = calculateAast(side(['massive-head']), aastPancreasDefinition);
    expect(r.grade).toBe(5);
  });
});

describe('calculateAast + aastPancreasDefinition — max-grade rule', () => {
  it('multiple findings → highest grade wins', () => {
    const r = calculateAast(
      side(['contusion-minor', 'proximal-transection']),
      aastPancreasDefinition,
    );
    expect(r.grade).toBe(4);
    expect(r.selectedCount).toBe(2);
  });
});

describe('calculateAast + aastPancreasDefinition — multiple-injury upgrade', () => {
  it('Grade I + multipleInjuries → upgraded to III', () => {
    const r = calculateAast(
      side(['contusion-minor'], true),
      aastPancreasDefinition,
    );
    expect(r.grade).toBe(3);
    expect(r.findingsText).toContain('Multiple low-grade injuries present');
  });

  it('Grade II + multipleInjuries → upgraded to III', () => {
    const r = calculateAast(
      side(['contusion-major'], true),
      aastPancreasDefinition,
    );
    expect(r.grade).toBe(3);
  });

  it('Grade III + multipleInjuries stays at III', () => {
    const r = calculateAast(
      side(['distal-transection'], true),
      aastPancreasDefinition,
    );
    expect(r.grade).toBe(3);
  });

  it('Grade V stays at V regardless of multipleInjuries', () => {
    const r = calculateAast(
      side(['massive-head'], true),
      aastPancreasDefinition,
    );
    expect(r.grade).toBe(5);
  });
});

describe('calculateAast + aastPancreasDefinition — findings text', () => {
  it('groups by category label', () => {
    const r = calculateAast(
      side(['contusion-minor', 'distal-transection']),
      aastPancreasDefinition,
    );
    expect(r.findingsText).toContain('Parenchymal Injury:');
    expect(r.findingsText).toContain('Ductal Injury:');
  });
});

describe('calculateAast + aastPancreasDefinition — edge cases', () => {
  it('empty Set → no findings', () => {
    const r = calculateAast(side([]), aastPancreasDefinition);
    expect(r.grade).toBeNull();
    expect(r.gradeLabel).toBe('--');
  });
});
