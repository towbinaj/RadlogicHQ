import { describe, it, expect } from 'vitest';
import { calculateLugano } from './calculator.js';

// Retroactive coverage for the oncologic-response tool backlog.
// See docs/test.md section 9.

describe('calculateLugano — stage → level + risk group', () => {
  it.each([
    ['I',   1, 'Limited stage'],
    ['II',  2, 'Limited stage'],
    ['III', 3, 'Advanced stage'],
    ['IV',  5, 'Advanced stage'],
  ])('stage %s → level %d, %s', (stage, level, riskGroup) => {
    const r = calculateLugano({ stage });
    expect(r.level).toBe(level);
    expect(r.riskGroup).toBe(riskGroup);
    expect(r.stageProvided).toBe(true);
  });

  it('unset stage → level 0 and placeholder', () => {
    const r = calculateLugano({});
    expect(r.stage).toBe('--');
    expect(r.level).toBe(0);
    expect(r.riskGroup).toBe('');
    expect(r.fullLabel).toBe('--');
  });
});

describe('calculateLugano — suffixes and full label', () => {
  it('stage I + A suffix', () => {
    const r = calculateLugano({ stage: 'I', suffixes: ['A'], lymphomaType: 'hodgkin' });
    expect(r.fullLabel).toBe('Stage IA');
    expect(r.suffixesText).toBe('A');
    expect(r.suffixesProvided).toBe(true);
  });

  it('stage III with multiple suffixes joined', () => {
    // E is dropped at stage III (limited-stage only).
    const r = calculateLugano({ stage: 'III', suffixes: ['B', 'X', 'E'], lymphomaType: 'hodgkin' });
    expect(r.fullLabel).toBe('Stage IIIBX');
    expect(r.suffixesText).toBe('B, X');
  });

  it('empty suffixes array → no suffix', () => {
    const r = calculateLugano({ stage: 'II', suffixes: [] });
    expect(r.fullLabel).toBe('Stage II');
    expect(r.suffixesProvided).toBe(false);
  });

  it('falsy values in suffixes array are filtered', () => {
    const r = calculateLugano({ stage: 'II', suffixes: ['A', null, '', 'B'], lymphomaType: 'hodgkin' });
    expect(r.fullLabel).toBe('Stage IIAB');
    expect(r.suffixesText).toBe('A, B');
  });
});

describe('calculateLugano — lymphoma type', () => {
  it('hodgkin → Hodgkin lymphoma label', () => {
    const r = calculateLugano({ stage: 'II', lymphomaType: 'hodgkin' });
    expect(r.typeLabel).toBe('Hodgkin lymphoma');
    expect(r.typeProvided).toBe(true);
  });

  it('nhl → Non-Hodgkin lymphoma label', () => {
    const r = calculateLugano({ stage: 'II', lymphomaType: 'nhl' });
    expect(r.typeLabel).toBe('Non-Hodgkin lymphoma');
  });

  it('unset lymphoma type → empty label', () => {
    const r = calculateLugano({ stage: 'II' });
    expect(r.typeLabel).toBe('');
    expect(r.typeProvided).toBe(false);
  });
});

describe('Lugano suffix rules (audit 2026-11-28)', () => {
  it('A/B are dropped for non-Hodgkin lymphoma', () => {
    const r = calculateLugano({ stage: 'II', suffixes: ['B', 'X'], lymphomaType: 'nhl' });
    expect(r.fullLabel).toBe('Stage IIX');
  });
  it('A/B kept for Hodgkin', () => {
    expect(calculateLugano({ stage: 'II', suffixes: ['B'], lymphomaType: 'hodgkin' }).fullLabel).toBe('Stage IIB');
  });
  it('E is not applied to stage III/IV', () => {
    expect(calculateLugano({ stage: 'IV', suffixes: ['E', 'S'], lymphomaType: 'hodgkin' }).fullLabel).toBe('Stage IVS');
    expect(calculateLugano({ stage: 'I', suffixes: ['E'], lymphomaType: 'nhl' }).fullLabel).toBe('Stage IE');
  });
});
