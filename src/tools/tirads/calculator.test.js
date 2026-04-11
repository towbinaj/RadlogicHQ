import { describe, it, expect } from 'vitest';
import { getTiradsLevel, getManagement, calculateTirads } from './calculator.js';

// --- getTiradsLevel ---

describe('getTiradsLevel', () => {
  it('0 points → TR1 Benign', () => {
    const result = getTiradsLevel(0);
    expect(result.name).toBe('TR1');
    expect(result.level).toBe(1);
  });

  it('2 points → TR2 Not Suspicious', () => {
    const result = getTiradsLevel(2);
    expect(result.name).toBe('TR2');
    expect(result.level).toBe(2);
  });

  it('3 points → TR3 Mildly Suspicious', () => {
    const result = getTiradsLevel(3);
    expect(result.name).toBe('TR3');
    expect(result.level).toBe(3);
  });

  it('4 points → TR4', () => {
    expect(getTiradsLevel(4).name).toBe('TR4');
  });

  it('6 points → TR4', () => {
    expect(getTiradsLevel(6).name).toBe('TR4');
  });

  it('7 points → TR5', () => {
    expect(getTiradsLevel(7).name).toBe('TR5');
    expect(getTiradsLevel(7).level).toBe(5);
  });

  it('10 points → TR5', () => {
    expect(getTiradsLevel(10).name).toBe('TR5');
  });

  it('1 point (edge case) → TR2 fallback', () => {
    const result = getTiradsLevel(1);
    expect(result.name).toBe('TR2');
    expect(result.level).toBe(2);
  });
});

// --- getManagement ---

describe('getManagement', () => {
  it('TR1 → no FNA regardless of size', () => {
    const result = getManagement(1, 5.0);
    expect(result.recommendation).toBe('No FNA');
    expect(result.fnaRecommended).toBe(false);
    expect(result.followUpRecommended).toBe(false);
  });

  it('TR2 → no FNA regardless of size', () => {
    const result = getManagement(2, 5.0);
    expect(result.fnaRecommended).toBe(false);
  });

  it('TR3 with 2.5cm → FNA recommended', () => {
    const result = getManagement(3, 2.5);
    expect(result.fnaRecommended).toBe(true);
    expect(result.recommendation).toContain('FNA');
  });

  it('TR3 with 1.5cm → follow-up recommended', () => {
    const result = getManagement(3, 1.5);
    expect(result.fnaRecommended).toBe(false);
    expect(result.followUpRecommended).toBe(true);
  });

  it('TR3 with null size → enter size message', () => {
    const result = getManagement(3, null);
    expect(result.recommendation).toContain('Enter size');
    expect(result.fnaRecommended).toBe(false);
  });

  it('TR5 with 1.0cm → FNA recommended', () => {
    const result = getManagement(5, 1.0);
    expect(result.fnaRecommended).toBe(true);
  });

  it('TR4 with 0.5cm → no action (below thresholds)', () => {
    const result = getManagement(4, 0.5);
    expect(result.fnaRecommended).toBe(false);
    expect(result.followUpRecommended).toBe(false);
    expect(result.recommendation).toContain('No FNA');
  });
});

// --- calculateTirads (integration) ---

describe('calculateTirads', () => {
  it('returns all expected fields', () => {
    const result = calculateTirads(4, 2.0);
    expect(result).toHaveProperty('totalScore', 4);
    expect(result).toHaveProperty('tiradsLevel');
    expect(result).toHaveProperty('tiradsName');
    expect(result).toHaveProperty('tiradsLabel');
    expect(result).toHaveProperty('tiradsFullLabel');
    expect(result).toHaveProperty('recommendation');
    expect(result).toHaveProperty('recommendationDetail');
    expect(result).toHaveProperty('fnaRecommended');
    expect(result).toHaveProperty('followUpRecommended');
    expect(result).toHaveProperty('noduleSize', 2.0);
    expect(result).toHaveProperty('noduleSizeProvided', true);
  });

  it('noduleSizeProvided is false when size is null', () => {
    const result = calculateTirads(3, null);
    expect(result.noduleSizeProvided).toBe(false);
  });

  it('combines level and management correctly for TR5 + large nodule', () => {
    const result = calculateTirads(10, 2.0);
    expect(result.tiradsName).toBe('TR5');
    expect(result.fnaRecommended).toBe(true);
  });
});
