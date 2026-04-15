import { describe, it, expect } from 'vitest';
import { calculateDeauville } from './calculator.js';

// Retroactive coverage for the oncologic-response tool backlog.
// See docs/test.md section 9.

describe('calculateDeauville — score → response mapping', () => {
  it.each([
    ['1', 'CMR', 1],
    ['2', 'CMR', 1],
    ['3', 'CMR', 1],
    ['4', 'PMR', 3],
    ['5', 'PMD', 5],
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

  it('newLesion=no does not change score 4 → PMR', () => {
    const r = calculateDeauville({ score: '4', newLesion: 'no' });
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
    const r = calculateDeauville({ score: '4' });
    expect(r.responseFullLabel).toBe('PMR — Partial Metabolic Response');
  });

  it('newLesionLabel has three states', () => {
    expect(calculateDeauville({ score: '2', newLesion: 'yes' }).newLesionLabel).toBe('Yes');
    expect(calculateDeauville({ score: '2', newLesion: 'no' }).newLesionLabel).toBe('No');
    expect(calculateDeauville({ score: '2' }).newLesionLabel).toBe('Not assessed');
  });
});
