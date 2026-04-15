import { describe, it, expect } from 'vitest';
import { calculateAgatston } from './calculator.js';

// Retroactive coverage for the measurement tool backlog.
// See docs/test.md section 9.

describe('calculateAgatston — risk category lookup by score', () => {
  it.each([
    [0,    'No calcium',        'Very low',          1],
    [1,    'Minimal calcium',   'Low',               1],
    [10,   'Minimal calcium',   'Low',               1],
    [11,   'Mild calcium',      'Mild',              2],
    [50,   'Mild calcium',      'Mild',              2],
    [99,   'Mild calcium',      'Mild',              2],
    [100,  'Moderate calcium',  'Moderate',          3],
    [299,  'Moderate calcium',  'Moderate',          3],
    [300,  'Severe calcium',    'Moderately high',   5],
    [999,  'Severe calcium',    'Moderately high',   5],
    [1000, 'Extensive calcium', 'Very high',         5],
    [5000, 'Extensive calcium', 'Very high',         5],
  ])('score %d → %s / %s (level %d)', (score, label, risk, level) => {
    const r = calculateAgatston({ score });
    expect(r.categoryLabel).toBe(label);
    expect(r.risk).toBe(risk);
    expect(r.level).toBe(level);
    expect(r.scoreProvided).toBe(true);
  });
});

describe('calculateAgatston — boundary edges', () => {
  it('score 0 is the "no calcium" special case', () => {
    const r = calculateAgatston({ score: 0 });
    expect(r.categoryLabel).toBe('No calcium');
    expect(r.recommendation).toMatch(/Reassurance/);
  });

  it('score 1000 (lower edge of Extensive) has high-intensity statin rec', () => {
    const r = calculateAgatston({ score: 1000 });
    expect(r.recommendation).toMatch(/High-intensity statin/);
  });

  it('populates recommendation text for each category', () => {
    expect(calculateAgatston({ score: 50 }).recommendation).toMatch(/statin/i);
    expect(calculateAgatston({ score: 150 }).recommendation).toMatch(/Moderate-to-high/);
  });
});

describe('calculateAgatston — edge cases', () => {
  it('unset score → level 0 and placeholder', () => {
    const r = calculateAgatston({});
    expect(r.scoreProvided).toBe(false);
    expect(r.scoreLabel).toBe('--');
    expect(r.categoryLabel).toBe('--');
    expect(r.level).toBe(0);
  });

  it('null score treated as unset', () => {
    const r = calculateAgatston({ score: null });
    expect(r.scoreProvided).toBe(false);
  });

  it('negative score treated as unset', () => {
    const r = calculateAgatston({ score: -5 });
    expect(r.scoreProvided).toBe(false);
    expect(r.level).toBe(0);
  });
});
