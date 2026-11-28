import { describe, it, expect } from 'vitest';
import { calculateAspects, detectNormalAspects } from './calculator.js';

// Retroactive coverage for the decision-tree tool backlog.
// See docs/test.md section 9.

function setOf(...ids) { return new Set(ids); }

describe('calculateAspects — score arithmetic', () => {
  it('0 affected + confirmed normal → score 10', () => {
    const r = calculateAspects(setOf(), 'left', true);
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
    expect(r.interpretation).toBe('Limited early ischemic change');
  });

  it('3 affected → score 7 (moderate territory)', () => {
    const r = calculateAspects(setOf('M1', 'M2', 'M3'), 'left');
    expect(r.score).toBe(7);
    expect(r.level).toBe(3);
    expect(r.interpretation).toBe('Moderate early ischemic change (ASPECTS 7 or less)');
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
    expect(r.interpretation).toBe('Extensive early ischemic change (large core, ASPECTS 5 or less)');
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

// --- Blank default ---
// An untouched form used to report "ASPECTS 10/10. No early ischemic changes."
// A score of 10 is now only reported when a region is marked (score < 10) or
// the reader explicitly confirms no early ischemic changes.
describe('calculateAspects — blank until assessed', () => {
  it('untouched form is blank, not 10/10', () => {
    const r = calculateAspects(setOf(), null);
    expect(r.assessed).toBe(false);
    expect(r.score).toBe('--');
    expect(r.scoreLabel).toBe('--');
    expect(r.level).toBe(0);
    expect(r.interpretation).not.toMatch(/No early ischemic changes/);
    expect(r.interpretation).toMatch(/not yet assessed/i);
  });

  it('normalConfirmed defaults to false', () => {
    expect(calculateAspects(setOf(), 'left').assessed).toBe(false);
  });

  it('any marked region counts as assessed without confirmation', () => {
    const r = calculateAspects(setOf('M2'), 'right');
    expect(r.assessed).toBe(true);
    expect(r.score).toBe(9);
  });

  it('confirmed normal gives 10/10 with the normal interpretation', () => {
    const r = calculateAspects(setOf(), 'right', true);
    expect(r.assessed).toBe(true);
    expect(r.score).toBe(10);
    expect(r.interpretation).toBe('No early ischemic changes');
  });

  it('marked regions win over a stale normal confirmation', () => {
    const r = calculateAspects(setOf('I', 'L'), 'left', true);
    expect(r.score).toBe(8);
    expect(r.interpretation).not.toBe('No early ischemic changes');
  });
});

describe('detectNormalAspects (paste)', () => {
  it.each([
    'ASPECTS 10.',
    'ASPECTS: 10/10',
    'Left ASPECTS score of 10.',
    'No early ischemic changes.',
    'No acute ischemic changes in the MCA territory.',
  ])('"%s" -> normal', (t) => expect(detectNormalAspects(t)).toBe(true));

  it.each([
    'ASPECTS 8/10.',
    'ASPECTS of 7.',
    'Early ischemic changes in the insula.',
    '',
  ])('"%s" -> not normal', (t) => expect(detectNormalAspects(t)).toBe(false));
});
