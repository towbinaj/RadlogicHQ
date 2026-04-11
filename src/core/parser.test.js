import { describe, it, expect } from 'vitest';
import { parseFindings, buildParseRules } from './parser.js';

describe('parseFindings', () => {
  it('returns empty result for empty text', () => {
    const def = { parseRules: { size: { pattern: /(\d+)\s*mm/i, group: 1 } } };
    const result = parseFindings('', def);
    expect(result.formState).toEqual({});
    expect(result.matched).toEqual([]);
    expect(result.unmatched).toEqual([]);
    expect(result.remainder).toBe('');
  });

  it('returns empty result when no parseRules and no definition structure', () => {
    const result = parseFindings('some text', {});
    expect(result.formState).toEqual({});
    expect(result.matched).toEqual([]);
  });

  // --- Pattern rules ---

  it('matches a pattern rule with group extraction', () => {
    const def = {
      parseRules: {
        size: {
          pattern: /(\d+)\s*mm/i,
          group: 1,
        },
      },
    };
    const result = parseFindings('Nodule measuring 15 mm', def);
    expect(result.formState.size).toBe('15');
    expect(result.matched).toContain('size');
  });

  it('matches a pattern rule with transform function', () => {
    const def = {
      parseRules: {
        size: {
          pattern: /(\d+(?:\.\d+)?)\s*mm/i,
          transform: (m) => parseFloat(m[1]),
        },
      },
    };
    const result = parseFindings('Nodule measuring 12.5 mm', def);
    expect(result.formState.size).toBe(12.5);
    expect(result.matched).toContain('size');
  });

  it('adds unmatched rule IDs to unmatched array', () => {
    const def = {
      parseRules: {
        size: { pattern: /(\d+)\s*mm/i, group: 1 },
        location: { pattern: /\b(right|left)\b/i, group: 1 },
      },
    };
    const result = parseFindings('Nodule measuring 10 mm', def);
    expect(result.matched).toContain('size');
    expect(result.unmatched).toContain('location');
  });

  // --- Options rules (single-select) ---

  it('matches an options rule with keyword map', () => {
    const def = {
      parseRules: {
        composition: {
          options: {
            solid: ['solid', 'predominantly solid'],
            cystic: ['cystic', 'predominantly cystic'],
          },
        },
      },
    };
    const result = parseFindings('Solid thyroid nodule', def);
    expect(result.formState.composition).toBe('solid');
    expect(result.matched).toContain('composition');
  });

  it('longest keyword match wins for options rule', () => {
    const def = {
      parseRules: {
        composition: {
          options: {
            solid: ['solid'],
            mostlySolid: ['predominantly solid'],
          },
        },
      },
    };
    const result = parseFindings('Predominantly solid nodule', def);
    expect(result.formState.composition).toBe('mostlySolid');
  });

  // --- Multi rules ---

  it('matches a multi-select rule with multiple keywords', () => {
    const def = {
      parseRules: {
        features: {
          multi: true,
          options: {
            calcification: ['calcification', 'calcified'],
            irregular: ['irregular margin', 'irregular'],
            taller: ['taller than wide'],
          },
        },
      },
    };
    const result = parseFindings('Calcified nodule with irregular margin', def);
    expect(result.formState.features).toEqual(
      expect.arrayContaining(['calcification', 'irregular']),
    );
    expect(result.formState.features).not.toContain('taller');
    expect(result.matched).toContain('features');
  });

  it('puts multi rule in unmatched when no keywords match', () => {
    const def = {
      parseRules: {
        features: {
          multi: true,
          options: {
            calcification: ['calcification'],
          },
        },
      },
    };
    const result = parseFindings('Normal thyroid', def);
    expect(result.unmatched).toContain('features');
  });

  // --- Remainder ---

  it('remainder contains unmatched text', () => {
    const def = {
      parseRules: {
        composition: {
          options: {
            solid: ['solid'],
          },
        },
      },
    };
    const result = parseFindings('Solid nodule, right lobe', def);
    expect(result.remainder).not.toContain('solid');
    expect(result.remainder.toLowerCase()).toContain('right lobe');
  });
});

// ============================================================
// buildParseRules — auto-generation from definition structure
// ============================================================

