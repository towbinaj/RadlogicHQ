import { describe, it, expect } from 'vitest';
import { calculateAast } from '../aast-liver/calculator.js';
import { aastSpleenDefinition } from './definition.js';

// Retroactive coverage for the AAST-family backlog.
// See docs/test.md section 9. aast-spleen uses the shared
// calculateAast from aast-liver; this file exercises it against
// the spleen definition specifically, covering every spleen-only
// grade assignment.

function side(findingIds, multipleInjuries = false) {
  return {
    selectedFindings: new Set(findingIds),
    multipleInjuries,
  };
}

describe('calculateAast + aastSpleenDefinition — grades', () => {
  it.each([
    ['sub-lt10',          1],  // Subcapsular <10%
    ['lac-lt1',           1],  // <1 cm laceration
    ['sub-10-50',         2],  // Subcapsular 10-50%
    ['intra-lt5cm',       2],  // Intraparenchymal <5 cm
    ['lac-1-3',           2],  // 1-3 cm laceration
    ['sub-gt50',          3],  // Subcapsular >50% or ruptured
    ['intra-gte5cm',      3],  // Intraparenchymal ≥5 cm
    ['lac-gt3',           3],  // >3 cm laceration
    ['devasc-gt25',       4],  // >25% devascularization
    ['pseudoaneurysm',    4],  // Pseudoaneurysm / AVF
    ['extrav-contained',  4],  // Contained active bleeding
    ['shattered',         5],  // Shattered spleen
    ['extrav-peritoneal', 5],  // Peritoneal extravasation
  ])('finding %s → grade %d', (findingId, expected) => {
    const r = calculateAast(side([findingId]), aastSpleenDefinition);
    expect(r.grade).toBe(expected);
    expect(r.organ).toBe('Spleen');
    expect(r.hasFindings).toBe(true);
  });
});

describe('calculateAast + aastSpleenDefinition — max-grade rule', () => {
  it('multiple findings → highest grade wins', () => {
    const r = calculateAast(
      side(['sub-lt10', 'lac-gt3', 'intra-lt5cm']),
      aastSpleenDefinition,
    );
    // Grades 1, 3, 2 → max = 3.
    expect(r.grade).toBe(3);
    expect(r.gradeLabel).toBe('Grade III');
    expect(r.selectedCount).toBe(3);
  });

  it('shattered + any other finding → grade 5', () => {
    const r = calculateAast(
      side(['sub-lt10', 'shattered']),
      aastSpleenDefinition,
    );
    expect(r.grade).toBe(5);
  });
});

describe('calculateAast + aastSpleenDefinition — multiple-injury upgrade', () => {
  it('Grade I + multipleInjuries → upgraded to III', () => {
    const r = calculateAast(
      side(['sub-lt10'], true),
      aastSpleenDefinition,
    );
    expect(r.grade).toBe(3);
    expect(r.findingsText).toContain('Multiple low-grade injuries present');
  });

  it('Grade II + multipleInjuries → upgraded to III', () => {
    const r = calculateAast(
      side(['lac-1-3'], true),
      aastSpleenDefinition,
    );
    expect(r.grade).toBe(3);
  });

  it('Grade III + multipleInjuries stays at III (no upgrade)', () => {
    const r = calculateAast(
      side(['lac-gt3'], true),
      aastSpleenDefinition,
    );
    expect(r.grade).toBe(3);
  });

  it('Grade IV + multipleInjuries stays at IV', () => {
    const r = calculateAast(
      side(['devasc-gt25'], true),
      aastSpleenDefinition,
    );
    expect(r.grade).toBe(4);
  });
});

describe('calculateAast + aastSpleenDefinition — findings text', () => {
  it('groups findings by category label', () => {
    const r = calculateAast(
      side(['sub-lt10', 'lac-gt3', 'shattered']),
      aastSpleenDefinition,
    );
    expect(r.findingsText).toContain('Hematoma:');
    expect(r.findingsText).toContain('Laceration:');
    expect(r.findingsText).toContain('Devascularization:');
  });
});

describe('calculateAast + aastSpleenDefinition — edge cases', () => {
  it('empty Set → no findings, null grade', () => {
    const r = calculateAast(side([]), aastSpleenDefinition);
    expect(r.grade).toBeNull();
    expect(r.gradeLabel).toBe('--');
    expect(r.findingsText).toBe('No injuries identified.');
  });

  it('empty Set + multipleInjuries does NOT create phantom grade', () => {
    const r = calculateAast(
      { selectedFindings: new Set(), multipleInjuries: true },
      aastSpleenDefinition,
    );
    expect(r.grade).toBeNull();
  });
});
