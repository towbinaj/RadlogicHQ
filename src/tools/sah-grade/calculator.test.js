import { describe, it, expect } from 'vitest';
import { calculateSah } from './calculator.js';

// Retroactive coverage for the decision-tree tool backlog.
// See docs/test.md section 9.

describe('calculateSah — Hunt-Hess level mapping', () => {
  it.each([
    ['1', 2],
    ['2', 2],
    ['3', 3],
    ['4', 5],
    ['5', 5],
  ])('HH grade %s → level %d', (huntHess, expected) => {
    const r = calculateSah({ huntHess });
    expect(r.huntHessLevel).toBe(expected);
    expect(r.huntHessProvided).toBe(true);
  });

  it('unset HH → level 0', () => {
    const r = calculateSah({});
    expect(r.huntHessLevel).toBe(0);
    expect(r.huntHessProvided).toBe(false);
  });

  it('HH label combines label and description', () => {
    const r = calculateSah({ huntHess: '2' });
    expect(r.huntHessLabel).toContain('Grade 2');
    expect(r.huntHessLabel).toContain('nuchal rigidity');
  });

  it('HH prognosis populated per grade', () => {
    expect(calculateSah({ huntHess: '1' }).huntHessPrognosis).toBe('Good');
    expect(calculateSah({ huntHess: '5' }).huntHessPrognosis).toBe('Very poor');
  });
});

describe('calculateSah — Modified Fisher level mapping', () => {
  it.each([
    ['0', 1],
    ['1', 1],
    ['2', 3],
    ['3', 3],
    ['4', 5],
  ])('MF grade %s → level %d', (modifiedFisher, expected) => {
    const r = calculateSah({ modifiedFisher });
    expect(r.modifiedFisherLevel).toBe(expected);
  });

  it('MF vasospasm risk populated per grade', () => {
    expect(calculateSah({ modifiedFisher: '0' }).modifiedFisherVasospasm).toBe('Baseline');
    expect(calculateSah({ modifiedFisher: '1' }).modifiedFisherVasospasm).toBe('Low');
    expect(calculateSah({ modifiedFisher: '3' }).modifiedFisherVasospasm).toBe('Moderate');
    expect(calculateSah({ modifiedFisher: '4' }).modifiedFisherVasospasm).toBe('High');
  });
});

describe('calculateSah — combined level', () => {
  it('returns max of HH and MF levels', () => {
    const r = calculateSah({ huntHess: '2', modifiedFisher: '4' });
    // HH 2 → level 2, MF 4 → level 5
    expect(r.huntHessLevel).toBe(2);
    expect(r.modifiedFisherLevel).toBe(5);
    expect(r.level).toBe(5);
  });

  it('HH dominates when more severe', () => {
    const r = calculateSah({ huntHess: '5', modifiedFisher: '1' });
    expect(r.level).toBe(5);
  });

  it('equal levels → same max', () => {
    const r = calculateSah({ huntHess: '3', modifiedFisher: '2' });
    // HH 3 → 3, MF 2 → 3
    expect(r.level).toBe(3);
  });

  it('only HH provided → level = HH level', () => {
    const r = calculateSah({ huntHess: '4' });
    expect(r.level).toBe(5);
    expect(r.modifiedFisherLevel).toBe(0);
  });

  it('nothing provided → level 0', () => {
    const r = calculateSah({});
    expect(r.level).toBe(0);
    expect(r.huntHessGrade).toBe('--');
    expect(r.modifiedFisherGrade).toBe('--');
  });
});
