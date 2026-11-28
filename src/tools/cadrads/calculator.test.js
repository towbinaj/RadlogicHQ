import { describe, it, expect } from 'vitest';
import { calculateCadrads } from './calculator.js';

// Retroactive coverage for the decision-tree tool backlog.
// See docs/test.md section 9.

describe('calculateCadrads — category → level mapping', () => {
  it.each([
    ['0',  1],
    ['1',  2],
    ['2',  2],
    ['3',  3],
    ['4A', 5],
    ['4B', 5],
    ['5',  5],
    ['N',  2],
  ])('category %s → level %d', (category, expectedLevel) => {
    const r = calculateCadrads({ category });
    expect(r.level).toBe(expectedLevel);
  });

  it('unset category → level 0 and placeholder', () => {
    const r = calculateCadrads({});
    expect(r.category).toBe('--');
    expect(r.level).toBe(0);
    expect(r.fullLabel).toBe('--');
    expect(r.categoryProvided).toBe(false);
  });
});

describe('calculateCadrads — category metadata', () => {
  it('populates stenosis and management for category 3', () => {
    const r = calculateCadrads({ category: '3' });
    expect(r.categoryLabel).toContain('Moderate');
    expect(r.stenosis).toBe('50–69%');
    expect(r.management).toMatch(/functional assessment/i);
    expect(r.managementProvided).toBe(true);
  });

  it('populates management for 4A', () => {
    const r = calculateCadrads({ category: '4A' });
    expect(r.management).toMatch(/ICA/);
  });

  it('populates management for 5 (total occlusion)', () => {
    const r = calculateCadrads({ category: '5' });
    expect(r.stenosis).toBe('100%');
    expect(r.management).toMatch(/viability/i);
  });

  it('N (non-diagnostic) has N/A stenosis', () => {
    const r = calculateCadrads({ category: 'N' });
    expect(r.stenosis).toBe('N/A');
    expect(r.management).toMatch(/alternative/i);
  });
});

describe('calculateCadrads — modifiers', () => {
  it('single modifier appears in fullLabel and modifiersText', () => {
    const r = calculateCadrads({ category: '3', modifiers: ['HRP'] });
    expect(r.fullLabel).toBe('CAD-RADS 3/HRP');
    expect(r.modifiersText).toContain('HRP');
    expect(r.modifiersProvided).toBe(true);
  });

  it('multiple modifiers join with /', () => {
    // 2.0 order: plaque burden, HRP, I, S, G, E regardless of click order.
    const r = calculateCadrads({ category: '4A', modifiers: ['S', 'HRP'] });
    expect(r.fullLabel).toBe('CAD-RADS 4A/HRP/S');
  });

  it('empty modifiers array → no /', () => {
    const r = calculateCadrads({ category: '2', modifiers: [] });
    expect(r.fullLabel).toBe('CAD-RADS 2');
    expect(r.modifiersProvided).toBe(false);
  });

  it('unknown modifier id is filtered out of both text and label', () => {
    const r = calculateCadrads({ category: '2', modifiers: ['XYZ'] });
    // Only real modifier IDs count — modLabels is empty, so the
    // append-to-fullLabel branch never fires.
    expect(r.modifiersText).toBe('');
    expect(r.modifiersProvided).toBe(false);
    expect(r.fullLabel).toBe('CAD-RADS 2');
  });
});

describe('calculateCadrads — plaque burden', () => {
  it('plaque burden appended in parens to fullLabel', () => {
    const r = calculateCadrads({ category: '2', plaqueBurden: 'P2' });
    expect(r.fullLabel).toBe('CAD-RADS 2/P2');
    expect(r.plaqueBurdenLabel).toContain('Moderate');
    expect(r.plaqueBurdenProvided).toBe(true);
  });

  it('modifiers + plaque burden combine correctly', () => {
    const r = calculateCadrads({
      category: '4A',
      modifiers: ['HRP'],
      plaqueBurden: 'P4',
    });
    expect(r.fullLabel).toBe('CAD-RADS 4A/P4/HRP');
  });

  it('unknown plaque burden id omitted', () => {
    const r = calculateCadrads({ category: '1', plaqueBurden: 'P9' });
    expect(r.plaqueBurdenProvided).toBe(false);
    expect(r.fullLabel).toBe('CAD-RADS 1');
  });
});

describe('CAD-RADS 2.0 modifiers and plaque burden (audit 2026-11-28)', () => {
  it('label order: category/P/HRP/I/S/G/E', () => {
    const r = calculateCadrads({ category: '3', plaqueBurden: 'P2', modifiers: ['E', 'S', 'I+', 'HRP', 'G'] });
    expect(r.fullLabel).toBe('CAD-RADS 3/P2/HRP/I+/S/G/E');
  });
  it('only one ischemia modifier is kept (last chosen)', () => {
    expect(calculateCadrads({ category: '3', modifiers: ['I+', 'I-'] }).fullLabel).toBe('CAD-RADS 3/I-');
  });
  it('legacy V reads as HRP', () => {
    expect(calculateCadrads({ category: '2', modifiers: ['V'] }).fullLabel).toBe('CAD-RADS 2/HRP');
  });
  it('plaque burden and HRP are not applied to CAD-RADS 0', () => {
    const r = calculateCadrads({ category: '0', plaqueBurden: 'P3', modifiers: ['HRP'] });
    expect(r.fullLabel).toBe('CAD-RADS 0');
    expect(r.plaqueBurdenProvided).toBe(false);
  });
});
