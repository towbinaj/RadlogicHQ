import { describe, it, expect } from 'vitest';
import { calculateScoliosis } from './calculator.js';

// Retroactive coverage for the measurement tool backlog.
// See docs/test.md section 9.

describe('calculateScoliosis — curve formatting', () => {
  it('dextro + thoracic + angle → full sentence', () => {
    const r = calculateScoliosis({
      curves: [{ direction: 'dextro', region: 'thoracic', angle: 25 }],
    });
    expect(r.hasCurves).toBe(true);
    expect(r.curvesText).toContain('Dextroscoliosis of the thoracic spine');
    expect(r.curvesText).toContain('25 degrees');
    expect(r.primaryAngle).toBe(25);
  });

  it('levo + lumbar + vertebral range + apex', () => {
    const r = calculateScoliosis({
      curves: [{
        direction: 'levo', region: 'lumbar', angle: 18,
        upperVertebra: 'L1', lowerVertebra: 'L5', apex: 'L3',
      }],
    });
    expect(r.curvesText).toContain('Levoscoliosis of the lumbar spine');
    expect(r.curvesText).toContain('18 degrees');
    expect(r.curvesText).toContain('(L1-L5)');
    expect(r.curvesText).toContain('apex at L3');
  });

  it('no direction → generic "Scoliosis" prefix', () => {
    const r = calculateScoliosis({
      curves: [{ region: 'thoracolumbar', angle: 10 }],
    });
    expect(r.curvesText).toMatch(/^Scoliosis of the thoracolumbar spine/);
  });

  it('no region → bare direction (no "of the")', () => {
    const r = calculateScoliosis({
      curves: [{ direction: 'dextro', angle: 15 }],
    });
    expect(r.curvesText).toBe('Dextroscoliosis measuring 15 degrees.');
  });

  it('multiple curves → joined with newline', () => {
    const r = calculateScoliosis({
      curves: [
        { direction: 'dextro', region: 'thoracic', angle: 20 },
        { direction: 'levo',  region: 'lumbar',   angle: 12 },
      ],
    });
    expect(r.curvesText.split('\n')).toHaveLength(2);
    expect(r.primaryAngle).toBe(20);  // first with a positive angle
  });

  it('empty curves array → "None."', () => {
    const r = calculateScoliosis({ curves: [] });
    expect(r.hasCurves).toBe(false);
    expect(r.curvesText).toBe('None.');
  });

  it('blank curve (no angle/direction/region) is skipped', () => {
    const r = calculateScoliosis({
      curves: [{}, { direction: 'dextro', region: 'thoracic', angle: 20 }],
    });
    expect(r.curvesText.split('\n')).toHaveLength(1);
  });
});

describe('calculateScoliosis — detail fields', () => {
  it('hardware present with detail → detail text', () => {
    const r = calculateScoliosis({
      curves: [], hardware: 'present', hardwareDetail: 'T2-L4 pedicle screw fusion',
    });
    expect(r.hardwareText).toBe('T2-L4 pedicle screw fusion');
  });

  it('hardware present without detail → "Present."', () => {
    const r = calculateScoliosis({ curves: [], hardware: 'present' });
    expect(r.hardwareText).toBe('Present.');
  });

  it('no hardware → "None."', () => {
    const r = calculateScoliosis({ curves: [] });
    expect(r.hardwareText).toBe('None.');
  });

  it('maps scoliosis type ID to label', () => {
    expect(calculateScoliosis({
      curves: [], scoliosisType: 'idiopathic',
    }).scoliosisTypeLabel).toBe('Idiopathic');
    expect(calculateScoliosis({
      curves: [], scoliosisType: 'neuromuscular',
    }).scoliosisTypeLabel).toBe('Neuromuscular');
  });

  it('maps kyphosis state', () => {
    expect(calculateScoliosis({ curves: [], kyphosis: 'increased' }).kyphosisLabel).toBe('Increased');
    expect(calculateScoliosis({ curves: [], kyphosis: 'normal' }).kyphosisLabel).toBe('Normal');
  });

  it('pelvic obliquity / vertebral / rib detail branches', () => {
    const r = calculateScoliosis({
      curves: [],
      pelvicObliquity: 'present', pelvicObliquityDetail: '3 cm left elevation',
      vertebralAbnormalities: 'present', vertebralDetail: 'hemivertebra at T6',
      ribAbnormalities: 'present',  // no detail
    });
    expect(r.pelvicObliquityText).toBe('3 cm left elevation');
    expect(r.vertebralText).toBe('hemivertebra at T6');
    expect(r.ribText).toBe('Present.');
  });
});

describe('calculateScoliosis — skeletal maturity', () => {
  it('maps triradiate states', () => {
    expect(calculateScoliosis({ curves: [], triradiate: 'open' }).triradiateLabel).toBe('Open');
    expect(calculateScoliosis({ curves: [], triradiate: 'closed' }).triradiateLabel).toBe('Closed');
    expect(calculateScoliosis({ curves: [], triradiate: 'not-visualized' }).triradiateLabel).toBe('Not visualized');
  });

  it('risser stored as string', () => {
    const r = calculateScoliosis({ curves: [], risser: 3 });
    expect(r.risserLabel).toBe('3');
    expect(r.risserProvided).toBe(true);
  });

  it('risser 0 still marked provided', () => {
    const r = calculateScoliosis({ curves: [], risser: 0 });
    expect(r.risserLabel).toBe('0');
    expect(r.risserProvided).toBe(true);
  });
});

describe('calculateScoliosis — free-text passthrough', () => {
  it('priorMeasurements trim', () => {
    const r = calculateScoliosis({
      curves: [], priorMeasurements: '  Cobb 22° on prior  ',
    });
    expect(r.priorText).toBe('Cobb 22° on prior');
    expect(r.priorProvided).toBe(true);
  });

  it('chestAbdomen defaults to "Normal."', () => {
    expect(calculateScoliosis({ curves: [] }).chestAbdomenText).toBe('Normal.');
  });

  it('chestAbdomen passthrough when provided', () => {
    const r = calculateScoliosis({
      curves: [], chestAbdomen: 'Mild atelectasis.',
    });
    expect(r.chestAbdomenText).toBe('Mild atelectasis.');
  });
});
