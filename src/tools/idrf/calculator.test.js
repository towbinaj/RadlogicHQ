import { describe, it, expect } from 'vitest';
import { calculateIdrf } from './calculator.js';
import { idrfDefinition } from './definition.js';

// Retroactive coverage for the oncologic-response tool backlog.
// See docs/test.md section 9.

const ALL_IDS = idrfDefinition.idrfGroups.flatMap((g) =>
  g.factors.map((f) => f.id)
);

// Helper: mark every factor as either true or false (fully assessed).
function assessAll(value) {
  const fs = {};
  for (const id of ALL_IDS) fs[id] = value;
  return fs;
}

describe('calculateIdrf — staging', () => {
  it('no IDRFs assessed → incomplete', () => {
    const r = calculateIdrf({});
    expect(r.stage).toBe('--');
    expect(r.stageLabel).toBe('Incomplete');
    expect(r.stageLevel).toBe(0);
    expect(r.reason).toMatch(/Assess/);
  });

  it('all factors assessed as false → L1', () => {
    const r = calculateIdrf(assessAll(false));
    expect(r.stage).toBe('L1');
    expect(r.stageLevel).toBe(1);
    expect(r.idrfCount).toBe(0);
    expect(r.idrfPresent).toBe(false);
    expect(r.idrfFactorList).toBe('None');
    expect(r.reason).toMatch(/No IDRFs/);
    expect(r.management).toMatch(/Localized/);
  });

  it('any factor true → L2 (high-risk)', () => {
    const r = calculateIdrf({ ...assessAll(false), carotidEncasement: true });
    expect(r.stage).toBe('L2');
    expect(r.stageLevel).toBe(3);
    expect(r.idrfCount).toBe(1);
    expect(r.idrfPresent).toBe(true);
    expect(r.reason).toMatch(/1 IDRF/);
  });

  it('multiple IDRFs → L2 with list of labels', () => {
    const r = calculateIdrf({
      ...assessAll(false),
      crossCompartment: true,
      carotidEncasement: true,
      skullBase: true,
    });
    expect(r.stage).toBe('L2');
    expect(r.idrfCount).toBe(3);
    expect(r.idrfFactors).toHaveLength(3);
    expect(r.idrfFactorList).toContain(';');
    expect(r.reason).toMatch(/3 IDRF/);
  });

  it('partial assessment with one true still yields L2', () => {
    // Only a single factor is explicitly set true; others are undefined.
    const r = calculateIdrf({ carotidEncasement: true });
    expect(r.stage).toBe('L2');
    expect(r.idrfCount).toBe(1);
  });

  it('partial assessment with only falses still classifies L1', () => {
    // Only a few factors explicitly false, but assessedCount > 0 so the
    // incomplete branch does not fire.
    const r = calculateIdrf({
      crossCompartment: false,
      carotidEncasement: false,
    });
    expect(r.stage).toBe('L1');
    expect(r.idrfCount).toBe(0);
  });
});

describe('calculateIdrf — factor list preserves definition order', () => {
  it('returns labels in idrfGroups declaration order, not formState key order', () => {
    // Pass keys in reverse — the calculator should reorder by definition.
    const reversedIds = [...ALL_IDS].reverse();
    const fs = {};
    for (const id of reversedIds.slice(0, 3)) fs[id] = true;
    const r = calculateIdrf(fs);
    const labels = r.idrfFactors;
    // The order of labels matches the idrfGroups traversal, not the reverse.
    const definitionOrder = idrfDefinition.idrfGroups
      .flatMap((g) => g.factors)
      .filter((f) => reversedIds.slice(0, 3).includes(f.id))
      .map((f) => f.label);
    expect(labels).toEqual(definitionOrder);
  });
});

describe('calculateIdrf — location label', () => {
  it.each([
    ['cervical',   'Cervical'],
    ['thoracic',   'Thoracic / Posterior mediastinum'],
    ['abdominal',  'Abdominal / Retroperitoneal'],
    ['pelvic',     'Pelvic'],
    ['adrenal',    'Adrenal'],
  ])('location %s → %s', (location, expected) => {
    const r = calculateIdrf({ location });
    expect(r.locationLabel).toBe(expected);
    expect(r.locationProvided).toBe(true);
  });

  it('unset location → empty label', () => {
    const r = calculateIdrf({});
    expect(r.locationLabel).toBe('');
    expect(r.locationProvided).toBe(false);
  });
});
