import { describe, it, expect } from 'vitest';
import { calculateDeauville } from './calculator.js';

// Retroactive coverage for the oncologic-response tool backlog.
// See docs/test.md section 9.

describe('calculateDeauville — score → response mapping', () => {
  it.each([
    ['1', 'CMR', 1],
    ['2', 'CMR', 1],
    ['3', 'CMR', 1],
  ])('score %s → %s (level %d)', (score, response, level) => {
    const r = calculateDeauville({ score });
    expect(r.response).toBe(response);
    expect(r.responseLevel).toBe(level);
    expect(r.scoreLevel).toBe(parseInt(score));
  });

  it('unset score → incomplete', () => {
    const r = calculateDeauville({});
    expect(r.response).toBe('--');
    expect(r.responseLabel).toBe('Incomplete');
    expect(r.scoreLabel).toBe('--');
  });
});

describe('calculateDeauville — new lesion override', () => {
  it('new lesion forces PMD even with score 1', () => {
    const r = calculateDeauville({ score: '1', newLesion: 'yes' });
    expect(r.response).toBe('PMD');
    expect(r.responseLevel).toBe(5);
    expect(r.hasNewLesion).toBe(true);
  });

  it('new lesion forces PMD even with score 3 (otherwise CMR)', () => {
    const r = calculateDeauville({ score: '3', newLesion: 'yes' });
    expect(r.response).toBe('PMD');
  });

  it('newLesion=no does not change score 4 + decreased uptake → PMR', () => {
    const r = calculateDeauville({ score: '4', newLesion: 'no', baseline: 'decreased' });
    expect(r.response).toBe('PMR');
  });
});

describe('calculateDeauville — timing and metadata', () => {
  it.each([
    ['interim',      'Interim (mid-treatment)'],
    ['eot',          'End of treatment'],
    ['surveillance', 'Surveillance'],
  ])('timing %s → label %s', (timing, expected) => {
    const r = calculateDeauville({ score: '3', timing });
    expect(r.timingLabel).toBe(expected);
    expect(r.timingProvided).toBe(true);
  });

  it('unset timing → "Not specified"', () => {
    const r = calculateDeauville({ score: '3' });
    expect(r.timingLabel).toBe('Not specified');
    expect(r.timingProvided).toBe(false);
  });

  it('score interpretation populated', () => {
    const r = calculateDeauville({ score: '1' });
    expect(r.interpretation).toMatch(/Complete metabolic response/i);
  });

  it('responseFullLabel includes both code and long name', () => {
    const r = calculateDeauville({ score: '4', baseline: 'decreased' });
    expect(r.responseFullLabel).toBe('PMR - Partial Metabolic Response');
  });

  it('newLesionLabel has three states', () => {
    expect(calculateDeauville({ score: '2', newLesion: 'yes' }).newLesionLabel).toBe('Yes');
    expect(calculateDeauville({ score: '2', newLesion: 'no' }).newLesionLabel).toBe('No');
    expect(calculateDeauville({ score: '2' }).newLesionLabel).toBe('Not assessed');
  });
});

// --- Lugano 2014 (Cheson et al., J Clin Oncol 2014) PET-based response ---
describe('calculateDeauville — Lugano response needs uptake vs baseline for scores 4-5', () => {
  it.each([
    ['4', 'decreased', 'PMR'], ['5', 'decreased', 'PMR'],
    ['4', 'unchanged', 'NMR'], ['5', 'unchanged', 'NMR'],
    ['4', 'increased', 'PMD'], ['5', 'increased', 'PMD'],
  ])('score %s, uptake %s vs baseline -> %s', (score, baseline, resp) => {
    expect(calculateDeauville({ score, baseline }).response).toBe(resp);
  });

  it('score 4-5 without a baseline comparison is incomplete (no automatic PMR/PMD)', () => {
    expect(calculateDeauville({ score: '4' }).response).toBe('--');
    expect(calculateDeauville({ score: '5' }).response).toBe('--');
  });

  it('scores 1-3 are CMR regardless of baseline comparison', () => {
    expect(calculateDeauville({ score: '3', baseline: 'unchanged' }).response).toBe('CMR');
  });

  it('new lesions -> PMD even with decreased uptake', () => {
    expect(calculateDeauville({ score: '4', baseline: 'decreased', newLesion: 'yes' }).response).toBe('PMD');
  });
});

describe('calculateDeauville — interpretation follows the response, not the score', () => {
  it('score 2 with new lesions does not say complete metabolic response', () => {
    const r = calculateDeauville({ score: '2', newLesion: 'yes' });
    expect(r.interpretation).not.toMatch(/complete metabolic response/i);
    expect(r.management).not.toMatch(/no residual/i);
  });

  it('end-of-treatment PMR/NMR is described as residual disease', () => {
    expect(calculateDeauville({ score: '4', baseline: 'decreased', timing: 'eot' }).management).toMatch(/residual/i);
    expect(calculateDeauville({ score: '5', baseline: 'unchanged', timing: 'eot' }).management).toMatch(/residual/i);
  });

  it('interim PMR is described as responding disease', () => {
    expect(calculateDeauville({ score: '4', baseline: 'decreased', timing: 'interim' }).management).toMatch(/respond/i);
  });

  it('report text is ASCII', () => {
    const r = calculateDeauville({ score: '5', baseline: 'increased', timing: 'eot' });
    for (const k of ['responseFullLabel', 'interpretation', 'management', 'scoreLabel', 'baselineLabel']) {
      expect(String(r[k])).not.toMatch(/[^\x20-\x7E]/);
    }
  });
});

import { parseFindings } from '../../core/parser.js';
import { deauvilleDefinition } from './definition.js';
describe('Deauville parse — uptake vs baseline', () => {
  it.each([
    ['Residual uptake decreased compared with baseline.', 'decreased'],
    ['FDG uptake unchanged from baseline.', 'unchanged'],
    ['Increased uptake compared to baseline.', 'increased'],
  ])('"%s" -> %s', (t, v) => {
    expect(parseFindings(t, deauvilleDefinition).formState.baseline).toBe(v);
  });
});
