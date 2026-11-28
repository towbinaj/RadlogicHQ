import { describe, it, expect } from 'vitest';
import { calculateLirads } from './calculator.js';

// Major features default to 'no' (answered) so each test isolates its rule;
// unanswered features leave the observation uncategorized.
const calc = (fs) => calculateLirads({ aphe: 'no', washout: 'no', capsule: 'no', ...fs });

// Retroactive coverage for Phase 2 multi-item parse rollout.
// See docs/test.md section 9.

describe('calculateLirads — early exits', () => {
  it('definitelyBenign → LR-1', () => {
    const r = calculateLirads({ definitelyBenign: 'yes' });
    expect(r.category).toBe('LR-1');
    expect(r.categoryLevel).toBe(1);
    expect(r.categoryLabel).toBe('Definitely Benign');
  });

  it('probablyBenign → LR-2', () => {
    const r = calculateLirads({ probablyBenign: 'yes' });
    expect(r.category).toBe('LR-2');
    expect(r.categoryLevel).toBe(2);
  });

  it('tumorInVein → LR-TIV (even with HCC features)', () => {
    const r = calculateLirads({
      tumorInVein: 'yes',
      size: 30, aphe: 'yes', washout: 'yes',
    });
    expect(r.category).toBe('LR-TIV');
    expect(r.categoryLevel).toBe(7);
  });

  it('lrmFeatures → LR-M', () => {
    const r = calculateLirads({ lrmFeatures: 'yes', size: 25 });
    expect(r.category).toBe('LR-M');
    expect(r.categoryLevel).toBe(6);
    expect(r.management).toMatch(/Biopsy/);
  });

  it('no size returns incomplete', () => {
    const r = calculateLirads({ aphe: 'yes' });
    expect(r.category).toBe('--');
    expect(r.categoryLabel).toBe('Incomplete');
    expect(r.sizeProvided).toBe(false);
  });
});

describe('calculateLirads — APHE+ table boundaries', () => {
  it('<10 mm + APHE + 0 features → LR-3', () => {
    const r = calc({ size: 8, aphe: 'yes' });
    expect(r.category).toBe('LR-3');
  });

  it('<10 mm + APHE + 1 feature → LR-4', () => {
    const r = calc({ size: 8, aphe: 'yes', washout: 'yes' });
    expect(r.category).toBe('LR-4');
  });

  it('<10 mm + APHE + 2 features → LR-4 (cannot reach LR-5 <10mm)', () => {
    const r = calc({
      size: 8, aphe: 'yes', washout: 'yes', capsule: 'yes',
    });
    expect(r.category).toBe('LR-4');
  });

  it('10 mm + APHE + 0 features → LR-3', () => {
    const r = calc({ size: 10, aphe: 'yes' });
    expect(r.category).toBe('LR-3');
  });

  it('10-19 mm + APHE + washout only → LR-5 (v2018)', () => {
    const r = calc({ size: 15, aphe: 'yes', washout: 'yes' });
    expect(r.category).toBe('LR-5');
  });

  it('10-19 mm + APHE + threshold growth only → LR-5 (v2018)', () => {
    const r = calc({ size: 15, aphe: 'yes', thresholdGrowth: 'yes' });
    expect(r.category).toBe('LR-5');
  });

  it('10-19 mm + APHE + capsule only → LR-4 (v2018)', () => {
    const r = calc({ size: 15, aphe: 'yes', capsule: 'yes' });
    expect(r.category).toBe('LR-4');
  });

  it('10-19 mm + APHE + 2 features → LR-5', () => {
    const r = calc({
      size: 15, aphe: 'yes', washout: 'yes', capsule: 'yes',
    });
    expect(r.category).toBe('LR-5');
  });

  it('≥20 mm + APHE + 0 features → LR-4', () => {
    const r = calc({ size: 25, aphe: 'yes' });
    expect(r.category).toBe('LR-4');
  });

  it('≥20 mm + APHE + 1 feature → LR-5', () => {
    const r = calc({ size: 25, aphe: 'yes', washout: 'yes' });
    expect(r.category).toBe('LR-5');
  });

  it('≥20 mm + APHE + 3 features caps at column ≥2 → LR-5', () => {
    const r = calc({
      size: 25, aphe: 'yes',
      washout: 'yes', capsule: 'yes', thresholdGrowth: 'yes',
    });
    expect(r.category).toBe('LR-5');
    expect(r.additionalCount).toBe(3);
  });
});

