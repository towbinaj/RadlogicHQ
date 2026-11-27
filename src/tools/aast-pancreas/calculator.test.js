import { describe, it, expect } from 'vitest';
import { calculateAast } from '../aast-liver/calculator.js';
import { aastPancreasDefinition } from './definition.js';

// AAST Pancreatic Organ Injury Scale, 2024 revision.
// Notrica DM et al. J Trauma Acute Care Surg 2025;98(3):442-447, Table 1.
// aast-pancreas uses the shared calculateAast from aast-liver.

function side(findingIds, multipleInjuries = false) {
  return { selectedFindings: new Set(findingIds), multipleInjuries };
}

const grade = (ids, m) => calculateAast(side(ids, m), aastPancreasDefinition);

describe('AAST pancreas 2024 — every Table 1 row maps to its grade and subgrade', () => {
  it.each([
    // Grade I: edema or contusion without laceration/hematoma
    ['edema',              'Grade I-A'],
    ['contusion',          'Grade I-B'],
    // Grade II: laceration/hematoma <50% depth, or >=50% with intact duct
    ['lac-nbt',            'Grade II-A'],  // neck, body, or tail
    ['lac-head',           'Grade II-B'],  // head or uncinate
    // Grade III: duct injury or >=50% depth, neck/body/tail
    ['deep-nbt-n',         'Grade III-N'], // no definitive ductal evaluation
    ['duct-nbt-partial',   'Grade III-A'], // confirmed, ductal alignment
    ['duct-nbt-complete',  'Grade III-B'], // confirmed, transected/distracted
    // Grade IV: same, head or uncinate
    ['deep-head-n',        'Grade IV-N'],
    ['duct-head-partial',  'Grade IV-A'],
    ['duct-head-complete', 'Grade IV-B'],
    // Grade V: destroyed, nonviable pancreatic head
    ['destr-intact',       'Grade V-A'],   // intact main duct in head
    ['destr-mpd',          'Grade V-B'],   // main duct injury
    ['destr-cbd',          'Grade V-C'],   // intrapancreatic CBD injury
    ['destr-avulsion',     'Grade V-D'],   // avulsion off duodenum / sphincter
  ])('%s -> %s', (id, label) => {
    const r = grade([id]);
    expect(r.gradeLabel).toBe(label);
    expect(r.organ).toBe('Pancreas');
    expect(r.hasFindings).toBe(true);
  });

  it('covers all 14 Table 1 subgrades and nothing else', () => {
    const all = aastPancreasDefinition.categories.flatMap((c) => c.findings);
    expect(all).toHaveLength(14);
  });
});

describe('AAST pancreas 2024 — key changes from 1990', () => {
  it('head laceration without duct injury is Grade II (was IV in 1990)', () => {
    expect(grade(['lac-head']).grade).toBe(2);
  });

  it('location decides III vs IV for deep/ductal injuries', () => {
    expect(grade(['duct-nbt-complete']).grade).toBe(3);
    expect(grade(['duct-head-complete']).grade).toBe(4);
  });

  it('multiple low-grade injuries do not advance the grade', () => {
    expect(aastPancreasDefinition.advanceMultipleInjuries).toBe(false);
    expect(grade(['edema', 'lac-nbt'], true).gradeLabel).toBe('Grade II-A');
  });

  it('reports the 2024 scale version', () => {
    expect(grade([]).scaleVersion).toBe('2024');
  });
});

describe('AAST pancreas 2024 — combinations', () => {
  it('highest grade wins across locations', () => {
    expect(grade(['lac-head', 'duct-nbt-partial']).gradeLabel).toBe('Grade III-A');
    expect(grade(['deep-nbt-n', 'deep-head-n']).gradeLabel).toBe('Grade IV-N');
  });

  it('confirmed ductal findings outrank -N within the same grade', () => {
    expect(grade(['deep-nbt-n', 'duct-nbt-complete']).gradeLabel).toBe('Grade III-B');
  });

  it('Grade V subgrades: later letter wins when several apply', () => {
    expect(grade(['destr-mpd', 'destr-cbd']).gradeLabel).toBe('Grade V-C');
  });

  it('empty selection -> no grade', () => {
    const r = grade([]);
    expect(r.grade).toBeNull();
    expect(r.gradeLabel).toBe('--');
    expect(r.findingsText).toBe('No injuries identified.');
  });

  it('findings text lists the selected finding under its category', () => {
    const r = grade(['duct-head-partial']);
    expect(r.findingsText).toMatch(/head or uncinate/i);
    expect(r.findingsText).toMatch(/alignment/i);
  });
});

describe('AAST pancreas 2024 — HL7 safety of labels', () => {
  it('no HL7 delimiters or non-ASCII in category or finding labels', () => {
    for (const c of aastPancreasDefinition.categories) {
      expect(c.label).not.toMatch(/[|~^&\\]|[^\x20-\x7E]/);
      for (const f of c.findings) {
        expect(f.label).not.toMatch(/[|~^&\\]|[^\x20-\x7E]/);
        if (f.title) expect(f.title).not.toMatch(/[|~^&\\]|[^\x20-\x7E]/);
      }
    }
  });
});
