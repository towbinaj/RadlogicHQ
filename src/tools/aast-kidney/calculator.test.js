import { describe, it, expect } from 'vitest';
import { calculateAast } from '../aast-liver/calculator.js';
import { aastKidneyDefinition } from './definition.js';

// Retroactive coverage for commit e49ee76 (Set/array conversion in
// applyParsedToSide). aast-kidney uses the shared calculateAast from
// aast-liver; this file exercises it against the kidney definition
// specifically, including the kidney-only grade-4/5 findings and the
// multiple-injury upgrade rule. See docs/test.md section 9.
//
// applyParsedToSide itself is closure-scoped inside aast-kidney.js init(),
// so it can't be imported directly. The key invariant it enforces —
// calculateAast correctly handles a Set<string> for selectedFindings — is
// covered here at the calculator level.

function side(findingIds, multipleInjuries = false) {
  return {
    selectedFindings: new Set(findingIds),
    multipleInjuries,
  };
}

describe('calculateAast + aastKidneyDefinition — single finding grades', () => {
  it.each([
    ['sub-nonexpanding',       1],
    ['perirenal-nonexpanding', 2],
    ['lac-lt1',                2],
    ['lac-gt1',                3],
    ['contained',              3],
    ['active-sub',             4],
    ['active-beyond',          4],
    ['urine-extrav',           4],
    ['lac-pelvis',             4],
    ['devasc-segmental',       4],
    ['shattered',              5],
    ['devasc-main',            5],
    ['devascularized',         5],
  ])('finding %s yields grade %d', (findingId, expectedGrade) => {
    const r = calculateAast(side([findingId]), aastKidneyDefinition);
    expect(r.grade).toBe(expectedGrade);
    expect(r.gradeLevel).toBe(expectedGrade);
    expect(r.organ).toBe('Kidney');
    expect(r.hasFindings).toBe(true);
    expect(r.selectedCount).toBe(1);
  });
});

describe('calculateAast + aastKidneyDefinition — max-grade rule', () => {
  it('picks the highest grade when multiple findings are selected', () => {
    const r = calculateAast(
      side(['sub-nonexpanding', 'urine-extrav', 'lac-lt1']),
      aastKidneyDefinition,
    );
    // Grades: 1, 4, 2 → max = 4.
    expect(r.grade).toBe(4);
    expect(r.gradeLabel).toBe('Grade IV');
    expect(r.selectedCount).toBe(3);
  });

  it('grade V wins when a shattered kidney is present', () => {
    const r = calculateAast(
      side(['perirenal-nonexpanding', 'shattered']),
      aastKidneyDefinition,
    );
    expect(r.grade).toBe(5);
    expect(r.gradeLabel).toBe('Grade V');
  });
});

describe('calculateAast + aastKidneyDefinition — multiple-injury upgrade', () => {
  it('two Grade I findings + multipleInjuries → upgraded to Grade III', () => {
    const r = calculateAast(
      side(['sub-nonexpanding'], true),
      aastKidneyDefinition,
    );
    // Grade 1 base, upgraded by the multipleInjuries flag.
    expect(r.grade).toBe(3);
    expect(r.gradeLabel).toBe('Grade III');
    expect(r.multipleInjuries).toBe(true);
    expect(r.findingsText).toContain('Multiple low-grade injuries present');
  });

  it('Grade II + multipleInjuries → upgraded to Grade III', () => {
    const r = calculateAast(
      side(['perirenal-nonexpanding'], true),
      aastKidneyDefinition,
    );
    expect(r.grade).toBe(3);
  });

  it('Grade III + multipleInjuries stays at Grade III (no upgrade)', () => {
    const r = calculateAast(
      side(['lac-gt1'], true),
      aastKidneyDefinition,
    );
    expect(r.grade).toBe(3);
  });

  it('Grade IV + multipleInjuries stays at Grade IV (rule only upgrades 1/2)', () => {
    const r = calculateAast(
      side(['urine-extrav'], true),
      aastKidneyDefinition,
    );
    expect(r.grade).toBe(4);
  });
});

describe('calculateAast + aastKidneyDefinition — findings text', () => {
  it('groups findings by category label in findingsText', () => {
    const r = calculateAast(
      side(['sub-nonexpanding', 'lac-gt1', 'shattered']),
      aastKidneyDefinition,
    );
    expect(r.findingsText).toContain('Hematoma:');
    expect(r.findingsText).toContain('Laceration:');
    expect(r.findingsText).toContain('Collecting System and Parenchyma:');
  });
});

