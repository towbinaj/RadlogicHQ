import { describe, it, expect } from 'vitest';
import { calculateBirads } from './calculator.js';

// Retroactive coverage for the other-RADS tool backlog.
// See docs/test.md section 9.

describe('calculateBirads — category → level', () => {
  it.each([
    ['0',  2],  // Incomplete
    ['1',  1],  // Negative
    ['2',  1],  // Benign
    ['3',  2],  // Probably benign
    ['4a', 3],  // Low suspicion
    ['4b', 4],  // Moderate suspicion
    ['4c', 5],  // High suspicion
    ['5',  5],  // Highly suggestive of malignancy
    ['6',  5],  // Known malignancy
  ])('category %s → level %d', (category, expectedLevel) => {
    const r = calculateBirads({ category });
    expect(r.level).toBe(expectedLevel);
    expect(r.categoryProvided).toBe(true);
  });

  it('unset category → level 0 and placeholder', () => {
    const r = calculateBirads({});
    expect(r.category).toBe('--');
    expect(r.categoryLabel).toBe('--');
    expect(r.level).toBe(0);
    expect(r.categoryProvided).toBe(false);
  });

  it('unknown category ID → level 0', () => {
    const r = calculateBirads({ category: 'xyz' });
    expect(r.level).toBe(0);
    expect(r.categoryLabel).toBe('--');
  });
});

describe('calculateBirads — category metadata', () => {
  it('populates management and risk for category 3', () => {
    const r = calculateBirads({ category: '3' });
    expect(r.categoryLabel).toContain('Probably Benign');
    expect(r.management).toMatch(/Short-interval/);
    expect(r.risk).toBe('<2%');
  });

  it('category 4b has 10–50% risk', () => {
    const r = calculateBirads({ category: '4b' });
    expect(r.risk).toBe('10–50%');
    expect(r.management).toMatch(/Tissue diagnosis/);
  });

  it('category 5 has >95% risk', () => {
    const r = calculateBirads({ category: '5' });
    expect(r.risk).toBe('>95%');
  });

  it('category 6 has 100% risk and surgical management', () => {
    const r = calculateBirads({ category: '6' });
    expect(r.risk).toBe('100%');
    expect(r.management).toMatch(/Surgical/);
  });

  it('category 0 has N/A risk', () => {
    const r = calculateBirads({ category: '0' });
    expect(r.risk).toBe('N/A');
    expect(r.management).toMatch(/Additional imaging/);
  });
});

describe('calculateBirads — modality + laterality', () => {
  it.each([
    ['mammo', 'Mammography'],
    ['us',    'Ultrasound'],
    ['mri',   'MRI'],
  ])('modality %s → label %s', (modality, expected) => {
    const r = calculateBirads({ category: '2', modality });
    expect(r.modalityLabel).toBe(expected);
    expect(r.modalityProvided).toBe(true);
  });

  it.each([
    ['right',     'Right'],
    ['left',      'Left'],
    ['bilateral', 'Bilateral'],
  ])('laterality %s → label %s', (laterality, expected) => {
    const r = calculateBirads({ category: '2', laterality });
    expect(r.lateralityLabel).toBe(expected);
    expect(r.lateralityProvided).toBe(true);
  });

  it('unset modality/laterality → empty labels', () => {
    const r = calculateBirads({ category: '2' });
    expect(r.modalityLabel).toBe('');
    expect(r.lateralityLabel).toBe('');
    expect(r.modalityProvided).toBe(false);
    expect(r.lateralityProvided).toBe(false);
  });
});
