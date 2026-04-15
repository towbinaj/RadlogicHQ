import { describe, it, expect } from 'vitest';
import { calculateAspects } from './calculator.js';

// Retroactive coverage for the decision-tree tool backlog.
// See docs/test.md section 9.

function setOf(...ids) { return new Set(ids); }

describe('calculateAspects — score arithmetic', () => {
  it('0 affected → score 10', () => {
    const r = calculateAspects(setOf(), 'left');
    expect(r.score).toBe(10);
    expect(r.affectedCount).toBe(0);
    expect(r.interpretation).toBe('No early ischemic changes');
    expect(r.level).toBe(1);
  });

  it('1 affected → score 9', () => {
    const r = calculateAspects(setOf('M1'), 'left');
    expect(r.score).toBe(9);
    expect(r.level).toBe(2);
  });

  it('2 affected → score 8 (small territory boundary)', () => {
    const r = calculateAspects(setOf('M1', 'M2'), 'left');
    expect(r.score).toBe(8);
    expect(r.level).toBe(2);
    expect(r.interpretation).toBe('Small territory involvement');
  });

  it('3 affected → score 7 (moderate territory)', () => {
    const r = calculateAspects(setOf('M1', 'M2', 'M3'), 'left');
    expect(r.score).toBe(7);
    expect(r.level).toBe(3);
    expect(r.interpretation).toBe('Moderate territory involvement');
  });

  it('4 affected → score 6 (moderate lower edge)', () => {
    const r = calculateAspects(setOf('M1', 'M2', 'M3', 'M4'), 'left');
    expect(r.score).toBe(6);
    expect(r.level).toBe(3);
  });

  it('5 affected → score 5 (large territory)', () => {
    const r = calculateAspects(setOf('M1', 'M2', 'M3', 'M4', 'M5'), 'left');
    expect(r.score).toBe(5);
    expect(r.level).toBe(5);
    expect(r.interpretation).toBe('Large territory infarct');
  });

  it('10 affected → score 0 (maximum damage)', () => {
    const r = calculateAspects(
      setOf('C', 'L', 'IC', 'I', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'),
      'left',
    );
    expect(r.score).toBe(0);
    expect(r.level).toBe(5);
  });
});

describe('calculateAspects — thrombectomy threshold', () => {
  it('score exactly 6 → level 3 (moderate, borderline thrombectomy)', () => {
    const r = calculateAspects(setOf('a', 'b', 'c', 'd'), 'left');
    expect(r.score).toBe(6);
    expect(r.level).toBe(3);
  });

  it('score 5 → level 5 (large, below thrombectomy threshold)', () => {
    const r = calculateAspects(setOf('a', 'b', 'c', 'd', 'e'), 'left');
    expect(r.score).toBe(5);
    expect(r.level).toBe(5);
  });
});

describe('calculateAspects — side + affected text', () => {
  it('populates sideLabel from left/right', () => {
    expect(calculateAspects(setOf(), 'left').sideLabel).toBe('Left');
    expect(calculateAspects(setOf(), 'right').sideLabel).toBe('Right');
    expect(calculateAspects(setOf(), null).sideLabel).toBe('');
  });

  it('affectedText lists IDs in insertion order', () => {
    const r = calculateAspects(setOf('M1', 'M2', 'IC'), 'left');
    expect(r.affectedText).toBe('M1, M2, IC');
    expect(r.affectedProvided).toBe(true);
  });

  it('affectedText is "None" when empty', () => {
    const r = calculateAspects(setOf(), 'left');
    expect(r.affectedText).toBe('None');
    expect(r.affectedProvided).toBe(false);
  });
});