describe('calculateAast + aastKidneyDefinition — edge cases', () => {
  it('empty Set returns no findings', () => {
    const r = calculateAast(side([]), aastKidneyDefinition);
    expect(r.grade).toBeNull();
    expect(r.gradeLabel).toBe('--');
    expect(r.hasFindings).toBe(false);
    expect(r.findingsText).toBe('No injuries identified.');
    expect(r.selectedCount).toBe(0);
  });

  it('undefined selectedFindings is handled gracefully', () => {
    const r = calculateAast({}, aastKidneyDefinition);
    expect(r.grade).toBeNull();
    expect(r.hasFindings).toBe(false);
  });

  it('empty-Set + multipleInjuries does NOT create a phantom grade', () => {
    const r = calculateAast(
      { selectedFindings: new Set(), multipleInjuries: true },
      aastKidneyDefinition,
    );
    // maxGrade stays 0 — upgrade rule requires maxGrade > 0.
    expect(r.grade).toBeNull();
  });
});

// ===========================================================================
// AAST Kidney OIS 2025 update
// Keihani S et al. J Trauma Acute Care Surg 2025;98(3):448-451, Table 1
// (imaging criteria). Selected by the 2018/2025 toggle on the kidney page.
// ===========================================================================
import { aastKidney2025Definition } from './definition-2025.js';
import { getKidneyDefinition, KIDNEY_SCALES, DEFAULT_KIDNEY_SCALE } from './scales.js';
import { parseFindings } from '../../core/parser.js';

const k25 = (ids, multipleInjuries = false) =>
  calculateAast({ selectedFindings: new Set(ids), multipleInjuries }, aastKidney2025Definition);

describe('AAST kidney 2025 — every imaging criterion maps to its grade', () => {
  it.each([
    // Grade I
    ['sub-lt35',          1], // subcapsular hematoma <3.5 cm, no active bleeding
    ['contusion',         1], // parenchymal contusion without laceration
    // Grade II
    ['lac-lt25',          2], // laceration <2.5 cm
    ['hrd-lt35',          2], // HRD <3.5 cm, no active bleeding
    // Grade III
    ['lac-ge25',          3], // laceration >=2.5 cm
    ['hrd-ge35',          3], // HRD >=3.5 cm, no active bleeding
    ['infarct-partial',   3], // partial kidney infarction
    ['contained',         3], // vascular injury without active bleeding
    ['collecting-extrav', 3], // into collecting system and/or urinary extravasation
    // Grade IV
    ['active-bleeding',   4], // active bleeding from kidney
    ['pararenal',         4], // pararenal extension of hematoma
    ['infarct-complete',  4], // complete/near-complete infarction, no active bleeding
    ['mfk',               4], // multifragmented kidney, no active bleeding
    ['upj',               4], // complete/near-complete UPJ disruption
    // Grade V
    ['main-vessel',       5], // main renal artery/vein laceration or transection with bleeding
  ])('%s -> grade %d', (id, g) => {
    expect(k25([id]).grade).toBe(g);
  });

  it('defines exactly these 15 findings', () => {
    expect(aastKidney2025Definition.categories.flatMap((c) => c.findings)).toHaveLength(15);
  });
});

describe('AAST kidney 2025 — changes from 2018', () => {
  it('urinary extravasation is Grade III (was IV)', () => {
    expect(k25(['collecting-extrav']).grade).toBe(3);
  });

  it('partial (segmental) infarction is Grade III (was IV)', () => {
    expect(k25(['infarct-partial']).grade).toBe(3);
  });

  it('multifragmented kidney without active bleeding is Grade IV (shattered was V)', () => {
    expect(k25(['mfk']).grade).toBe(4);
  });

  it('MFK with active bleeding is Grade V', () => {
    expect(k25(['mfk', 'active-bleeding']).grade).toBe(5);
  });

  it('complete/near-complete infarction with active bleeding is Grade V', () => {
    expect(k25(['infarct-complete', 'active-bleeding']).grade).toBe(5);
  });

  it('active bleeding with a lesser finding stays Grade IV', () => {
    expect(k25(['lac-ge25', 'active-bleeding']).grade).toBe(4);
    expect(k25(['hrd-ge35', 'active-bleeding']).grade).toBe(4);
  });

  it('multiple Grade I/II injuries are not upgraded', () => {
    expect(aastKidney2025Definition.advanceMultipleInjuries).toBe(false);
    expect(k25(['sub-lt35', 'lac-lt25'], true).grade).toBe(2);
  });

  it('reports scale versions 2025 and 2018', () => {
    expect(k25([]).scaleVersion).toBe('2025');
    expect(calculateAast({ selectedFindings: new Set() }, aastKidneyDefinition).scaleVersion).toBe('2018');
  });

  it('labels are ASCII and HL7-safe', () => {
    for (const c of aastKidney2025Definition.categories) {
      expect(c.label).not.toMatch(/[|~^&\\]|[^\x20-\x7E]/);
      for (const f of c.findings) {
        expect(f.label).not.toMatch(/[|~^&\\]|[^\x20-\x7E]/);
        if (f.title) expect(f.title).not.toMatch(/[|~^&\\]|[^\x20-\x7E]/);
      }
    }
  });
});

