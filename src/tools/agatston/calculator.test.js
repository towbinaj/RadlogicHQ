import { describe, it, expect } from 'vitest';
import { calculateAgatston } from './calculator.js';

// Retroactive coverage for the measurement tool backlog.
// See docs/test.md section 9.

// CAC-DRS 2018 (Hecht HS et al., J Cardiovasc Comput Tomogr 2018;12:185-191)
describe('calculateAgatston — CAC-DRS categories', () => {
  it.each([
    [0,    'CAC-DRS 0', 'Very low',                         1],
    [0.5,  'CAC-DRS 1', 'Mildly increased',                 2],
    [1,    'CAC-DRS 1', 'Mildly increased',                 2],
    [99,   'CAC-DRS 1', 'Mildly increased',                 2],
    [99.5, 'CAC-DRS 2', 'Moderately increased',             3],
    [100,  'CAC-DRS 2', 'Moderately increased',             3],
    [299,  'CAC-DRS 2', 'Moderately increased',             3],
    [299.4,'CAC-DRS 3', 'Moderately to severely increased', 5],
    [300,  'CAC-DRS 3', 'Moderately to severely increased', 5],
    [5000, 'CAC-DRS 3', 'Moderately to severely increased', 5],
  ])('score %s -> %s / %s (level %d)', (score, label, risk, level) => {
    const r = calculateAgatston({ score });
    expect(r.categoryLabel).toBe(label);
    expect(r.risk).toBe(risk);
    expect(r.level).toBe(level);
  });

  it('recommendations follow CAC-DRS', () => {
    expect(calculateAgatston({ score: 0 }).recommendation).toMatch(/statin generally not recommended/i);
    expect(calculateAgatston({ score: 50 }).recommendation).toMatch(/moderate-intensity statin/i);
    expect(calculateAgatston({ score: 150 }).recommendation).toMatch(/moderate- to high-intensity statin/i);
    expect(calculateAgatston({ score: 350 }).recommendation).toMatch(/high-intensity statin/i);
    expect(calculateAgatston({ score: 350 }).recommendation).toMatch(/bleeding risk/i);
  });

  it('labels are ASCII', async () => {
    const { agatstonDefinition } = await import('./definition.js');
    for (const c of agatstonDefinition.riskCategories) for (const v of [c.label, c.risk, c.recommendation]) expect(v).not.toMatch(/[^\x20-\x7E]/);
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

import { parseFindings } from '../../core/parser.js';
import { agatstonDefinition as def } from './definition.js';
describe('Agatston parse', () => {
  const score = (t) => parseFindings(t, def).formState.score;
  it.each([
    ['CAC score 1,250.', 1250],
    ['Coronary artery calcium score of 150.', 150],
    ['Calcium score 12.7.', 12.7],
    ['LAD calcium 40, total score 120.', 120],
    ['Agatston score: 0', 0],
  ])('"%s" -> %s', (t, v) => expect(score(t)).toBe(v));
});

describe('calculateAgatston — impression', () => {
  it('scored', () => {
    expect(calculateAgatston({ score: 350 }).impressionText).toBe('Agatston score 350 (CAC-DRS 3). Moderately to severely increased cardiovascular risk.');
  });
  it('empty form has no placeholders', () => {
    expect(calculateAgatston({}).impressionText).toBe('Not yet scored.');
  });
});
