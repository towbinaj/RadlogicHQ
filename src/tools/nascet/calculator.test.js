import { describe, it, expect } from 'vitest';
import { calculateNascet } from './calculator.js';

describe('calculateNascet', () => {
  it('calculates moderate stenosis (60%)', () => {
    const result = calculateNascet({ stenosisDiam: 2, distalDiam: 5 });
    expect(result.pct).toBe(60);
    expect(result.severity).toBe('Moderate');
  });

  it('calculates severe stenosis (80%)', () => {
    const result = calculateNascet({ stenosisDiam: 1, distalDiam: 5 });
    expect(result.pct).toBe(80);
    expect(result.severity).toBe('Severe');
  });

  it('calculates mild stenosis (20%)', () => {
    const result = calculateNascet({ stenosisDiam: 4, distalDiam: 5 });
    expect(result.pct).toBe(20);
    expect(result.severity).toBe('Mild');
  });

  it('returns null pct when values are missing', () => {
    const result = calculateNascet({});
    expect(result.pct).toBeNull();
    expect(result.severity).toBe('');
    expect(result.pctLabel).toBe('--');
  });

  it('returns null pct when distalDiam is 0 (division by zero)', () => {
    const result = calculateNascet({ stenosisDiam: 2, distalDiam: 0 });
    expect(result.pct).toBeNull();
  });

  it('returns null pct when stenosisDiam is null', () => {
    const result = calculateNascet({ stenosisDiam: null, distalDiam: 5 });
    expect(result.pct).toBeNull();
  });

  it('formats side label for right', () => {
    const result = calculateNascet({ stenosisDiam: 2, distalDiam: 5, side: 'right' });
    expect(result.sideLabel).toBe('Right');
    expect(result.sideProvided).toBe(true);
  });

  it('formats side label for left', () => {
    const result = calculateNascet({ stenosisDiam: 2, distalDiam: 5, side: 'left' });
    expect(result.sideLabel).toBe('Left');
  });

  it('returns empty side label when side is null', () => {
    const result = calculateNascet({ stenosisDiam: 2, distalDiam: 5 });
    expect(result.sideLabel).toBe('');
    expect(result.sideProvided).toBe(false);
  });
});