describe('kidney scale selection', () => {
  it('defaults to 2025', () => {
    expect(DEFAULT_KIDNEY_SCALE).toBe('2025');
    expect(getKidneyDefinition()).toBe(aastKidney2025Definition);
  });

  it('returns the 2018 definition for "2018"', () => {
    expect(getKidneyDefinition('2018')).toBe(aastKidneyDefinition);
  });

  it('falls back to the default for unknown values', () => {
    expect(getKidneyDefinition('1989')).toBe(aastKidney2025Definition);
    expect(getKidneyDefinition(null)).toBe(aastKidney2025Definition);
  });

  it('lists both scales for the toggle', () => {
    expect(KIDNEY_SCALES.map((s) => s.id)).toEqual(['2025', '2018']);
  });
});

describe('AAST kidney 2025 — parse rules', () => {
  const parse = (t) => parseFindings(t, aastKidney2025Definition).formState.selectedFindings || [];

  it.each([
    ['2 cm laceration of the lower pole', 'lac-lt25'],
    ['laceration measuring 1.2 cm', 'lac-lt25'],
    ['24 mm laceration', 'lac-lt25'],
    ['2.5 cm laceration', 'lac-ge25'],
    ['3-cm laceration', 'lac-ge25'],
    ['laceration measuring 30 mm', 'lac-ge25'],
  ])('"%s" -> %s (2.5 cm cutoff)', (text, id) => {
    const found = parse(text);
    expect(found).toContain(id);
    expect(found).not.toContain(id === 'lac-lt25' ? 'lac-ge25' : 'lac-lt25');
  });

  it.each([
    ['perinephric hematoma measuring 2 cm', 'hrd-lt35', 'hrd-ge35'],
    ['perinephric hematoma measuring 4.1 cm', 'hrd-ge35', 'hrd-lt35'],
    ['hematoma rim distance of 3.5 cm', 'hrd-ge35', 'hrd-lt35'],
    ['perirenal hematoma', 'hrd-lt35', 'hrd-ge35'],
    ['subcapsular hematoma measuring 4 cm', 'hrd-ge35', 'sub-lt35'],
    ['small subcapsular hematoma', 'sub-lt35', 'hrd-ge35'],
  ])('"%s" -> %s, not %s (3.5 cm HRD cutoff)', (text, yes, no) => {
    const found = parse(text);
    expect(found).toContain(yes);
    expect(found).not.toContain(no);
  });

  it.each([
    ['urinary extravasation on delayed images', 'collecting-extrav'],
    ['laceration extends into the collecting system', 'collecting-extrav'],
    ['multifragmented kidney', 'mfk'],
    ['shattered kidney', 'mfk'],
    ['active arterial extravasation', 'active-bleeding'],
    ['segmental infarct of the upper pole', 'infarct-partial'],
    ['global infarction of the kidney', 'infarct-complete'],
    ['pseudoaneurysm', 'contained'],
    ['pararenal hematoma', 'pararenal'],
    ['ureteropelvic junction disruption', 'upj'],
    ['main renal artery transection', 'main-vessel'],
  ])('"%s" -> %s', (text, id) => {
    expect(parse(text)).toContain(id);
  });
});

describe('AAST kidney 2025 — label round-trip (no keyword collisions)', () => {
  const all = aastKidney2025Definition.categories.flatMap((c) => c.findings);
  it.each(all.map((f) => [f.id, f.label]))('label of %s selects only itself', (id, label) => {
    const found = parseFindings(label, aastKidney2025Definition).formState.selectedFindings || [];
    expect(found).toEqual([id]);
  });
});

describe('AAST kidney 2018 — label round-trip (no keyword collisions)', () => {
  const all = aastKidneyDefinition.categories.flatMap((c) => c.findings);
  // Overlaps that are clinically correct, not collisions: a laceration into
  // the renal pelvis "with urinary extravasation" does assert urinary
  // extravasation (same grade, IV), so selecting both is accurate.
  const IMPLIED = { 'lac-pelvis': ['urine-extrav'] };
  it.each(all.map((f) => [f.id, f.label]))('label of %s selects only itself', (id, label) => {
    const found = parseFindings(label, aastKidneyDefinition).formState.selectedFindings || [];
    expect([...found].sort()).toEqual([id, ...(IMPLIED[id] || [])].sort());
  });
});

describe('AAST kidney 2025 — comparison phrasing is not a measurement', () => {
  const parse = (t) => parseFindings(t, aastKidney2025Definition).formState.selectedFindings || [];
  it('"subcapsular hematoma <3.5 cm" stays Grade I', () => {
    expect(parse('subcapsular hematoma <3.5 cm')).not.toContain('hrd-ge35');
  });
  it('"perinephric hematoma less than 3.5 cm" is not >=3.5', () => {
    expect(parse('perinephric hematoma less than 3.5 cm')).not.toContain('hrd-ge35');
  });
});
