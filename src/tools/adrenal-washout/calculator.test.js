import { describe, it, expect } from 'vitest';
import { calculateAdrenalWashout } from './calculator.js';

// Retroactive coverage for commit 43f89d5 (HU extraction refactor).
// See docs/test.md section 9.

describe('calculateAdrenalWashout — lipid-rich adenoma', () => {
  it('unenhanced ≤10 HU flags lipid-rich adenoma', () => {
    const r = calculateAdrenalWashout({ unenhanced: 8 });
    expect(r.lipidRich).toBe(true);
    expect(r.interpretation).toMatch(/Lipid-rich adenoma/);
    expect(r.interpretationLevel).toBe(1);
    expect(r.hasResult).toBe(true);
  });

  it('unenhanced exactly 10 HU still lipid-rich (boundary)', () => {
    const r = calculateAdrenalWashout({ unenhanced: 10 });
    expect(r.lipidRich).toBe(true);
  });

  it('unenhanced 11 HU is NOT lipid-rich', () => {
    const r = calculateAdrenalWashout({ unenhanced: 11 });
    expect(r.lipidRich).toBe(false);
    expect(r.interpretation).toBe('');
    expect(r.hasResult).toBe(false);
  });

  it('lipid-rich diagnosis wins over borderline washout', () => {
    // Unenhanced ≤10 short-circuits — don't even compute washout.
    const r = calculateAdrenalWashout({
      unenhanced: 8, enhanced: 100, delayed: 70,
    });
    expect(r.lipidRich).toBe(true);
    expect(r.interpretation).toMatch(/Lipid-rich adenoma/);
    // Absolute washout is still computed for display, but interpretation
    // uses the lipid-rich branch.
    expect(r.absoluteWashout).not.toBeNull();
  });
});

describe('calculateAdrenalWashout — absolute washout', () => {
  it('computes absolute washout = (enh - del) / (enh - unenh) * 100', () => {
    // unenh=20, enh=100, del=50 → (100-50)/(100-20) = 50/80 = 62.5%
    const r = calculateAdrenalWashout({
      unenhanced: 20, enhanced: 100, delayed: 50,
    });
    expect(r.absoluteWashout).toBeCloseTo(62.5, 1);
    expect(r.absoluteWashoutLabel).toBe('62.5%');
    expect(r.interpretation).toMatch(/adenoma.*absolute washout/i);
    expect(r.interpretationLevel).toBe(1);
  });

  it('absolute washout exactly 60% meets adenoma threshold (boundary)', () => {
    // unenh=20, enh=100, del=52 → (100-52)/(100-20) = 48/80 = 60%
    const r = calculateAdrenalWashout({
      unenhanced: 20, enhanced: 100, delayed: 52,
    });
    expect(r.absoluteWashout).toBeCloseTo(60, 1);
    expect(r.interpretationLevel).toBe(1);
  });

  it('absolute washout <60% is indeterminate', () => {
    // unenh=20, enh=100, del=60 → (100-60)/80 = 50%
    const r = calculateAdrenalWashout({
      unenhanced: 20, enhanced: 100, delayed: 60,
    });
    expect(r.absoluteWashout).toBeCloseTo(50, 1);
    expect(r.interpretation).toMatch(/Indeterminate/);
    expect(r.interpretationLevel).toBe(3);
  });
});

describe('calculateAdrenalWashout — relative washout', () => {
  it('computes relative washout = (enh - del) / enh * 100 when unenhanced missing', () => {
    // enh=100, del=50 → (100-50)/100 = 50%
    const r = calculateAdrenalWashout({ enhanced: 100, delayed: 50 });
    expect(r.relativeWashout).toBeCloseTo(50, 1);
    expect(r.relativeWashoutLabel).toBe('50%');
    expect(r.absoluteProvided).toBe(false);
    expect(r.interpretation).toMatch(/adenoma.*relative washout/i);
    expect(r.interpretationLevel).toBe(1);
  });

  it('relative washout exactly 40% meets adenoma threshold (boundary)', () => {
    // enh=100, del=60 → 40%
    const r = calculateAdrenalWashout({ enhanced: 100, delayed: 60 });
    expect(r.relativeWashout).toBeCloseTo(40, 1);
    expect(r.interpretationLevel).toBe(1);
  });

  it('relative washout <40% is indeterminate', () => {
    // enh=100, del=70 → 30%
    const r = calculateAdrenalWashout({ enhanced: 100, delayed: 70 });
    expect(r.relativeWashout).toBeCloseTo(30, 1);
    expect(r.interpretation).toMatch(/Indeterminate/);
    expect(r.interpretationLevel).toBe(3);
  });
});

describe('calculateAdrenalWashout — edge cases', () => {
  it('empty input returns no result', () => {
    const r = calculateAdrenalWashout({});
    expect(r.hasResult).toBe(false);
    expect(r.lipidRich).toBe(false);
    expect(r.absoluteWashout).toBeNull();
    expect(r.relativeWashout).toBeNull();
    expect(r.interpretation).toBe('');
    expect(r.interpretationLevel).toBe(0);
  });

  it('enhanced === unenhanced avoids divide-by-zero (no absolute)', () => {
    const r = calculateAdrenalWashout({
      unenhanced: 50, enhanced: 50, delayed: 40,
    });
    expect(r.absoluteWashout).toBeNull();
    // Falls through to relative washout.
    expect(r.relativeWashout).toBeCloseTo(20, 1);
  });

  it('enhanced === 0 avoids divide-by-zero (no relative)', () => {
    const r = calculateAdrenalWashout({ enhanced: 0, delayed: 0 });
    expect(r.relativeWashout).toBeNull();
  });

  it('sideLabel populated when side provided', () => {
    const r = calculateAdrenalWashout({ side: 'right', unenhanced: 8 });
    expect(r.sideLabel).toBe('Right');
    expect(r.sideProvided).toBe(true);
  });

  it('only enhanced + delayed (no unenhanced) falls through to relative', () => {
    const r = calculateAdrenalWashout({ enhanced: 100, delayed: 30 });
    expect(r.relativeWashout).toBeCloseTo(70, 1);
    expect(r.absoluteProvided).toBe(false);
    expect(r.interpretationLevel).toBe(1);
  });
});
