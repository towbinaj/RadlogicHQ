import { describe, it, expect } from 'vitest';
import { calculateBosniak } from './calculator.js';

// Bosniak v2019 (Silverman 2019). CT table as reproduced in Cancers 2024
// (doi 10.3390/cancers16101926, Table 2); MRI table in JMRI 2021
// (doi 10.1002/jmri.27364, Table 1). Enhancement is unequivocal visual
// enhancement or >=20 HU (CT) / >=15% SI increase (MRI).

const CT = { modality: 'ct', exam: 'protocol', content: 'simple', wall: 'thinSmooth', septa: 'none', calcification: 'none', softTissue: 'absent' };
const MR = { modality: 'mri', exam: 'enhanced', content: 'simple', wall: 'thinSmooth', septa: 'none', softTissue: 'absent' };
const cls = (fs) => calculateBosniak(fs).categoryShort;

describe('Bosniak v2019 — modality is required first', () => {
  it('no modality or exam -> incomplete', () => {
    expect(cls({ wall: 'thinSmooth' })).toBe('--');
    expect(cls({ modality: 'ct', wall: 'thinSmooth' })).toBe('--');
    expect(calculateBosniak({}).categoryLabel).toBe('Incomplete');
  });
});

describe('Bosniak v2019 — CT', () => {
  it('class I: thin smooth wall, -9 to 20 HU on an enhanced exam, no septa/calcification (wall may enhance)', () => {
    expect(cls(CT)).toBe('I');
    expect(cls({ ...CT, exam: 'enhanced', enhancement: 'present' })).toBe('I');
    expect(calculateBosniak(CT).category).toBe('Bosniak I');
  });
  it('class II attenuation types', () => {
    expect(cls({ ...CT, exam: 'unenhanced' })).toBe('II'); // -9 to 20 HU at non-contrast CT
    expect(cls({ ...CT, exam: 'unenhanced', content: 'hyper70' })).toBe('II');
    expect(cls({ ...CT, content: 'nonenh20' })).toBe('II');
    expect(cls({ ...CT, exam: 'enhanced', content: 'pv2130' })).toBe('II');
    expect(cls({ ...CT, content: 'tooSmall' })).toBe('II');
  });
  it('content option must fit the exam (21-30 HU needs portal venous phase)', () => {
    expect(cls({ ...CT, exam: 'unenhanced', content: 'pv2130' })).toBe('--');
  });
  it('few thin septa or any calcification -> II', () => {
    expect(cls({ ...CT, septa: 'thinSmooth' })).toBe('II');
    expect(cls({ ...CT, calcification: 'thick' })).toBe('II');
    expect(calculateBosniak({ ...CT, calcification: 'thick' }).note).toMatch(/MRI/);
  });
  it('heterogeneous at CT with no higher feature -> MRI before classifying', () => {
    const r = calculateBosniak({ ...CT, content: 'hetero' });
    expect(r.categoryShort).toBe('--');
    expect(r.reason).toMatch(/MRI/);
  });
  it('IIF / III / IV need enhancement', () => {
    expect(cls({ ...CT, wall: 'minThickSmooth', enhancement: 'present' })).toBe('IIF');
    expect(cls({ ...CT, septa: 'thinSmoothMany', enhancement: 'present' })).toBe('IIF');
    expect(cls({ ...CT, wall: 'thickIrregular', enhancement: 'present' })).toBe('III');
    expect(cls({ ...CT, softTissue: 'present', enhancement: 'present' })).toBe('IV');
    expect(cls({ ...CT, wall: 'thickIrregular', enhancement: 'none' })).toBe('II');
    expect(cls({ ...CT, softTissue: 'present', enhancement: 'none' })).toBe('II');
    expect(cls({ ...CT, wall: 'thickIrregular' })).toBe('--');
  });
  it('legacy perceived/measurable values count as enhancement', () => {
    expect(cls({ ...CT, wall: 'thickIrregular', enhancement: 'measurable' })).toBe('III');
    expect(cls({ ...CT, wall: 'minThickSmooth', enhancement: 'perceived' })).toBe('IIF');
  });
  it('unenhanced CT: highest class II', () => {
    const r = calculateBosniak({ ...CT, exam: 'unenhanced', wall: 'thickIrregular' });
    expect(r.categoryShort).toBe('II');
    expect(r.note).toMatch(/unenhanced/i);
  });
  it('highest class wins (IV over III)', () => {
    expect(cls({ ...CT, wall: 'thickIrregular', softTissue: 'present', enhancement: 'present' })).toBe('IV');
  });
});

describe('Bosniak v2019 — MRI', () => {
  it('class I needs contrast; simple fluid on unenhanced MRI is II', () => {
    expect(cls(MR)).toBe('I');
    expect(cls({ ...MR, exam: 'unenhanced' })).toBe('II');
  });
  it('calcification is not an MRI criterion', () => {
    expect(cls({ ...MR, calcification: 'thick' })).toBe('I');
  });
  it('homogeneous markedly T1 hyperintense -> II; heterogeneous T1 hyperintense -> IIF', () => {
    expect(cls({ ...MR, content: 't1bright' })).toBe('II');
    expect(cls({ ...MR, content: 't1hetero' })).toBe('IIF');
    expect(cls({ ...MR, exam: 'unenhanced', content: 't1hetero' })).toBe('II'); // unenhanced MRI max II
  });
  it('enhancing features grade as on CT', () => {
    expect(cls({ ...MR, wall: 'thickIrregular', enhancement: 'present' })).toBe('III');
    expect(cls({ ...MR, softTissue: 'present', enhancement: 'present' })).toBe('IV');
    expect(cls({ ...MR, septa: 'minThickSmooth', enhancement: 'none' })).toBe('II');
  });
  it('CT-only content values are ignored on MRI', () => {
    expect(cls({ ...MR, content: 'hyper70' })).toBe('--');
  });
});

describe('Bosniak — definition', () => {
  it('septa labels say 1-3 and >=4; enhancement has no perceived/measurable split', async () => {
    const { bosniakDefinition } = await import('./definition.js');
    const labels = bosniakDefinition.septa.options.map((o) => o.label).join(' ');
    expect(labels).toMatch(/1-3/);
    expect(labels).toMatch(/>=4/);
    expect(bosniakDefinition.enhancement.options.map((o) => o.id)).toEqual(['none', 'present']);
  });
  it('IV label and level', () => {
    const r = calculateBosniak({ ...CT, softTissue: 'present', enhancement: 'present' });
    expect(r.categoryLabel).toBe('Likely Malignant');
    expect(r.categoryLevel).toBe(5);
  });
});

import { parseSegmentedFindings } from '../../core/parser.js';
import { bosniakDefinition } from './definition.js';

describe('Bosniak parse: modality, exam, enhancement (2026-11-28)', () => {
  const p = (t) => { const r = parseSegmentedFindings(t, bosniakDefinition); return r.segments[0]?.formState || r.ungrouped.formState; };
  it('reads modality and exam', () => {
    expect(p('Renal mass protocol CT: 2 cm cyst with thin wall.')).toMatchObject({ modality: 'ct', exam: 'protocol' });
    expect(p('MRI without contrast: 2 cm cyst.')).toMatchObject({ modality: 'mri', exam: 'unenhanced' });
  });
  it('reads enhancement presence and absence', () => {
    expect(p('Thick wall that enhances.').enhancement).toBe('present');
    expect(p('Thick non-enhancing wall.').enhancement).toBe('none');
    expect(p('Thick wall, no enhancement.').enhancement).toBe('none');
  });
});
