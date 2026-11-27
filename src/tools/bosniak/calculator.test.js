import { describe, it, expect } from 'vitest';
import { calculateBosniak } from './calculator.js';

describe('calculateBosniak', () => {
  it('softTissue present → Bosniak IV', () => {
    const result = calculateBosniak({ softTissue: 'present', wall: 'thinSmooth' });
    expect(result.categoryShort).toBe('IV');
    expect(result.category).toBe('Bosniak IV');
  });

  it('wall thickIrregular → Bosniak III', () => {
    const result = calculateBosniak({ wall: 'thickIrregular', softTissue: 'absent' });
    expect(result.categoryShort).toBe('III');
  });

  it('septa thickIrregular → Bosniak III', () => {
    const result = calculateBosniak({ septa: 'thickIrregular', wall: 'thinSmooth', softTissue: 'absent' });
    expect(result.categoryShort).toBe('III');
  });

  it('wall minThickSmooth → Bosniak IIF', () => {
    const result = calculateBosniak({ wall: 'minThickSmooth', softTissue: 'absent' });
    expect(result.categoryShort).toBe('IIF');
  });

  it('septa thinSmoothMany → Bosniak IIF', () => {
    const result = calculateBosniak({ septa: 'thinSmoothMany', wall: 'thinSmooth', softTissue: 'absent' });
    expect(result.categoryShort).toBe('IIF');
  });

  it('septa thinSmooth → Bosniak II', () => {
    const result = calculateBosniak({ septa: 'thinSmooth', wall: 'thinSmooth', softTissue: 'absent' });
    expect(result.categoryShort).toBe('II');
  });

  it('wall thinSmooth, no septa → Bosniak I', () => {
    const result = calculateBosniak({ wall: 'thinSmooth', softTissue: 'absent' });
    expect(result.categoryShort).toBe('I');
    expect(result.category).toBe('Bosniak I');
  });

  it('no wall, no softTissue → incomplete (null category)', () => {
    const result = calculateBosniak({});
    expect(result.categoryShort).toBe('--');
    expect(result.categoryLabel).toBe('Incomplete');
  });

  it('IV has correct label and level', () => {
    const result = calculateBosniak({ softTissue: 'present', wall: 'thinSmooth' });
    expect(result.categoryLabel).toBe('Likely Malignant');
    expect(result.categoryLevel).toBe(5);
  });

  it('hierarchy: softTissue present overrides wall thickIrregular', () => {
    const result = calculateBosniak({ softTissue: 'present', wall: 'thickIrregular' });
    expect(result.categoryShort).toBe('IV');
  });
});

// --- Audit fix: Bosniak v2019 septa counts and calcification (Silverman 2019) ---
describe('calculateBosniak — v2019 septa counts', () => {
  it('few (1-3) thin smooth septa is class II', () => {
    const r = calculateBosniak({ wall: 'thinSmooth', septa: 'thinSmooth' });
    expect(r.categoryShort).toBe('II');
    expect(r.reason).toMatch(/1-3/);
  });

  it('many (>=4) thin smooth septa is class IIF', () => {
    const r = calculateBosniak({ wall: 'thinSmooth', septa: 'thinSmoothMany' });
    expect(r.categoryShort).toBe('IIF');
    expect(r.reason).toMatch(/>=4/);
  });

  it('septa option labels say 1-3 and >=4', async () => {
    const { bosniakDefinition } = await import('./definition.js');
    const labels = bosniakDefinition.septa.options.map((o) => o.label).join(' ');
    expect(labels).toMatch(/1-3/);
    expect(labels).toMatch(/>=4/);
  });

  it('thin smooth wall, no septa, with calcification is class II (not I)', () => {
    const r = calculateBosniak({ wall: 'thinSmooth', septa: 'none', calcification: 'thick' });
    expect(r.categoryShort).toBe('II');
  });
});
