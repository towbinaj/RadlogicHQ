import { describe, it, expect } from 'vitest';
import { calculateAast } from '../aast-liver/calculator.js';
import { aastKidneyDefinition } from './definition.js';

// Retroactive coverage for commit e49ee76 (Set/array conversion in
// applyParsedToSide). aast-kidney uses the shared calculateAast from
// aast-liver; this file exercises it against the kidney definition
// specifically, including the kidney-only grade-4/5 findings and the
// multiple-injury upgrade rule. See docs/test.md section 9.
//
// applyParsedToSide itself is closure-scoped inside aast-kidney.js init(),
// so it can't be imported directly. The key invariant it enforces —
// calculateAast correctly handles a Set<string> for selectedFindings — is
// covered here at the calculator level.

function side(findingIds, multipleInjuries = false) {
  return {
    selectedFindings: new Set(findingIds),
    multipleInjuries,
  };
}

describe('calculateAast + aastKidneyDefinition — single finding grades', () => {
  it.each([
    ['sub-nonexpanding',       1],
    ['perirenal-nonexpanding', 2],
    ['lac-lt1',                2],
    ['lac-gt1',                3],
    ['contained',              3],
    ['active-sub',             4],
    ['active-beyond',          4],
    ['urine-extrav',           4],
    ['lac-pelvis',             4],
    ['devasc-segmental',       4],
    ['shattered',              5],
    ['devasc-main',            5],
    ['devascularized',         5],
  ])('finding %s yields grade %d', (findingId, expectedGrade) => {
    const r = calculateAast(side([findingId]), aastKidneyDefinition);
    expect(r.grade).toBe(expectedGrade);
    expect(r.gradeLevel).toBe(expectedGrade);
    expect(r.organ).toBe('Kidney');
    expect(r.hasFindings).toBe(true);
    expect(r.selectedCount).toBe(1);
  });
});

describe('calculateAast + aastKidneyDefinition — max-grade rule', () => {
  it('picks the highest grade when multiple findings are selected', () => {
    const r = calculateAast(
      side(['sub-nonexpanding', 'urine-extrav', 'lac-lt1']),
      aastKidneyDefinition,
    );
    // Grades: 1, 4, 2 → max = 4.
    expect(r.grade).toBe(4);
    expect(r.gradeLabel).toBe('Grade IV');
    expect(r.selectedCount).toBe(3);
  });

  it('grade V wins when a shattered kidney is present', () => {
    const r = calculateAast(
      side(['perirenal-nonexpanding', 'shattered']),
      aastKidneyDefinition,
    );
    expect(r.grade).toBe(5);
    expect(r.gradeLabel).toBe('Grade V');
  });
});

describe('calculateAast + aastKidneyDefinition — multiple-injury upgrade', () => {
  it('two Grade I findings + multipleInjuries → upgraded to Grade III', () => {
    const r = calculateAast(
      side(['sub-nonexpanding'], true),
      aastKidneyDefinition,
    );
    // Grade 1 base, upgraded by the multipleInjuries flag.
    expect(r.grade).toBe(3);
    expect(r.gradeLabel).toBe('Grade III');
    expect(r.multipleInjuries).toBe(true);
    expect(r.findingsText).toContain('Multiple low-grade injuries present');
  });

  it('Grade II + multipleInjuries → upgraded to Grade III', () => {
    const r = calculateAast(
      side(['perirenal-nonexpanding'], true),
      aastKidneyDefinition,
    );
    expect(r.grade).toBe(3);
  });

  it('Grade III + multipleInjuries stays at Grade III (no upgrade)', () => {
    const r = calculateAast(
      side(['lac-gt1'], true),
      aastKidneyDefinition,
    );
    expect(r.grade).toBe(3);
  });

  it('Grade IV + multipleInjuries stays at Grade IV (rule only upgrades 1/2)', () => {
    const r = calculateAast(
      side(['urine-extrav'], true),
      aastKidneyDefinition,
    );
    expect(r.grade).toBe(4);
  });
});

describe('calculateAast + aastKidneyDefinition — findings text', () => {
  it('groups findings by category label in findingsText', () => {
    const r = calculateAast(
      side(['sub-nonexpanding', 'lac-gt1', 'shattered']),
      aastKidneyDefinition,
    );
    expect(r.findingsText).toContain('Hematoma:');
    expect(r.findingsText).toContain('Laceration:');
    expect(r.findingsText).toContain('Collecting System and Parenchyma:');
  });
});

describe('calculateAast + aastKidneyDefinition — edge cases', () => {
  it('empty Set returns no findings', () => {
    const r = calculateAast(side([]), aastKidneyDefinition);
    expect(r.grade).toBeNull();
    expect(r.gradeLabel).toBe('--');
    expect(r.hasFindings).toBe(false);
    expect(r.findingsText).toBe('No injuries identified.');
    expect(r.selectedCount).toBe(0);
  });

  it('undefined selectedFindings is handled gracefully', () => {
    const r = calculateAast({}, aastKidneyDefinition);
    expect(r.grade).toBeNull();
    expect(r.hasFindings).toBe(false);
  });

  it('empty-Set + multipleInjuries does NOT create a phantom grade', () => {
    const r = calculateAast(
      { selectedFindings: new Set(), multipleInjuries: true },
      aastKidneyDefinition,
    );
    // maxGrade stays 0 — upgrade rule requires maxGrade > 0.
    expect(r.grade).toBeNull();
  });
});
