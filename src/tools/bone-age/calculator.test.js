import { describe, it, expect } from 'vitest';
import { calculateBoneAge } from './calculator.js';

// Retroactive coverage for the MSK/orthopedic tool backlog.
// See docs/test.md section 9. As of the Sontag split, this file
// covers ONLY the Greulich & Pyle calculator. Sontag-specific
// tests (method label, ossification count passthrough) live in
// src/tools/bone-age-sontag/calculator.test.js.

// Interpretation uses the Brush Foundation standard deviations from the
// Greulich & Pyle atlas (2nd ed., 1959; Tables 1-2 as reproduced in the
// Gilsanz/Ratib Hand Bone Age atlas): normal = chronological age +/- 2 SD,
// SD interpolated between tabulated ages. Sex is required.
import { brushSD, interpretBoneAge } from './brush.js';

describe('Brush Foundation SD table', () => {
  it('returns tabulated values', () => {
    expect(brushSD('male', 120)).toBe(9.79);     // boys 10 y
    expect(brushSD('female', 108)).toBe(10.74);  // girls 9 y (atlas worked example)
    expect(brushSD('female', 12)).toBe(1.77);
  });

  it('interpolates between tabulated ages (girl 9 y 9 m)', () => {
    // 108 mo 10.74 -> 120 mo 11.73: 117 mo = 10.74 + 0.75*0.99
    expect(brushSD('female', 117)).toBeCloseTo(11.4825, 3);
  });

  it('null outside the table or without sex', () => {
    expect(brushSD('male', 2)).toBeNull();
    expect(brushSD('female', 200)).toBeNull(); // girls table ends at 16 y (192 mo)
    expect(brushSD(undefined, 120)).toBeNull();
  });
});

describe('calculateBoneAge — G&P interpretation by Brush SD', () => {
  it('within 2 SD is within normal limits', () => {
    // boy 10 y, SD 9.79 mo; bone age 11 y = +12 mo = +1.2 SD
    const r = calculateBoneAge({ sex: 'male', chronoYears: 10, boneAgeYears: 11 });
    expect(r.interpretation).toMatch(/within normal limits/i);
    expect(r.level).toBe(1);
    expect(r.zLabel).toBe('+1.2 SD');
  });

  it('infant: 1 y with bone age 2 months is delayed (was "concordant" with +/-1 y band)', () => {
    const r = calculateBoneAge({ sex: 'male', chronoYears: 1, boneAgeYears: 0, boneAgeMonths: 2 });
    expect(r.interpretation).toMatch(/delayed/i);
    expect(r.level).toBe(3);
  });

  it('16 y boy +1.5 y is within 2 SD (SD 12.86 mo), not advanced', () => {
    const r = calculateBoneAge({ sex: 'male', chronoYears: 16, boneAgeYears: 17, boneAgeMonths: 6 });
    expect(r.interpretation).toMatch(/within normal limits/i);
  });

  it('beyond +2 SD is advanced, with SD count', () => {
    // girl 6 y, SD 10.23; +30 mo = +2.9 SD
    const r = calculateBoneAge({ sex: 'female', chronoYears: 6, boneAgeYears: 8, boneAgeMonths: 6 });
    expect(r.interpretation).toMatch(/advanced/i);
    expect(r.zLabel).toBe('+2.9 SD');
  });

  it('normal range reported as CA +/- 2 SD in months', () => {
    const r = calculateBoneAge({ sex: 'male', chronoYears: 10, boneAgeYears: 10 });
    expect(r.normalRangeLabel).toBe('100.4-139.6 months');
  });

  it('no sex: no interpretation, asks for sex', () => {
    const r = calculateBoneAge({ chronoYears: 8, boneAgeYears: 8 });
    expect(r.interpretation).toBe('');
    expect(r.interpretationNote).toMatch(/sex/i);
  });

  it('age outside the Brush table: no interpretation, noted', () => {
    const r = calculateBoneAge({ sex: 'female', chronoYears: 17, boneAgeYears: 17 });
    expect(r.interpretation).toBe('');
    expect(r.interpretationNote).toMatch(/outside/i);
  });

  it('interpretBoneAge is exported for Sontag', () => {
    expect(interpretBoneAge('male', 120, 120).level).toBe(1);
  });
});

describe('calculateBoneAge — difference label', () => {
  it('differenceLabel includes sign for negative difference', () => {
    const r = calculateBoneAge({
      chronoYears: 10, boneAgeYears: 7,
    });
    expect(r.differenceLabel).toBe('-3.0 years');
  });
});

describe('calculateBoneAge — age formatting', () => {
  it('years + months → "8 years 6 months"', () => {
    const r = calculateBoneAge({ chronoYears: 8, chronoMonths: 6 });
    expect(r.chronoLabel).toBe('8 years 6 months');
  });

  it('singular units: 1 year 1 month', () => {
    const r = calculateBoneAge({ chronoYears: 1, chronoMonths: 1 });
    expect(r.chronoLabel).toBe('1 year 1 month');
  });

  it('months only', () => {
    const r = calculateBoneAge({ chronoMonths: 6 });
    expect(r.chronoLabel).toBe('6 months');
  });

  it('zero years zero months → "0"', () => {
    const r = calculateBoneAge({ chronoYears: 0, chronoMonths: 0 });
    expect(r.chronoLabel).toBe('0');
  });
});

describe('calculateBoneAge — metadata', () => {
  it('methodLabel is Greulich and Pyle (HL7-safe, no ampersand)', () => {
    const r = calculateBoneAge({ sex: 'male' });
    expect(r.methodLabel).toBe('Greulich and Pyle'); // no '&': HL7 delimiter
    expect(r.sexLabel).toBe('Male');
  });

  it('female sex label', () => {
    const r = calculateBoneAge({ sex: 'female' });
    expect(r.sexLabel).toBe('Female');
  });
});

describe('calculateBoneAge — incomplete', () => {
  it('no chronological age → no difference', () => {
    const r = calculateBoneAge({ boneAgeYears: 8 });
    expect(r.chronoProvided).toBe(false);
    expect(r.boneAgeProvided).toBe(true);
    expect(r.differenceProvided).toBe(false);
    expect(r.level).toBe(0);
  });

  it('no bone age → no difference', () => {
    const r = calculateBoneAge({ chronoYears: 8 });
    expect(r.boneAgeProvided).toBe(false);
    expect(r.differenceProvided).toBe(false);
    expect(r.level).toBe(0);
  });

  it('nothing provided → no label, no interpretation', () => {
    const r = calculateBoneAge({});
    expect(r.chronoLabel).toBe('');
    expect(r.boneAgeLabel).toBe('');
    expect(r.interpretation).toBe('');
    expect(r.differenceLabel).toBe('--');
    expect(r.level).toBe(0);
  });
});

// --- Audit fix: templates must use fields the calculator returns ---
import { boneAgeTemplates } from './templates.js';
describe('bone-age templates', () => {
  it('reference methodLabel (returned) rather than modeLabel (never set)', () => {
    const all = JSON.stringify(boneAgeTemplates);
    expect(all).not.toMatch(/modeLabel/);
    expect(all).toMatch(/methodLabel/);
  });
});
