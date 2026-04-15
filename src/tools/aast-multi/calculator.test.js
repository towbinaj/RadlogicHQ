import { describe, it, expect } from 'vitest';
import { calculateAast } from '../aast-liver/calculator.js';
import { aastMultiDefinition, organs } from './definition.js';

// Retroactive coverage for the AAST-family backlog.
// See docs/test.md section 9.
//
// aast-multi is a composition of the 4 individual AAST organ
// tools (liver, spleen, kidney, pancreas). Its runtime logic
// lives inside aast-multi.js init() as closure-scoped functions
// that can't be imported directly. What IS unit-testable is the
// invariant the composition relies on: all 4 organ definitions
// share a compatible interface with calculateAast and each one
// produces a well-formed per-organ result.
//
// This file locks that invariant in: if someone adds a new
// organ field or changes the categories/findings shape in a
// way that breaks one definition, the multi-trauma tool will
// silently malfunction. These tests make the breakage loud.

function side(findingIds, multipleInjuries = false) {
  return {
    selectedFindings: new Set(findingIds),
    multipleInjuries,
  };
}

describe('aast-multi — composition shape', () => {
  it('aastMultiDefinition.organs is the same array as the imported organs', () => {
    expect(aastMultiDefinition.organs).toBe(organs);
  });

  it('organs array has all 4 AAST tools', () => {
    expect(organs).toHaveLength(4);
    const ids = organs.map((o) => o.id);
    expect(ids).toEqual([
      'aast-liver',
      'aast-spleen',
      'aast-kidney',
      'aast-pancreas',
    ]);
  });

  it('each organ exposes an organ name, categories, and parseRules', () => {
    for (const org of organs) {
      expect(typeof org.organ).toBe('string');
      expect(org.organ.length).toBeGreaterThan(0);
      expect(Array.isArray(org.categories)).toBe(true);
      expect(org.categories.length).toBeGreaterThan(0);
      expect(typeof org.parseRules).toBe('object');
    }
  });

  it('every category has a label and findings array', () => {
    for (const org of organs) {
      for (const cat of org.categories) {
        expect(typeof cat.label).toBe('string');
        expect(Array.isArray(cat.findings)).toBe(true);
        expect(cat.findings.length).toBeGreaterThan(0);
      }
    }
  });

  it('every finding has id, label, and grade 1-5', () => {
    for (const org of organs) {
      for (const cat of org.categories) {
        for (const f of cat.findings) {
          expect(typeof f.id).toBe('string');
          expect(typeof f.label).toBe('string');
          expect(f.grade).toBeGreaterThanOrEqual(1);
          expect(f.grade).toBeLessThanOrEqual(5);
        }
      }
    }
  });

  it('finding IDs are unique within each organ', () => {
    for (const org of organs) {
      const ids = new Set();
      for (const cat of org.categories) {
        for (const f of cat.findings) {
          expect(ids.has(f.id)).toBe(false);
          ids.add(f.id);
        }
      }
    }
  });
});

describe('aast-multi — calculateAast accepts every organ definition', () => {
  it.each([
    'aast-liver',
    'aast-spleen',
    'aast-kidney',
    'aast-pancreas',
  ])('%s: empty Set → null grade, no findings', (orgId) => {
    const org = organs.find((o) => o.id === orgId);
    const r = calculateAast(side([]), org);
    expect(r.grade).toBeNull();
    expect(r.gradeLabel).toBe('--');
    expect(r.hasFindings).toBe(false);
    expect(r.organ).toBe(org.organ);
  });

  it.each([
    'aast-liver',
    'aast-spleen',
    'aast-kidney',
    'aast-pancreas',
  ])('%s: first finding of every category yields a valid grade', (orgId) => {
    const org = organs.find((o) => o.id === orgId);
    // Pick one finding per category to exercise every category
    // label in the findingsText output.
    const picks = org.categories.map((c) => c.findings[0].id);
    const r = calculateAast(side(picks), org);
    expect(r.grade).toBeGreaterThanOrEqual(1);
    expect(r.grade).toBeLessThanOrEqual(5);
    // Every category we picked from should appear in findingsText.
    for (const cat of org.categories) {
      expect(r.findingsText).toContain(cat.label);
    }
  });

  it.each([
    'aast-liver',
    'aast-spleen',
    'aast-kidney',
    'aast-pancreas',
  ])('%s: highest-grade finding per organ → grade 5 reachable', (orgId) => {
    const org = organs.find((o) => o.id === orgId);
    const grade5Findings = org.categories
      .flatMap((c) => c.findings)
      .filter((f) => f.grade === 5);
    // Every organ we test should have at least one Grade 5 finding —
    // that's the definition of complete disruption in each scale.
    expect(grade5Findings.length).toBeGreaterThan(0);
    const r = calculateAast(side([grade5Findings[0].id]), org);
    expect(r.grade).toBe(5);
  });
});

describe('aast-multi — multi-organ scenario', () => {
  it('simulates a polytrauma case by running each organ independently', () => {
    // Polytrauma: liver Grade III lac + spleen Grade IV devasc +
    // kidney Grade II subcap + pancreas Grade IV proximal transection.
    // aast-multi would store one formState per organ and call
    // calculateAast for each. We assert each per-organ result lines
    // up correctly — the multi-tool is just a 4x loop over this.
    const liver = calculateAast(
      side(['lac-gt3']),  // Grade III liver laceration >3 cm
      organs.find((o) => o.id === 'aast-liver'),
    );
    const spleen = calculateAast(
      side(['devasc-gt25']),  // Grade IV spleen devascularization
      organs.find((o) => o.id === 'aast-spleen'),
    );
    const kidney = calculateAast(
      side(['perirenal-nonexpanding']),  // Grade II kidney hematoma
      organs.find((o) => o.id === 'aast-kidney'),
    );
    const pancreas = calculateAast(
      side(['proximal-transection']),  // Grade IV pancreas duct injury
      organs.find((o) => o.id === 'aast-pancreas'),
    );

    expect(liver.grade).toBe(3);
    expect(spleen.grade).toBe(4);
    expect(kidney.grade).toBe(2);
    expect(pancreas.grade).toBe(4);

    // Each result has the organ name so aast-multi templates can
    // render per-organ sections without ambiguity.
    expect(liver.organ).toBe('Liver');
    expect(spleen.organ).toBe('Spleen');
    expect(kidney.organ).toBe('Kidney');
    expect(pancreas.organ).toBe('Pancreas');
  });
});
