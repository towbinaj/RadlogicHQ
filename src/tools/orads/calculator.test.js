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

describe('calculateOrads — unilocular smooth', () => {
  it('color score 1 → O-RADS 2', () => {
    const r = calculateOrads({
      morphology: 'unilocularSmooth', colorScore: '1',
    });
    expect(r.categoryShort).toBe('2');
  });

  it('color score 2 → O-RADS 2', () => {
    const r = calculateOrads({
      morphology: 'unilocularSmooth', colorScore: '2',
    });
    expect(r.categoryShort).toBe('2');
  });

  it('color score 3 → O-RADS 3', () => {
    const r = calculateOrads({
      morphology: 'unilocularSmooth', colorScore: '3',
    });
    expect(r.categoryShort).toBe('3');
  });

  it('color score 4 → O-RADS 3', () => {
    const r = calculateOrads({
      morphology: 'unilocularSmooth', colorScore: '4',
    });
    expect(r.categoryShort).toBe('3');
  });

  it('no color score → incomplete', () => {
    const r = calculateOrads({ morphology: 'unilocularSmooth' });
    expect(r.categoryShort).toBe('--');
  });
});

describe('calculateOrads — unilocular irregular', () => {
  it('color score 1-2 → O-RADS 3', () => {
    const r = calculateOrads({
      morphology: 'unilocularIrregular', colorScore: '2',
    });
    expect(r.categoryShort).toBe('3');
  });

  it('color score 3-4 → O-RADS 4', () => {
    const r = calculateOrads({
      morphology: 'unilocularIrregular', colorScore: '3',
    });
    expect(r.categoryShort).toBe('4');
  });
});

describe('calculateOrads — multilocular', () => {
  it('multilocular smooth + CS 1-2 → O-RADS 3', () => {
    const r = calculateOrads({
      morphology: 'multilocularSmooth', colorScore: '1',
    });
    expect(r.categoryShort).toBe('3');
  });

  it('multilocular smooth + CS 3-4 → O-RADS 4', () => {
    const r = calculateOrads({
      morphology: 'multilocularSmooth', colorScore: '4',
    });
    expect(r.categoryShort).toBe('4');
  });

  it('multilocular irregular + CS 1-2 → O-RADS 4', () => {
    const r = calculateOrads({
      morphology: 'multilocularIrregular', colorScore: '2',
    });
    expect(r.categoryShort).toBe('4');
  });

  it('multilocular irregular + CS 3-4 → O-RADS 5', () => {
    const r = calculateOrads({
      morphology: 'multilocularIrregular', colorScore: '4',
    });
    expect(r.categoryShort).toBe('5');
  });
});

describe('calculateOrads — solid', () => {
  it('solid smooth + CS 1-2 → O-RADS 3', () => {
    const r = calculateOrads({
      morphology: 'solidSmooth', colorScore: '1',
    });
    expect(r.categoryShort).toBe('3');
  });

  it('solid smooth + CS 3-4 → O-RADS 4', () => {
    const r = calculateOrads({
      morphology: 'solidSmooth', colorScore: '4',
    });
    expect(r.categoryShort).toBe('4');
  });

  it('solid irregular → O-RADS 5 (color score irrelevant)', () => {
    const r = calculateOrads({ morphology: 'solidIrregular' });
    expect(r.categoryShort).toBe('5');
  });
});

describe('calculateOrads — metadata', () => {
  it('populates all labels and sizeCm', () => {
    const r = calculateOrads({
      morphology: 'multilocularIrregular', colorScore: '3', size: 45,
    });
    expect(r.category).toBe('O-RADS 5');
    expect(r.categoryLabel).toBe('High Risk');
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
