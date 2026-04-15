import { describe, it, expect } from 'vitest';
import { calculatePectus } from './calculator.js';

// Retroactive coverage for the measurement tool backlog.
// See docs/test.md section 9.

describe('calculatePectus — Pectus (Haller) Index', () => {
  it('width/depth ratio → Haller index', () => {
    const r = calculatePectus({ piWidth: 260, piDepth: 80 });
    expect(r.pi).toBe(3.25);
    expect(r.piLabel).toBe('3.25');
    expect(r.piAbnormal).toBe(false);
    expect(r.piInterpretation).toMatch(/Normal/);
  });

  it('3.25 is the normal upper edge (NOT abnormal)', () => {
    const r = calculatePectus({ piWidth: 325, piDepth: 100 });
    expect(r.pi).toBe(3.25);
    expect(r.piAbnormal).toBe(false);
  });

  it('3.26 crosses into abnormal', () => {
    // need ratio just above 3.25. 326/100 = 3.26
    const r = calculatePectus({ piWidth: 326, piDepth: 100 });
    expect(r.pi).toBe(3.26);
    expect(r.piAbnormal).toBe(true);
    expect(r.piInterpretation).toMatch(/Abnormal/);
  });

  it('missing either width or depth → null', () => {
    expect(calculatePectus({ piWidth: 200 }).pi).toBeNull();
    expect(calculatePectus({ piDepth: 100 }).pi).toBeNull();
  });
});

describe('calculatePectus — Correction Index', () => {
  it('(depthA - depthB) / depthA * 100', () => {
    // depthA=100, depthB=80 → (100-80)/100 * 100 = 20%
    const r = calculatePectus({ ciDepthA: 100, ciDepthB: 80 });
    expect(r.ci).toBe(20);
    expect(r.ciLabel).toBe('20.0%');
    expect(r.ciAbnormal).toBe(true);
  });

  it('10% is the normal upper edge', () => {
    // depthA=100, depthB=90 → 10%
    const r = calculatePectus({ ciDepthA: 100, ciDepthB: 90 });
    expect(r.ci).toBe(10);
    expect(r.ciAbnormal).toBe(false);
    expect(r.ciInterpretation).toMatch(/Normal/);
  });

  it('depthB = 0 (pectus to spine) is accepted and yields 100%', () => {
    const r = calculatePectus({ ciDepthA: 100, ciDepthB: 0 });
    expect(r.ci).toBe(100);
    expect(r.ciAbnormal).toBe(true);
  });

  it('missing depthA → null', () => {
    expect(calculatePectus({ ciDepthB: 80 }).ci).toBeNull();
  });
});

describe('calculatePectus — Depression Index', () => {
  it('depression / vertebral width', () => {
    // depth=20, vert=80 → 0.25
    const r = calculatePectus({ diDepth: 20, diVertWidth: 80 });
    expect(r.di).toBe(0.25);
    expect(r.diAbnormal).toBe(true);
    expect(r.diInterpretation).toMatch(/Abnormal/);
  });

  it('0.2 is the normal upper edge', () => {
    // depth=16, vert=80 → 0.2
    const r = calculatePectus({ diDepth: 16, diVertWidth: 80 });
    expect(r.di).toBe(0.2);
    expect(r.diAbnormal).toBe(false);
  });

  it('zero depression is accepted (no pectus)', () => {
    const r = calculatePectus({ diDepth: 0, diVertWidth: 80 });
    expect(r.di).toBe(0);
    expect(r.diAbnormal).toBe(false);
  });

  it('missing vertebral width → null', () => {
    expect(calculatePectus({ diDepth: 20 }).di).toBeNull();
  });
});

describe('calculatePectus — Modified Cardiac Compression Index', () => {
  it('H/M ratio', () => {
    const r = calculatePectus({ mcciH: 150, mcciM: 30 });
    expect(r.mcci).toBe(5);
    expect(r.mcciLabel).toBe('5.00');
  });

  it('missing M → null', () => {
    expect(calculatePectus({ mcciH: 150 }).mcci).toBeNull();
  });
});

describe('calculatePectus — Sternal Torsion Angle', () => {
  it('left tilt → positive angle label', () => {
    const r = calculatePectus({ staAngle: 10, staTilt: 'left' });
    expect(r.staText).toContain('10°');
    expect(r.staText).toContain('left side down');
    expect(r.staProvided).toBe(true);
  });

  it('right tilt → negative angle prefix', () => {
    const r = calculatePectus({ staAngle: 10, staTilt: 'right' });
    expect(r.staText).toContain('-10°');
    expect(r.staText).toContain('right side down');
  });

  it('no tilt', () => {
    const r = calculatePectus({ staAngle: 0, staTilt: 'none' });
    expect(r.staText).toContain('no tilt');
  });

  it('staAngle null → staProvided false', () => {
    const r = calculatePectus({});
    expect(r.staProvided).toBe(false);
    expect(r.staText).toBe('');
  });
});

describe('calculatePectus — level aggregation', () => {
  it('any abnormal index → level 3', () => {
    const r = calculatePectus({ piWidth: 400, piDepth: 100 });  // PI = 4 (abnormal)
    expect(r.piAbnormal).toBe(true);
    expect(r.level).toBe(3);
  });

  it('all normal indices → level 1', () => {
    const r = calculatePectus({ piWidth: 250, piDepth: 100 });  // PI = 2.5 (normal)
    expect(r.level).toBe(1);
  });

  it('no indices provided → level 0', () => {
    const r = calculatePectus({});
    expect(r.level).toBe(0);
    expect(r.piLabel).toBe('--');
    expect(r.ciLabel).toBe('--');
    expect(r.diLabel).toBe('--');
  });
});
