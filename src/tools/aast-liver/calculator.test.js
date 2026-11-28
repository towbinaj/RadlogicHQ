import { describe, it, expect } from 'vitest';
import { calculateAast } from './calculator.js';

// Mock definition matching the shape expected by calculateAast
const mockDefinition = {
  organ: 'Liver',
  categories: [
    {
      id: 'parenchymal',
      label: 'Parenchymal',
      findings: [
        { id: 'subCapsularLt10', label: 'Subcapsular hematoma <10%', grade: 1 },
        { id: 'laceration1cm', label: 'Laceration <1 cm depth', grade: 1 },
        { id: 'subCapsular10to50', label: 'Subcapsular hematoma 10-50%', grade: 2 },
        { id: 'laceration1to3cm', label: 'Laceration 1-3 cm depth', grade: 2 },
        { id: 'laceration3cm', label: 'Laceration >3 cm depth', grade: 3 },
      ],
    },
    {
      id: 'vascular',
      label: 'Vascular',
      findings: [
        { id: 'activeBleed', label: 'Active bleeding extending beyond parenchyma', grade: 4 },
        { id: 'hepaticAvulsion', label: 'Hepatic venous avulsion', grade: 5 },
      ],
    },
  ],
};

describe('calculateAast', () => {
  it('no findings → null grade', () => {
    const result = calculateAast({ selectedFindings: new Set() }, mockDefinition);
    expect(result.grade).toBeNull();
    expect(result.gradeLabel).toBe('--');
    expect(result.hasFindings).toBe(false);
  });

  it('single Grade II finding → Grade II', () => {
    const result = calculateAast(
      { selectedFindings: new Set(['subCapsular10to50']) },
      mockDefinition,
    );
    expect(result.grade).toBe(2);
    expect(result.gradeLabel).toBe('Grade II');
  });

  it('single Grade V finding → Grade V', () => {
    const result = calculateAast(
      { selectedFindings: new Set(['hepaticAvulsion']) },
      mockDefinition,
    );
    expect(result.grade).toBe(5);
    expect(result.gradeLabel).toBe('Grade V');
  });

  it('max grade wins among multiple findings', () => {
    const result = calculateAast(
      { selectedFindings: new Set(['subCapsularLt10', 'activeBleed']) },
      mockDefinition,
    );
    expect(result.grade).toBe(4);
    expect(result.gradeLabel).toBe('Grade IV');
  });

  it('multiple Grade I/II + multipleInjuries → Grade III advancement', () => {
    const result = calculateAast(
      {
        selectedFindings: new Set(['subCapsularLt10', 'laceration1to3cm']),
        multipleInjuries: true,
      },
      mockDefinition,
    );
    expect(result.grade).toBe(3);
    expect(result.gradeLabel).toBe('Grade III');
    expect(result.multipleInjuries).toBe(true);
  });

  it('multipleInjuries does not advance grade above II if already higher', () => {
    const result = calculateAast(
      {
        selectedFindings: new Set(['laceration3cm']),
        multipleInjuries: true,
      },
      mockDefinition,
    );
    // laceration3cm is Grade III, multipleInjuries should not change it
    expect(result.grade).toBe(3);
  });

  it('handles missing selectedFindings gracefully', () => {
    const result = calculateAast({}, mockDefinition);
    expect(result.grade).toBeNull();
    expect(result.selectedCount).toBe(0);
  });

  it('reports correct organ name', () => {
    const result = calculateAast({ selectedFindings: new Set() }, mockDefinition);
    expect(result.organ).toBe('Liver');
  });

  it('findingsText lists selected findings by category', () => {
    const result = calculateAast(
      { selectedFindings: new Set(['subCapsularLt10', 'activeBleed']) },
      mockDefinition,
    );
    expect(result.findingsText).toContain('Parenchymal');
    expect(result.findingsText).toContain('Vascular');
  });
});

// --- Extensions for the 2024 pancreas / 2025 kidney scales ---
// Existing liver/spleen/2018-kidney definitions use none of these fields and
// must grade exactly as before.

