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

describe('NASCET impossible values and occlusion (audit 2026-11-28)', () => {
  it('stenosis diameter larger than distal ICA is flagged, not reported as a percentage', () => {
    const r = calculateNascet({ stenosisDiam: 6, distalDiam: 5 });
    expect(r.pctProvided).toBe(false);
    expect(r.note).toMatch(/check measurements/i);
  });
  it('negative diameter is rejected', () => {
    expect(calculateNascet({ stenosisDiam: -1, distalDiam: 5 }).pctProvided).toBe(false);
  });
  it('zero residual lumen is reported as occlusion', () => {
    const r = calculateNascet({ stenosisDiam: 0, distalDiam: 5 });
    expect(r.severity).toBe('Occlusion');
  });
});

import { calculateCarotid } from './calculator.js';

describe('Carotid stenosis by modality: diameter (NASCET) vs duplex US (SRU 2003)', () => {
  it('angiographic modality uses the NASCET diameter formula', () => {
    const r = calculateCarotid({ modality: 'angio', stenosisDiam: 1.5, distalDiam: 5 });
    expect(r.pct).toBe(70);
    expect(r.methodLabel).toBe('NASCET');
  });
  it('no modality defaults to angiographic diameter method', () => {
    expect(calculateCarotid({ stenosisDiam: 1.5, distalDiam: 5 }).pct).toBe(70);
  });
  it('duplex US: SRU categories from ICA PSV and plaque', () => {
    const us = (o) => calculateCarotid({ modality: 'us', ...o });
    expect(us({ psv: 100, plaque: 'none' }).category).toBe('normal');
    expect(us({ psv: 100, plaque: 'lt50' }).category).toBe('lt50');
    expect(us({ psv: 125, plaque: 'ge50' }).category).toBe('50to69');
    expect(us({ psv: 230, plaque: 'ge50' }).category).toBe('50to69');
    expect(us({ psv: 231, plaque: 'ge50' }).category).toBe('ge70');
    expect(us({ flow: 'nearOcclusion' }).category).toBe('nearOcclusion');
    expect(us({ flow: 'absent' }).category).toBe('occlusion');
    expect(us({ psv: 300, plaque: 'ge50' }).methodLabel).toMatch(/SRU/);
  });
  it('duplex US: no category until PSV (or occlusion) is entered; diameters ignored', () => {
    const r = calculateCarotid({ modality: 'us', stenosisDiam: 1.5, distalDiam: 5 });
    expect(r.pctProvided).toBe(false);
    expect(r.impressionText).toBe('');
  });
  it('duplex US: discordant additional parameters are noted', () => {
    const r = calculateCarotid({ modality: 'us', psv: 150, plaque: 'ge50', ratio: 5, edv: 120 });
    expect(r.category).toBe('50to69');
    expect(r.note).toMatch(/ratio|EDV/i);
  });
  it('duplex US impression', () => {
    expect(calculateCarotid({ modality: 'us', side: 'right', psv: 180, plaque: 'ge50' }).impressionText)
      .toBe('Right ICA: 50-69% stenosis by SRU duplex US criteria (ICA PSV 180 cm/s).');
  });
});

import { parseFindings } from '../../core/parser.js';
import { nascetDefinition } from './definition.js';

describe('Carotid parse: duplex US values and modality (2026-11-28)', () => {
  it('reads PSV, EDV, ratio and duplex modality', () => {
    const fs = parseFindings('Right carotid duplex: ICA PSV 260 cm/s, EDV 110 cm/s, ICA/CCA ratio 4.5.', nascetDefinition).formState;
    expect(fs).toMatchObject({ modality: 'us', psv: 260, edv: 110, ratio: 4.5, side: 'right' });
  });
  it('reads CTA as the diameter method', () => {
    expect(parseFindings('CTA neck. Left ICA stenosis 2 mm, distal 6 mm.', nascetDefinition).formState.modality).toBe('angio');
  });
});
