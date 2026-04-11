import { describe, it, expect } from 'vitest';
import { calculateScore, getOptionLabel, getSelectedLabels } from './engine.js';

// --- Helper definitions ---

const singleSelectSection = {
  id: 'composition',
  inputType: 'single-select',
  options: [
    { id: 'cystic', label: 'Cystic', points: 0 },
    { id: 'mixed', label: 'Mixed', points: 1 },
    { id: 'solid', label: 'Solid', points: 2 },
  ],
};

const multiSelectSection = {
  id: 'echogenicFoci',
  inputType: 'multi-select',
  options: [
    { id: 'none', label: 'None', points: 0 },
    { id: 'comet', label: 'Comet-tail', points: 0 },
    { id: 'macro', label: 'Macrocalcifications', points: 1 },
    { id: 'peripheral', label: 'Peripheral calcifications', points: 2 },
    { id: 'punctate', label: 'Punctate foci', points: 3 },
  ],
};

const definition = {
  sections: [singleSelectSection, multiSelectSection],
};

// --- calculateScore ---

describe('calculateScore', () => {
  it('returns all zeros for empty formState', () => {
    const result = calculateScore(definition, {});
    expect(result.totalScore).toBe(0);
    expect(result.sectionScores.composition).toBe(0);
    expect(result.sectionScores.echogenicFoci).toBe(0);
  });

  it('scores a single-select section with a selected option', () => {
    const result = calculateScore(definition, { composition: 'solid' });
    expect(result.sectionScores.composition).toBe(2);
    expect(result.totalScore).toBe(2);
  });

  it('scores a multi-select section with multiple selected options', () => {
    const result = calculateScore(definition, {
      echogenicFoci: ['macro', 'punctate'],
    });
    expect(result.sectionScores.echogenicFoci).toBe(4); // 1 + 3
    expect(result.totalScore).toBe(4);
  });

  it('scores mixed sections correctly', () => {
    const result = calculateScore(definition, {
      composition: 'mixed',
      echogenicFoci: ['peripheral', 'punctate'],
    });
    expect(result.sectionScores.composition).toBe(1);
    expect(result.sectionScores.echogenicFoci).toBe(5); // 2 + 3
    expect(result.totalScore).toBe(6);
  });

  it('returns 0 points for an unknown option ID', () => {
    const result = calculateScore(definition, { composition: 'nonexistent' });
    expect(result.sectionScores.composition).toBe(0);
    expect(result.totalScore).toBe(0);
  });

  it('returns 0 points for null value in formState', () => {
    const result = calculateScore(definition, { composition: null });
    expect(result.sectionScores.composition).toBe(0);
    expect(result.totalScore).toBe(0);
  });
});

// --- getOptionLabel ---

describe('getOptionLabel', () => {
  it('returns the label for a valid option', () => {
    expect(getOptionLabel(singleSelectSection, 'solid')).toBe('Solid');
  });

  it('returns empty string for unknown option', () => {
    expect(getOptionLabel(singleSelectSection, 'unknown')).toBe('');
  });
});

// --- getSelectedLabels ---

describe('getSelectedLabels', () => {
  it('returns labels for a single-select value (string)', () => {
    const labels = getSelectedLabels(singleSelectSection, 'mixed');
    expect(labels).toEqual(['Mixed']);
  });

  it('returns labels for a multi-select value (array)', () => {
    const labels = getSelectedLabels(multiSelectSection, ['macro', 'punctate']);
    expect(labels).toEqual(['Macrocalcifications', 'Punctate foci']);
  });

  it('returns empty array for null value', () => {
    expect(getSelectedLabels(singleSelectSection, null)).toEqual([]);
  });

  it('filters out unknown option IDs', () => {
    const labels = getSelectedLabels(multiSelectSection, ['macro', 'bogus']);
    expect(labels).toEqual(['Macrocalcifications']);
  });
});
