import { describe, it, expect } from 'vitest';
import { calculatePirads } from './calculator.js';

// Retroactive coverage for Phase 2 multi-item parse rollout.
// See docs/test.md section 9.

describe('calculatePirads — incomplete inputs', () => {
  it('no location → incomplete', () => {
    const r = calculatePirads({ dwiScore: '4' });
    expect(r.category).toBe('--');
    expect(r.reason).toMatch(/zone/i);
  });

  it('PZ with no DWI → incomplete', () => {
    const r = calculatePirads({ location: 'pz', t2Score: '3' });
    expect(r.category).toBe('--');
    expect(r.reason).toMatch(/DWI/);
  });

  it('TZ with no T2 → incomplete', () => {
    const r = calculatePirads({ location: 'tz', dwiScore: '3' });
    expect(r.category).toBe('--');
    expect(r.reason).toMatch(/T2/);
  });
});

describe('calculatePirads — PZ (DWI-dominant)', () => {
  it.each([
    [1, 'Very Low'],
    [2, 'Low'],
    [3, 'Intermediate'],
    [4, 'High'],
    [5, 'Very High'],
  ])('DWI %d → PI-RADS %d (%s)', (dwi, label) => {
    const r = calculatePirads({ location: 'pz', dwiScore: String(dwi) });
    expect(r.categoryShort).toBe(dwi);
    expect(r.categoryLabel).toBe(label);
    expect(r.categoryLevel).toBe(dwi);
  });

  it('DWI 3 + DCE positive → upgraded to PI-RADS 4', () => {
    const r = calculatePirads({
      location: 'pz', dwiScore: '3', dce: 'positive',
    });
    expect(r.categoryShort).toBe(4);
    expect(r.reason).toMatch(/upgraded/i);
  });

  it('DWI 3 + DCE negative → stays at PI-RADS 3', () => {
    const r = calculatePirads({
      location: 'pz', dwiScore: '3', dce: 'negative',
    });
    expect(r.categoryShort).toBe(3);
  });

  it('DWI 2 + DCE positive does NOT upgrade (rule only applies to DWI 3)', () => {
    const r = calculatePirads({
      location: 'pz', dwiScore: '2', dce: 'positive',
    });
    expect(r.categoryShort).toBe(2);
  });

  it('cz treated as PZ (DWI-dominant)', () => {
    const r = calculatePirads({ location: 'cz', dwiScore: '4' });
    expect(r.categoryShort).toBe(4);
  });

  it('afs treated as PZ (DWI-dominant)', () => {
    const r = calculatePirads({ location: 'afs', dwiScore: '5' });
    expect(r.categoryShort).toBe(5);
  });
});

describe('calculatePirads — TZ (T2-dominant)', () => {
  it.each([
    [1, 'Very Low'],
    [2, 'Low'],
    [3, 'Intermediate'],
    [4, 'High'],
    [5, 'Very High'],
  ])('T2 %d → PI-RADS %d (%s)', (t2, label) => {
    const r = calculatePirads({ location: 'tz', t2Score: String(t2) });
    expect(r.categoryShort).toBe(t2);
    expect(r.categoryLabel).toBe(label);
  });

  it('T2 3 + DWI 5 → upgraded to PI-RADS 4', () => {
    const r = calculatePirads({
      location: 'tz', t2Score: '3', dwiScore: '5',
    });
    expect(r.categoryShort).toBe(4);
    expect(r.reason).toMatch(/upgraded/i);
  });

  it('T2 3 + DWI 4 does NOT upgrade (rule requires DWI 5)', () => {
    const r = calculatePirads({
      location: 'tz', t2Score: '3', dwiScore: '4',
    });
    expect(r.categoryShort).toBe(3);
  });

  it('T2 2 + DWI 5 does NOT upgrade (rule only applies to T2 3)', () => {
    const r = calculatePirads({
      location: 'tz', t2Score: '2', dwiScore: '5',
    });
    expect(r.categoryShort).toBe(2);
  });
});

describe('calculatePirads — metadata', () => {
  it('populates zoneLabel and sizeCm', () => {
    const r = calculatePirads({
      location: 'pz', dwiScore: '4', size: 12,
    });
    expect(r.zoneLabel).toBe('Peripheral zone');
    expect(r.sizeCm).toBe('1.2');
    expect(r.category).toBe('PI-RADS 4');
  });

  it('epe label populated when provided', () => {
    const r = calculatePirads({
      location: 'pz', dwiScore: '5', epe: 'present',
    });
    expect(r.epeLabel).toBe('Present');
    expect(r.epeProvided).toBe(true);
  });

  it('missing scores labelled as Not assessed', () => {
    const r = calculatePirads({ location: 'pz', dwiScore: '3' });
    expect(r.t2Label).toBe('Not assessed');
    expect(r.dceLabel).toBe('Not assessed');
    expect(r.epeLabel).toBe('Not assessed');
  });
});