describe('calculateLirads — APHE- table boundaries', () => {
  it('<10 mm + no APHE + 0 features → LR-3 (no separate <10 mm row without APHE)', () => {
    const r = calc({ size: 8 });
    expect(r.category).toBe('LR-3');
  });

  it('<10 mm + no APHE + 2 features → LR-4', () => {
    const r = calc({ size: 5, washout: 'yes', capsule: 'yes' });
    expect(r.category).toBe('LR-4');
  });

  it('10 mm + no APHE + 0 features → LR-3', () => {
    const r = calc({ size: 10 });
    expect(r.category).toBe('LR-3');
  });

  it('10-19 mm + no APHE + 2 features → LR-4', () => {
    const r = calc({
      size: 15, washout: 'yes', capsule: 'yes',
    });
    expect(r.category).toBe('LR-4');
  });

  it('≥20 mm + no APHE + 1 feature → LR-4', () => {
    const r = calc({ size: 25, washout: 'yes' });
    expect(r.category).toBe('LR-4');
  });
});

describe('calculateLirads — ancillary feature adjustment', () => {
  it('ancillary favoring HCC upgrades LR-3 to LR-4', () => {
    const r = calc({
      size: 8, aphe: 'yes',
      anc_hcc_something: true,
    });
    // Base: 8 mm + APHE + 0 features = LR-3 → upgraded to LR-4
    expect(r.category).toBe('LR-4');
    expect(r.adjustmentNote).toMatch(/Upgraded/);
  });

  it('ancillary favoring benign downgrades LR-3 to LR-2', () => {
    const r = calc({
      size: 8, aphe: 'yes',
      anc_benign_something: true,
    });
    expect(r.category).toBe('LR-2');
    expect(r.adjustmentNote).toMatch(/Downgraded/);
  });

  it('ancillary cannot upgrade to LR-5 (capped at LR-4)', () => {
    const r = calc({
      size: 15, aphe: 'yes', capsule: 'yes',  // base LR-4
      anc_hcc_something: true,
    });
    // Would be LR-5 via upgrade, but ancillary can't reach LR-5.
    expect(r.category).toBe('LR-4');
    expect(r.adjustmentNote).toMatch(/cannot upgrade to LR-5/);
  });

  it('conflicting ancillary (both groups) → no adjustment', () => {
    const r = calc({
      size: 8, aphe: 'yes',  // base LR-3
      anc_hcc_something: true,
      anc_benign_something: true,
    });
    expect(r.category).toBe('LR-3');
    expect(r.adjustmentNote).toBe('');
  });
});

describe('calculateLirads — feature summary + metadata', () => {
  it('lists all present features in summary', () => {
    const r = calc({
      size: 25, aphe: 'yes', washout: 'yes', capsule: 'yes',
    });
    expect(r.featureSummary).toContain('APHE');
    expect(r.featureSummary).toContain('Washout');
    expect(r.featureSummary).toContain('Capsule');
  });

  it('summary is "None" when no major features', () => {
    const r = calc({ size: 12 });
    expect(r.featureSummary).toBe('None');
  });

  it('exposes sizeMm + sizeCm', () => {
    const r = calc({ size: 25 });
    expect(r.sizeMm).toBe(25);
    expect(r.sizeCm).toBe('2.5');
  });

  it('reason string describes the categorization inputs', () => {
    const r = calc({ size: 15, aphe: 'yes', washout: 'yes' });
    expect(r.reason).toContain('15 mm');
    expect(r.reason).toContain('APHE+');
    expect(r.reason).toContain('1 additional feature');
  });
});

// --- Audit fix: v2018 ancillary feature lists ---
describe('LI-RADS ancillary lists match v2018', () => {
  it('benign list has no fat-in-mass (it favors HCC) and no homogeneous signal (not a v2018 feature)', async () => {
    const { liradsDefinition } = await import('./definition.js');
    const benign = liradsDefinition.ancillaryFeatures.favoringBenign.map((f) => f.id);
    expect(benign).not.toContain('fatInMass');
    expect(benign).not.toContain('homogeneousSignal');
    const hcc = liradsDefinition.ancillaryFeatures.favoringHCC.map((f) => f.label.toLowerCase()).join(' ');
    expect(hcc).toMatch(/fat in mass/);
  });
});

describe('LI-RADS: no category until APHE, washout and capsule are answered (audit 2026-11-28)', () => {
  it('size only -> incomplete', () => {
    expect(calculateLirads({ size: 25 }).category).toBe('--');
    expect(calculateLirads({ size: 25, aphe: 'yes' }).category).toBe('--');
  });
  it('all three answered -> categorized (growth may be left unassessed)', () => {
    expect(calculateLirads({ size: 25, aphe: 'yes', washout: 'yes', capsule: 'no' }).category).toBe('LR-5');
    expect(calculateLirads({ size: 25, aphe: 'no', washout: 'no', capsule: 'no' }).category).toBe('LR-3');
  });
});