describe('buildParseRules', () => {
  it('generates rules from sections (point-based)', () => {
    const def = {
      sections: [
        {
          id: 'echogenicity',
          inputType: 'single-select',
          options: [
            { id: 'hypoechoic', label: 'Hypoechoic' },
            { id: 'hyperechoic', label: 'Hyperechoic' },
          ],
        },
      ],
    };
    const rules = buildParseRules(def);
    expect(rules.echogenicity).toBeDefined();
    expect(rules.echogenicity.options.hypoechoic).toContain('Hypoechoic');
    // Synonyms should be expanded
    expect(rules.echogenicity.options.hypoechoic).toContain('hypo-echoic');
  });

  it('generates multi-select rules for multi-select sections', () => {
    const def = {
      sections: [
        {
          id: 'features',
          inputType: 'multi-select',
          options: [
            { id: 'calc', label: 'Calcification' },
            { id: 'solid', label: 'Solid' },
          ],
        },
      ],
    };
    const rules = buildParseRules(def);
    expect(rules.features.multi).toBe(true);
    expect(rules.features.options.calc).toContain('Calcification');
  });

  it('generates rules from primaryInputs (single-select)', () => {
    const def = {
      primaryInputs: [
        {
          id: 'location',
          inputType: 'single-select',
          options: [
            { id: 'right', label: 'Right' },
            { id: 'left', label: 'Left' },
          ],
        },
      ],
    };
    const rules = buildParseRules(def);
    expect(rules.location.options.right).toContain('Right');
    expect(rules.location.options.right).toContain('right-sided');
  });

  it('generates regex rules from numeric primaryInputs', () => {
    const def = {
      primaryInputs: [
        {
          id: 'size',
          label: 'Size',
          inputType: 'float',
          unit: 'mm',
        },
      ],
    };
    const rules = buildParseRules(def);
    expect(rules.size.pattern).toBeDefined();
    // Should match "size: 15 mm" or "size 15"
    const match = 'size: 15 mm'.match(rules.size.pattern);
    expect(match).not.toBeNull();
    expect(rules.size.transform(match)).toBe(15);
  });

  it('generates rules from AAST-style categories with findings', () => {
    const def = {
      categories: [
        {
          id: 'hematoma',
          label: 'Hematoma',
          findings: [
            { id: 'sub-lt10', label: 'Subcapsular, <10% surface area', grade: 1 },
            { id: 'lac-gt3', label: '>3 cm parenchymal depth', grade: 3 },
          ],
        },
      ],
    };
    const rules = buildParseRules(def);
    expect(rules.selectedFindings).toBeDefined();
    expect(rules.selectedFindings.multi).toBe(true);
    expect(rules.selectedFindings.options['sub-lt10']).toContain('Subcapsular, <10% surface area');
  });

  it('generates rules from flat categories (BI-RADS style)', () => {
    const def = {
      categories: [
        { id: '0', label: '0 — Incomplete', management: 'Additional imaging' },
        { id: '4a', label: '4a — Low Suspicion', management: 'Tissue diagnosis' },
      ],
    };
    const rules = buildParseRules(def);
    expect(rules.category).toBeDefined();
    expect(rules.category.options['4a']).toContain('4a — Low Suspicion');
    expect(rules.category.options['4a']).toContain('4a');
  });

  it('generates rules from grades (VUR style)', () => {
    const def = {
      grades: [
        { id: 'I', label: 'Grade I' },
        { id: 'II', label: 'Grade II' },
      ],
    };
    const rules = buildParseRules(def);
    expect(rules.grade.options.I).toContain('Grade I');
    expect(rules.grade.options.I).toContain('grade 1'); // synonym
  });

  it('generates rules from scores (Deauville style)', () => {
    const def = {
      scores: [
        { id: '1', label: '1 — No Uptake', shortLabel: '1', interpretation: 'Complete metabolic response' },
      ],
    };
    const rules = buildParseRules(def);
    expect(rules.score.options['1']).toContain('1 — No Uptake');
    expect(rules.score.options['1']).toContain('1');
    expect(rules.score.options['1']).toContain('Complete metabolic response');
  });

  it('generates rules from named option groups (PI-RADS style)', () => {
    const def = {
      dce: {
        id: 'dce',
        label: 'DCE',
        options: [
          { id: 'negative', label: 'Negative' },
          { id: 'positive', label: 'Positive' },
        ],
      },
    };
    const rules = buildParseRules(def);
    expect(rules.dce).toBeDefined();
    expect(rules.dce.options.negative).toContain('Negative');
  });

  it('generates rules from sideOptions', () => {
    const def = {
      sideOptions: [
        { id: 'right', label: 'Right' },
        { id: 'left', label: 'Left' },
        { id: 'bilateral', label: 'Bilateral' },
      ],
    };
    const rules = buildParseRules(def);
    expect(rules.side.options.bilateral).toContain('Bilateral');
    expect(rules.side.options.bilateral).toContain('both');
  });

  it('generates rules from lateralityOptions', () => {
    const def = {
      lateralityOptions: [
        { id: 'right', label: 'Right' },
        { id: 'left', label: 'Left' },
      ],
    };
    const rules = buildParseRules(def);
    expect(rules.laterality).toBeDefined();
    expect(rules.laterality.options.right).toContain('Right');
  });
});

