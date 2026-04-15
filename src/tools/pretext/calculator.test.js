import { describe, it, expect } from 'vitest';
import { calculatePretext } from './calculator.js';

// Retroactive coverage for the oncologic-response tool backlog.
// See docs/test.md section 9.

// Helper: build a formState with the given sections marked 'yes'.
function involved(...sections) {
  const fs = {};
  for (const s of sections) fs[s] = 'yes';
  return fs;
}

describe('calculatePretext — group lookup (table hits)', () => {
  it.each([
    // Group 1: single favorable section
    [['rightPosterior'],                                         1],
    [['leftLateral'],                                            1],
    // Group 2: single unfavorable section
    [['caudate'],                                                2],
    [['rightAnterior'],                                          2],
    [['leftMedial'],                                             2],
    // Group 2: two-section combos
    [['rightPosterior', 'rightAnterior'],                        2],
    [['leftMedial', 'leftLateral'],                              2],
    [['caudate', 'leftLateral'],                                 2],
    // Group 3: centrally-located two-section
    [['rightAnterior', 'leftMedial'],                            3],
    [['rightAnterior', 'leftLateral'],                           3],
    // Group 3: three-section combos
    [['rightPosterior', 'rightAnterior', 'leftMedial'],          3],
    [['caudate', 'rightPosterior', 'rightAnterior', 'leftMedial'], 3],
    // Group 4: all sections
    [['caudate', 'rightPosterior', 'rightAnterior', 'leftMedial', 'leftLateral'], 4],
    [['rightPosterior', 'rightAnterior', 'leftMedial', 'leftLateral'],            4],
  ])('sections %j → PRETEXT %d', (sections, expectedGroup) => {
    const r = calculatePretext(involved(...sections));
    expect(r.group).toBe(expectedGroup);
    expect(r.groupLevel).toBe(expectedGroup);
    expect(r.groupLabel).toBe(`PRETEXT ${['', 'I', 'II', 'III', 'IV'][expectedGroup]}`);
  });
});

describe('calculatePretext — incomplete', () => {
  it('no sections → group null + reason', () => {
    const r = calculatePretext({});
    expect(r.group).toBeNull();
    expect(r.groupLabel).toBe('--');
    expect(r.groupFullLabel).toBe('--');
    expect(r.reason).toMatch(/Select/);
    expect(r.groupLevel).toBe(0);
  });

  it('all sections set to "no" → still incomplete', () => {
    const r = calculatePretext({
      caudate: 'no', rightPosterior: 'no', rightAnterior: 'no',
      leftMedial: 'no', leftLateral: 'no',
    });
    expect(r.group).toBeNull();
  });
});

describe('calculatePretext — annotation codes', () => {
  it('positive V + P appear in annotationSummary and fullLabel', () => {
    const r = calculatePretext({
      ...involved('rightPosterior'),
      ann_V: 'yes', ann_P: 'yes',
    });
    expect(r.annotationSummary).toBe('VP');
    expect(r.groupFullLabel).toBe('PRETEXT 1 VP');
    expect(r.positiveAnnotations).toEqual(['V', 'P']);
  });

  it('no positive annotations → summary is "None"', () => {
    const r = calculatePretext(involved('rightPosterior'));
    expect(r.annotationSummary).toBe('None');
    expect(r.groupFullLabel).toBe('PRETEXT 1');
  });

  it('annotation three-state: yes/no/unknown/unset', () => {
    const r = calculatePretext({
      ...involved('rightPosterior'),
      ann_V: 'yes', ann_P: 'no', ann_E: 'unknown',
    });
    expect(r.V).toBe('Positive');
    expect(r.P).toBe('Negative');
    expect(r.E).toBe('Unknown');
    expect(r.F).toBe('Not assessed');
    expect(r.VProvided).toBe(true);
    expect(r.FProvided).toBe(false);
  });

  it('all 7 annotation codes present → full string VPEFRNM', () => {
    const fs = involved('rightPosterior');
    for (const c of ['V', 'P', 'E', 'F', 'R', 'N', 'M']) fs['ann_' + c] = 'yes';
    const r = calculatePretext(fs);
    expect(r.annotationSummary).toBe('VPEFRNM');
    expect(r.groupFullLabel).toBe('PRETEXT 1 VPEFRNM');
  });
});

describe('calculatePretext — section detail and labels', () => {
  it('section detail reports Involved/Free/Not assessed', () => {
    const r = calculatePretext({
      caudate: 'yes', rightPosterior: 'no',  // leftLateral etc. unset
    });
    expect(r.sectionDetails.C).toBe('Involved');
    expect(r.sectionDetails.RP).toBe('Free');
    expect(r.sectionDetails.LL).toBe('Not assessed');
  });

  it('reason string includes involved codes and count', () => {
    const r = calculatePretext(involved('caudate', 'rightPosterior'));
    expect(r.reason).toContain('C');
    expect(r.reason).toContain('RP');
    expect(r.reason).toContain('2/5 sections');
  });
});

describe('calculatePretext — size metadata', () => {
  it('maxDiameter populates sizeMm and sizeCm', () => {
    const r = calculatePretext({
      ...involved('rightPosterior'),
      maxDiameter: 85,
    });
    expect(r.sizeMm).toBe(85);
    expect(r.sizeCm).toBe('8.5');
    expect(r.sizeProvided).toBe(true);
  });

  it('no maxDiameter → null sizeCm', () => {
    const r = calculatePretext(involved('rightPosterior'));
    expect(r.sizeProvided).toBe(false);
    expect(r.sizeCm).toBeNull();
  });
});
