import { describe, it, expect } from 'vitest';
import { calculateOrads } from './calculator.js';

// Retroactive coverage for Phase 2 multi-item parse rollout.
// See docs/test.md section 9.

describe('calculateOrads — short-circuit branches', () => {
  it('peritoneal nodularity → O-RADS 5 (overrides everything)', () => {
    const r = calculateOrads({
      peritoneal: 'present',
      morphology: 'unilocularSmooth',
      colorScore: '1',
    });
    expect(r.categoryShort).toBe('5');
    expect(r.reason).toMatch(/Peritoneal/);
  });

  it('classic benign + simple cyst ≤30 mm → O-RADS 1 (physiologic)', () => {
    const r = calculateOrads({
      classicBenign: 'simpleCyst', size: 25,
    });
    expect(r.categoryShort).toBe('1');
    expect(r.reason).toMatch(/physiologic/i);
  });

  it('classic benign + simple cyst >30 mm → O-RADS 2', () => {
    const r = calculateOrads({
      classicBenign: 'simpleCyst', size: 35,
    });
    expect(r.categoryShort).toBe('2');
  });

  it('classic benign + simple cyst exactly 30 mm → O-RADS 1 (boundary)', () => {
    const r = calculateOrads({
      classicBenign: 'simpleCyst', size: 30,
    });
    expect(r.categoryShort).toBe('1');
  });

  it('classic benign dermoid → O-RADS 2', () => {
    const r = calculateOrads({ classicBenign: 'dermoid' });
    expect(r.categoryShort).toBe('2');
  });

  it('no morphology and no classic benign → incomplete', () => {
    const r = calculateOrads({});
    expect(r.categoryShort).toBe('--');
  });
});

// O-RADS US risk stratification (Andreotti 2020; v2022 update, Strachowski
// 2023). Color score drives the category only for solid lesions; cystic
// lesions without a solid component are graded by morphology and size.
describe('calculateOrads — cystic lesions without solid component', () => {
  const c = (fs) => calculateOrads(fs).categoryShort;

  it.each([
    [{ morphology: 'unilocularSmooth', size: 50, colorScore: '1' }, '2'],
    [{ morphology: 'unilocularSmooth', size: 50, colorScore: '4' }, '2'],
    [{ morphology: 'unilocularSmooth', size: 100, colorScore: '1' }, '3'],
    [{ morphology: 'unilocularSmooth', size: 120 }, '3'],
    [{ morphology: 'unilocularIrregular', size: 40, colorScore: '1' }, '3'],
    [{ morphology: 'unilocularIrregular', size: 40, colorScore: '4' }, '3'],
    [{ morphology: 'multilocularSmooth', size: 50, colorScore: '1' }, '3'],
    [{ morphology: 'multilocularSmooth', size: 50, colorScore: '3' }, '3'],
    [{ morphology: 'multilocularSmooth', size: 100, colorScore: '2' }, '4'],
    [{ morphology: 'multilocularSmooth', size: 50, colorScore: '4' }, '4'],
    [{ morphology: 'multilocularIrregular', size: 50, colorScore: '1' }, '4'],
    [{ morphology: 'multilocularIrregular', size: 50, colorScore: '4' }, '4'],
  ])('%j -> O-RADS %s', (fs, cat) => {
    expect(c(fs)).toBe(cat);
  });

  it('unilocular smooth without size is incomplete', () => {
    expect(c({ morphology: 'unilocularSmooth', colorScore: '1' })).toBe('--');
  });

  it('multilocular smooth CS 1-3 without size is incomplete', () => {
    expect(c({ morphology: 'multilocularSmooth', colorScore: '2' })).toBe('--');
  });
});

describe('calculateOrads — solid lesions', () => {
  const c = (fs) => calculateOrads(fs).categoryShort;

  it.each([
    ['1', '3'], ['2', '4'], ['3', '4'], ['4', '5'],
  ])('solid smooth, color score %s -> O-RADS %s', (cs, cat) => {
    expect(c({ morphology: 'solidSmooth', colorScore: cs })).toBe(cat);
  });

  it('solid irregular -> O-RADS 5 (color score irrelevant)', () => {
    expect(c({ morphology: 'solidIrregular', colorScore: '1' })).toBe('5');
  });

  it('solid smooth without color score is incomplete', () => {
    expect(c({ morphology: 'solidSmooth' })).toBe('--');
  });
});

describe('calculateOrads — ascites and classic lesions', () => {
  const c = (fs) => calculateOrads(fs).categoryShort;

  it('ascites -> O-RADS 5', () => {
    expect(c({ morphology: 'solidSmooth', colorScore: '1', ascites: 'present' })).toBe('5');
  });

  it('classic benign lesion >=10 cm -> O-RADS 3', () => {
    expect(c({ classicBenign: 'endometrioma', size: 100 })).toBe('3');
    expect(c({ classicBenign: 'dermoid', size: 150 })).toBe('3');
    expect(c({ classicBenign: 'simpleCyst', size: 110 })).toBe('3');
  });

  it('classic benign lesion <10 cm stays O-RADS 2', () => {
    expect(c({ classicBenign: 'endometrioma', size: 99 })).toBe('2');
  });
});

describe('calculateOrads — metadata', () => {
  it('populates all labels and sizeCm', () => {
    const r = calculateOrads({
      morphology: 'multilocularIrregular', colorScore: '3', size: 45,
    });
    expect(r.category).toBe('O-RADS 4');
    expect(r.categoryLabel).toBe('Intermediate Risk');
    expect(r.morphologyLabel).toBe('Multilocular, irregular');
    expect(r.colorScoreLabel).toContain('Moderate');
    expect(r.sizeCm).toBe('4.5');
  });

  it('ascites label populated when provided', () => {
    const r = calculateOrads({
      morphology: 'solidIrregular', ascites: 'present',
    });
    expect(r.ascitesLabel).toBe('Present');
  });

  it('missing fields labelled Not assessed', () => {
    const r = calculateOrads({});
    expect(r.morphologyLabel).toBe('Not assessed');
    expect(r.colorScoreLabel).toBe('Not assessed');
    expect(r.peritonealLabel).toBe('Not assessed');
  });
});