describe('calculateAast subgrades', () => {
  const subDef = {
    organ: 'Pancreas',
    scaleVersion: '2024',
    subgradeOrder: ['N', 'A', 'B', 'C', 'D'],
    advanceMultipleInjuries: false,
    categories: [
      { id: 'g1', label: 'G1', findings: [
        { id: 'edema', label: 'Edema', grade: 1, subgrade: 'A' },
        { id: 'contusion', label: 'Contusion', grade: 1, subgrade: 'B' },
      ] },
      { id: 'g3', label: 'G3', findings: [
        { id: 'deep-n', label: 'Deep, no duct eval', grade: 3, subgrade: 'N' },
        { id: 'duct-a', label: 'Partial duct', grade: 3, subgrade: 'A' },
        { id: 'duct-b', label: 'Complete duct', grade: 3, subgrade: 'B' },
      ] },
      { id: 'g4', label: 'G4', findings: [
        { id: 'head-n', label: 'Head deep, no duct eval', grade: 4, subgrade: 'N' },
      ] },
    ],
  };

  it('appends the subgrade to the grade label', () => {
    const r = calculateAast({ selectedFindings: new Set(['deep-n']) }, subDef);
    expect(r.grade).toBe(3);
    expect(r.subgrade).toBe('N');
    expect(r.gradeLabel).toBe('Grade III-N');
    expect(r.gradeLevel).toBe(3);
  });

  it('takes the subgrade from the highest-grade finding only', () => {
    const r = calculateAast({ selectedFindings: new Set(['duct-b', 'head-n']) }, subDef);
    expect(r.gradeLabel).toBe('Grade IV-N');
  });

  it('within the top grade, picks the later subgrade in subgradeOrder', () => {
    const r = calculateAast({ selectedFindings: new Set(['deep-n', 'duct-a']) }, subDef);
    expect(r.gradeLabel).toBe('Grade III-A');
    const r2 = calculateAast({ selectedFindings: new Set(['edema', 'contusion']) }, subDef);
    expect(r2.gradeLabel).toBe('Grade I-B');
  });

  it('exposes scaleVersion', () => {
    expect(calculateAast({ selectedFindings: new Set() }, subDef).scaleVersion).toBe('2024');
    expect(calculateAast({ selectedFindings: new Set() }, mockDefinition).scaleVersion).toBe('');
  });

  it('subgrade is null and label unchanged for definitions without subgrades', () => {
    const r = calculateAast({ selectedFindings: new Set(['laceration3cm']) }, mockDefinition);
    expect(r.subgrade).toBeNull();
    expect(r.gradeLabel).toBe('Grade III');
  });
});

describe('calculateAast advanceMultipleInjuries', () => {
  const noAdvance = { ...mockDefinition, advanceMultipleInjuries: false };

  it('ignores the multiple I/II -> III rule when the definition disables it', () => {
    const r = calculateAast({ selectedFindings: new Set(['subCapsularLt10', 'laceration1to3cm']), multipleInjuries: true }, noAdvance);
    expect(r.grade).toBe(2);
    expect(r.findingsText).not.toContain('Multiple low-grade injuries');
  });

  it('still advances by default (liver/spleen/2018 kidney)', () => {
    const r = calculateAast({ selectedFindings: new Set(['subCapsularLt10']), multipleInjuries: true }, mockDefinition);
    // Kozar 2018: "advance one grade for multiple injuries up to grade III"
    expect(r.grade).toBe(2);
  });
});

describe('calculateAast escalations', () => {
  const escDef = {
    organ: 'Kidney',
    advanceMultipleInjuries: false,
    escalations: [
      { allOf: ['active-bleeding'], anyOf: ['mfk', 'infarct-complete'], grade: 5 },
    ],
    categories: [
      { id: 'v', label: 'Vascular', findings: [
        { id: 'active-bleeding', label: 'Active bleeding', grade: 4 },
        { id: 'infarct-complete', label: 'Complete infarction', grade: 4 },
      ] },
      { id: 'p', label: 'Parenchyma', findings: [
        { id: 'mfk', label: 'Multifragmented kidney', grade: 4 },
        { id: 'lac', label: 'Laceration', grade: 2 },
      ] },
    ],
  };

  it('raises the grade when every allOf and at least one anyOf finding is present', () => {
    expect(calculateAast({ selectedFindings: new Set(['active-bleeding', 'mfk']) }, escDef).grade).toBe(5);
    expect(calculateAast({ selectedFindings: new Set(['active-bleeding', 'infarct-complete']) }, escDef).grade).toBe(5);
  });

  it('does not escalate on a partial match', () => {
    expect(calculateAast({ selectedFindings: new Set(['mfk']) }, escDef).grade).toBe(4);
    expect(calculateAast({ selectedFindings: new Set(['active-bleeding', 'lac']) }, escDef).grade).toBe(4);
  });

  it('never lowers a grade', () => {
    const def = { ...escDef, escalations: [{ allOf: ['lac'], grade: 1 }] };
    expect(calculateAast({ selectedFindings: new Set(['lac', 'mfk']) }, def).grade).toBe(4);
  });
});

// --- Real 2018 liver definition vs Kozar 2018 table ---
import { aastLiverDefinition } from './definition.js';

describe('AAST liver 2018 — vascular injury grades (Kozar 2018)', () => {
  const g = (ids, m = false) => calculateAast({ selectedFindings: new Set(ids), multipleInjuries: m }, aastLiverDefinition).grade;

  it('pseudoaneurysm / AV fistula (liver vascular injury) is Grade III', () => {
    expect(g(['pseudoaneurysm'])).toBe(3);
  });

  it('active bleeding contained within liver parenchyma is Grade III', () => {
    expect(g(['extrav-contained'])).toBe(3);
  });

  it('active bleeding extending into the peritoneum is Grade IV', () => {
    expect(g(['extrav-peritoneal'])).toBe(4);
  });

  it('juxtahepatic venous injury is Grade V', () => {
    expect(g(['juxtahepatic'])).toBe(5);
  });

  it('multiple injuries advance one grade, up to III', () => {
    expect(g(['sub-lt10', 'lac-lt1'], true)).toBe(2);
    expect(g(['sub-10-50', 'lac-1-3'], true)).toBe(3);
    expect(g(['lac-gt3'], true)).toBe(3);
  });

  it('report labels are ASCII', () => {
    for (const c of aastLiverDefinition.categories) for (const f of c.findings) expect(f.label).not.toMatch(/[^\x20-\x7E]/);
  });
});
