import { describe, it, expect } from 'vitest';
import { calculateGmh } from './calculator.js';

// Retroactive coverage for the decision-tree tool backlog.
// See docs/test.md section 9.

describe('calculateGmh — grade → level mapping', () => {
  it.each([
    ['I',   2],
    ['II',  2],
    ['III', 3],
    ['IV',  5],
  ])('grade %s → level %d', (grade, expected) => {
    const r = calculateGmh({ grade });
    expect(r.level).toBe(expected);
    expect(r.gradeProvided).toBe(true);
  });

  it('unset grade → level 0 and placeholder', () => {
    const r = calculateGmh({});
    expect(r.grade).toBe('--');
    expect(r.gradeLabel).toBe('--');
    expect(r.gradeProvided).toBe(false);
    expect(r.level).toBe(0);
  });
});

describe('calculateGmh — grade metadata', () => {
  it('Grade I is subependymal with good prognosis', () => {
    const r = calculateGmh({ grade: 'I' });
    expect(r.description).toMatch(/subependymal/i);
    expect(r.prognosis).toBe('Good');
    expect(r.prognosisProvided).toBe(true);
  });

  it('Grade II: IVH without ventricular dilation', () => {
    const r = calculateGmh({ grade: 'II' });
    expect(r.description).toMatch(/IVH without ventricular dilation/i);
    expect(r.prognosis).toBe('Good');
  });

  it('Grade III: IVH with ventricular dilation, hydrocephalus risk', () => {
    const r = calculateGmh({ grade: 'III' });
    expect(r.description).toMatch(/ventricular dilation/i);
    expect(r.prognosis).toMatch(/hydrocephalus/i);
  });

  it('Grade IV: periventricular hemorrhagic infarction, poor prognosis', () => {
    const r = calculateGmh({ grade: 'IV' });
    expect(r.description).toMatch(/hemorrhagic infarction/i);
    expect(r.prognosis).toMatch(/Poor/i);
  });
});

describe('calculateGmh — side labels', () => {
  it.each([
    ['right',     'Right'],
    ['left',      'Left'],
    ['bilateral', 'Bilateral'],
  ])('side %s → label %s', (side, expected) => {
    const r = calculateGmh({ grade: 'II', side });
    expect(r.sideLabel).toBe(expected);
    expect(r.sideProvided).toBe(true);
  });

  it('unset side → empty label', () => {
    const r = calculateGmh({ grade: 'II' });
    expect(r.sideLabel).toBe('');
    expect(r.sideProvided).toBe(false);
  });
});