// ============================================================
// Integration: auto-generated + hand-written merge
// ============================================================

describe('parseFindings with auto-generated rules', () => {
  it('auto-generates and parses from sections without explicit parseRules', () => {
    const def = {
      parseRules: {},
      sections: [
        {
          id: 'echogenicity',
          label: 'Echogenicity',
          inputType: 'single-select',
          options: [
            { id: 'hypoechoic', label: 'Hypoechoic' },
            { id: 'hyperechoic', label: 'Hyperechoic' },
          ],
        },
      ],
    };
    const result = parseFindings('Hypoechoic nodule', def);
    expect(result.formState.echogenicity).toBe('hypoechoic');
    expect(result.matched).toContain('echogenicity');
  });

  it('matches synonyms from the dictionary', () => {
    const def = {
      parseRules: {},
      sections: [
        {
          id: 'echogenicity',
          label: 'Echogenicity',
          inputType: 'single-select',
          options: [
            { id: 'hypoechoic', label: 'Hypoechoic' },
          ],
        },
      ],
    };
    // "hypo-echoic" is a synonym for "hypoechoic"
    const result = parseFindings('Hypo-echoic lesion', def);
    expect(result.formState.echogenicity).toBe('hypoechoic');
  });

  it('hand-written parseRules override auto-generated', () => {
    const def = {
      parseRules: {
        echogenicity: {
          options: {
            hypoechoic: ['dark', 'low echo'],
          },
        },
      },
      sections: [
        {
          id: 'echogenicity',
          label: 'Echogenicity',
          inputType: 'single-select',
          options: [
            { id: 'hypoechoic', label: 'Hypoechoic' },
          ],
        },
      ],
    };
    // Hand-written rule uses 'dark' keyword (not the label)
    const result = parseFindings('Dark lesion', def);
    expect(result.formState.echogenicity).toBe('hypoechoic');
  });

  it('parses VUR-style grades without explicit parseRules', () => {
    const def = {
      parseRules: {},
      grades: [
        { id: 'III', label: 'Grade III' },
        { id: 'IV', label: 'Grade IV' },
      ],
      sideOptions: [
        { id: 'right', label: 'Right' },
        { id: 'left', label: 'Left' },
      ],
    };
    const result = parseFindings('Right grade 3 vesicoureteral reflux', def);
    expect(result.formState.grade).toBe('III');
    expect(result.formState.side).toBe('right');
  });

  it('parses BI-RADS-style flat categories', () => {
    const def = {
      parseRules: {},
      categories: [
        { id: '4a', label: '4a — Low Suspicion', management: 'Tissue diagnosis' },
        { id: '5', label: '5 — Highly Suggestive of Malignancy', management: 'Tissue diagnosis' },
      ],
    };
    const result = parseFindings('BI-RADS 4a mass', def);
    expect(result.formState.category).toBe('4a');
  });

  it('parses Deauville-style scores', () => {
    const def = {
      parseRules: {},
      scores: [
        { id: '3', label: '3 — Uptake > Mediastinum, ≤ Liver', shortLabel: '3', interpretation: 'Complete metabolic response' },
      ],
    };
    const result = parseFindings('Complete metabolic response on PET', def);
    expect(result.formState.score).toBe('3');
  });
});
