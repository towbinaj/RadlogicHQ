import { describe, it, expect } from 'vitest';
import {
  parseFindings,
  buildParseRules,
  parseSegmentedFindings,
  segmentByLaterality,
  segmentByItemIndex,
} from './parser.js';

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

// ============================================================
// Segmentation layer
// ============================================================

describe('segmentByLaterality (Phase 1.1 — sentence-based)', () => {
  it('returns no segments and full text as ungrouped when no markers', () => {
    const r = segmentByLaterality('Subcapsular hematoma with perirenal extension');
    expect(r.segments).toEqual([]);
    expect(r.ungroupedText).toContain('Subcapsular hematoma');
  });

  it('splits a simple right/left report into two segments', () => {
    const text = 'Right kidney: subcapsular hematoma. Left kidney: 2 cm laceration.';
    const r = segmentByLaterality(text);
    expect(r.segments).toHaveLength(2);
    const right = r.segments.find((s) => s.key === 'right');
    const left = r.segments.find((s) => s.key === 'left');
    expect(right.text).toContain('subcapsular hematoma');
    expect(left.text).toContain('2 cm laceration');
  });

  it('captures text before first marker as ungrouped', () => {
    const text = 'CT abdomen performed. Right kidney: hematoma.';
    const r = segmentByLaterality(text);
    expect(r.ungroupedText).toContain('CT abdomen');
    expect(r.segments).toHaveLength(1);
    expect(r.segments[0].key).toBe('right');
  });

  it('expands "bilateral kidneys" to BOTH right and left segments', () => {
    const text = 'Bilateral kidneys show scattered hematomas.';
    const r = segmentByLaterality(text);
    expect(r.segments).toHaveLength(2);
    expect(r.segments.map((s) => s.key).sort()).toEqual(['left', 'right']);
    expect(r.segments[0].text).toContain('scattered hematomas');
    expect(r.segments[1].text).toContain('scattered hematomas');
  });

  it('expands "both kidneys" the same way', () => {
    const text = 'Both kidneys are enlarged.';
    const r = segmentByLaterality(text);
    expect(r.segments.map((s) => s.key).sort()).toEqual(['left', 'right']);
  });

  it('applies sticky attribution for sentences without markers', () => {
    const text = 'Right kidney: grade 3 laceration. Subcapsular hematoma throughout. No active bleeding.';
    const r = segmentByLaterality(text);
    const right = r.segments.find((s) => s.key === 'right');
    expect(right.text).toContain('Subcapsular hematoma throughout');
    expect(right.text).toContain('No active bleeding');
    expect(r.segments).toHaveLength(1);
  });

  it('merges same-key sentences in source order', () => {
    const text = 'Right kidney: X hematoma. Left kidney: Y laceration. Right kidney: also Z.';
    const r = segmentByLaterality(text);
    expect(r.segments).toHaveLength(2);
    const right = r.segments.find((s) => s.key === 'right');
    expect(right.text).toContain('X hematoma');
    expect(right.text).toContain('also Z');
  });

  it('matches radiology shorthand Rt/Lt', () => {
    const r = segmentByLaterality('Rt kidney: hematoma. Lt kidney: laceration.');
    expect(r.segments.map((s) => s.key).sort()).toEqual(['left', 'right']);
  });

  it('matches "on the right" / "on the left"', () => {
    const r = segmentByLaterality('On the right, subcapsular hematoma. On the left, 2 cm laceration.');
    expect(r.segments.map((s) => s.key).sort()).toEqual(['left', 'right']);
  });

  // --- Phase 1.1 additions ---

  it('resolves "contralateral kidney" by flipping the current side', () => {
    const text = 'The right kidney has a subcapsular hematoma. The contralateral kidney shows a 2 cm laceration.';
    const r = segmentByLaterality(text);
    const right = r.segments.find((s) => s.key === 'right');
    const left = r.segments.find((s) => s.key === 'left');
    expect(right.text).toContain('subcapsular hematoma');
    expect(left.text).toContain('2 cm laceration');
    expect(left.text).not.toContain('subcapsular hematoma');
  });

  it('resolves "the other kidney" as contralateral', () => {
    const text = 'Left kidney: 3 cm laceration. The other kidney shows a subcapsular hematoma.';
    const r = segmentByLaterality(text);
    const right = r.segments.find((s) => s.key === 'right');
    const left = r.segments.find((s) => s.key === 'left');
    expect(left.text).toContain('3 cm laceration');
    expect(right.text).toContain('subcapsular hematoma');
  });

  it('keeps current side for "ipsilateral" / "same side"', () => {
    const text = 'Right kidney: laceration. Ipsilateral perirenal hematoma.';
    const r = segmentByLaterality(text);
    expect(r.segments).toHaveLength(1);
    expect(r.segments[0].key).toBe('right');
    expect(r.segments[0].text).toContain('perirenal hematoma');
  });

  it('handles interleaved bouncing between sides', () => {
    const text = [
      'Right kidney: subcapsular hematoma.',
      'Left kidney: 2 cm laceration.',
      'Right kidney additionally shows a perirenal fluid collection.',
      'Left kidney has contained vascular injury.',
    ].join(' ');
    const r = segmentByLaterality(text);
    const right = r.segments.find((s) => s.key === 'right');
    const left = r.segments.find((s) => s.key === 'left');
    expect(right.text).toContain('subcapsular hematoma');
    expect(right.text).toContain('perirenal fluid collection');
    expect(right.text).not.toContain('2 cm laceration');
    expect(right.text).not.toContain('contained vascular injury');
    expect(left.text).toContain('2 cm laceration');
    expect(left.text).toContain('contained vascular injury');
  });

  it('handles bilateral-then-unilateral (partial bilateral)', () => {
    const text = 'Bilateral kidneys show scattered subcapsular hematomas. The right kidney additionally has a 2 cm laceration.';
    const r = segmentByLaterality(text);
    const right = r.segments.find((s) => s.key === 'right');
    const left = r.segments.find((s) => s.key === 'left');
    // Both sides see the bilateral finding
    expect(right.text).toContain('subcapsular hematomas');
    expect(left.text).toContain('subcapsular hematomas');
    // Only right sees the unilateral finding
    expect(right.text).toContain('2 cm laceration');
    expect(left.text).not.toContain('2 cm laceration');
  });

  it('contralateral flip does not change the sticky side for subsequent sentences', () => {
    const text = 'Right kidney: laceration. Contralateral hematoma. Additionally shows perirenal stranding.';
    const r = segmentByLaterality(text);
    const right = r.segments.find((s) => s.key === 'right');
    const left = r.segments.find((s) => s.key === 'left');
    // Sentence 1 -> right. Sentence 2 -> left (flip). Sentence 3 -> right (sticky).
    expect(right.text).toContain('laceration');
    expect(right.text).toContain('perirenal stranding');
    expect(left.text).toContain('hematoma');
    expect(left.text).not.toContain('perirenal stranding');
  });

  it('does not split decimals like "2.5 cm" into sentences', () => {
    const text = 'Right kidney has a 2.5 cm subcapsular hematoma. Left kidney is normal.';
    const r = segmentByLaterality(text);
    const right = r.segments.find((s) => s.key === 'right');
    expect(right.text).toContain('2.5 cm');
  });

  it('"right and left kidneys both" is treated as bilateral', () => {
    const text = 'The right and left kidneys both show subcapsular hematomas.';
    const r = segmentByLaterality(text);
    expect(r.segments).toHaveLength(2);
    expect(r.segments.map((s) => s.key).sort()).toEqual(['left', 'right']);
  });

  // --- Postposed / distributive bilateral phrasings ---

  it('recognizes "the kidneys each have..." as bilateral', () => {
    const text = 'The kidneys each have a small subcapsular hematoma.';
    const r = segmentByLaterality(text);
    expect(r.segments).toHaveLength(2);
    expect(r.segments.map((s) => s.key).sort()).toEqual(['left', 'right']);
    expect(r.segments[0].text).toContain('small subcapsular hematoma');
    expect(r.segments[1].text).toContain('small subcapsular hematoma');
  });

  it('recognizes "the kidneys both have..." as bilateral', () => {
    const text = 'The kidneys both have perirenal stranding.';
    const r = segmentByLaterality(text);
    expect(r.segments).toHaveLength(2);
    expect(r.segments.map((s) => s.key).sort()).toEqual(['left', 'right']);
  });

  it('recognizes "the kidneys are both enlarged" as bilateral (copula form)', () => {
    const text = 'The kidneys are both enlarged with scattered cysts.';
    const r = segmentByLaterality(text);
    expect(r.segments).toHaveLength(2);
    expect(r.segments.map((s) => s.key).sort()).toEqual(['left', 'right']);
  });

  it('recognizes "each kidney has..." (distributive singular) as bilateral', () => {
    const text = 'Each kidney has a small subcapsular hematoma.';
    const r = segmentByLaterality(text);
    expect(r.segments).toHaveLength(2);
    expect(r.segments.map((s) => s.key).sort()).toEqual(['left', 'right']);
  });

  it('recognizes "each of the kidneys" (prepositional) as bilateral', () => {
    const text = 'Each of the kidneys shows a perirenal hematoma.';
    const r = segmentByLaterality(text);
    expect(r.segments).toHaveLength(2);
    expect(r.segments.map((s) => s.key).sort()).toEqual(['left', 'right']);
  });

  it('recognizes "both of the kidneys" as bilateral', () => {
    const text = 'Both of the kidneys are normal in size.';
    const r = segmentByLaterality(text);
    expect(r.segments).toHaveLength(2);
    expect(r.segments.map((s) => s.key).sort()).toEqual(['left', 'right']);
  });

  it('mixes postposed bilateral with a unilateral follow-up', () => {
    const text = 'The kidneys each have a subcapsular hematoma. The right kidney additionally has a 2 cm laceration.';
    const r = segmentByLaterality(text);
    const right = r.segments.find((s) => s.key === 'right');
    const left = r.segments.find((s) => s.key === 'left');
    expect(right.text).toContain('subcapsular hematoma');
    expect(left.text).toContain('subcapsular hematoma');
    expect(right.text).toContain('2 cm laceration');
    expect(left.text).not.toContain('2 cm laceration');
  });
});

describe('segmentByItemIndex', () => {
  it('splits "Nodule 1:" / "Nodule 2:" into separate segments', () => {
    const text = 'Nodule 1: 2.5 cm solid hypoechoic. Nodule 2: 1.2 cm spongiform.';
    const r = segmentByItemIndex(text, 'Nodule');
    expect(r.segments).toHaveLength(2);
    expect(r.segments[0].index).toBe(1);
    expect(r.segments[0].text).toContain('solid hypoechoic');
    expect(r.segments[1].index).toBe(2);
    expect(r.segments[1].text).toContain('spongiform');
  });

  it('matches word-form "first nodule" / "second nodule"', () => {
    const r = segmentByItemIndex('First nodule is 2 cm. Second nodule is 1 cm.', 'nodule');
    expect(r.segments).toHaveLength(2);
    expect(r.segments[0].index).toBe(1);
    expect(r.segments[1].index).toBe(2);
  });

  it('matches numbered line starts like "1." and "(2)"', () => {
    const text = `Findings:
1. Hypoechoic 2 cm nodule.
2. Isoechoic 1 cm nodule.`;
    const r = segmentByItemIndex(text, 'nodule');
    expect(r.segments).toHaveLength(2);
    expect(r.segments[0].index).toBe(1);
    expect(r.segments[1].index).toBe(2);
  });

  it('returns no segments and full text as ungrouped when no markers', () => {
    const r = segmentByItemIndex('Just one solid nodule in the right lobe', 'nodule');
    expect(r.segments).toEqual([]);
    expect(r.ungroupedText).toContain('Just one solid nodule');
  });

  it('merges same-index segments', () => {
    const r = segmentByItemIndex('Nodule 1: first mention. Nodule 1: additional note.', 'nodule');
    expect(r.segments).toHaveLength(1);
    expect(r.segments[0].text).toContain('first mention');
    expect(r.segments[0].text).toContain('additional note');
  });
});

describe('parseSegmentedFindings', () => {
  const kidneyDef = {
    parseRules: {},
    parseSegmentation: { type: 'laterality' },
    categories: [
      {
        id: 'hematoma',
        label: 'Hematoma',
        findings: [
          { id: 'sub-nonexpanding', label: 'Subcapsular, nonexpanding', grade: 1 },
          { id: 'perirenal-nonexpanding', label: 'Perirenal, nonexpanding', grade: 2 },
        ],
      },
      {
        id: 'laceration',
        label: 'Laceration',
        findings: [
          { id: 'lac-lt1', label: '<1 cm depth, no urinary extravasation', grade: 2 },
        ],
      },
    ],
  };

  it('returns segments + ungrouped for a bilateral kidney paste', () => {
    const text = 'Right kidney: perirenal, nonexpanding hematoma. Left kidney: subcapsular, nonexpanding hematoma.';
    const r = parseSegmentedFindings(text, kidneyDef);
    expect(r.segments).toHaveLength(2);
    const right = r.segments.find((s) => s.key === 'right');
    const left = r.segments.find((s) => s.key === 'left');
    expect(right.formState.selectedFindings).toContain('perirenal-nonexpanding');
    expect(left.formState.selectedFindings).toContain('sub-nonexpanding');
  });

  it('falls back to ungrouped when no laterality markers are present', () => {
    const text = 'Subcapsular, nonexpanding hematoma';
    const r = parseSegmentedFindings(text, kidneyDef);
    expect(r.segments).toHaveLength(0);
    expect(r.ungrouped.formState.selectedFindings).toContain('sub-nonexpanding');
  });

  it('parses the whole text as ungrouped when definition opts out', () => {
    const def = { ...kidneyDef, parseSegmentation: undefined };
    const text = 'Subcapsular, nonexpanding hematoma';
    const r = parseSegmentedFindings(text, def);
    expect(r.segments).toHaveLength(0);
    expect(r.ungrouped.formState.selectedFindings).toContain('sub-nonexpanding');
  });

  // Real-world dictation patterns against the actual AAST Kidney definition
  // with its hand-written parseRules. These are the sentences that were
  // failing in live use before the manual rules were added.
  describe('realistic AAST Kidney dictation', () => {
    // Inline the relevant subset of the AAST kidney definition so the test
    // doesn't depend on the full tool file.
    const aastKidneyLike = {
      parseRules: {
        selectedFindings: {
          multi: true,
          options: {
            'sub-nonexpanding': ['subcapsular hematoma', 'sub-capsular hematoma'],
            'perirenal-nonexpanding': ['perirenal hematoma', 'perinephric hematoma'],
            'lac-gt1': ['deep laceration', 'large laceration'],
            'contained': ['pseudoaneurysm', 'contained vascular injury'],
            'shattered': ['shattered kidney', 'shattered', 'fragmented kidney'],
            'active-beyond': ['active bleeding beyond gerota', 'retroperitoneal bleeding'],
          },
        },
      },
      parseSegmentation: { type: 'laterality' },
      categories: [
        { id: 'h', findings: [
          { id: 'sub-nonexpanding', label: 'Subcapsular, nonexpanding', grade: 1 },
          { id: 'perirenal-nonexpanding', label: 'Perirenal, nonexpanding', grade: 2 },
        ]},
        { id: 'l', findings: [
          { id: 'lac-gt1', label: '>1 cm depth', grade: 3 },
        ]},
        { id: 'v', findings: [
          { id: 'contained', label: 'Contained vascular injury', grade: 3 },
          { id: 'active-beyond', label: 'Active bleeding beyond', grade: 4 },
        ]},
        { id: 'cs', findings: [
          { id: 'shattered', label: 'Shattered kidney', grade: 5 },
        ]},
      ],
    };

    it('"kidneys each have a subcapsular hematoma" routes to both sides', () => {
      const text = 'The kidneys each have a 1.5 cm subcapsular hematoma.';
      const r = parseSegmentedFindings(text, aastKidneyLike);
      expect(r.segments).toHaveLength(2);
      for (const seg of r.segments) {
        expect(seg.formState.selectedFindings).toContain('sub-nonexpanding');
      }
    });

    it('distributive bilateral + unilateral follow-up', () => {
      const text = 'The kidneys each have a subcapsular hematoma. The right kidney additionally shows a deep laceration with a pseudoaneurysm.';
      const r = parseSegmentedFindings(text, aastKidneyLike);
      const right = r.segments.find((s) => s.key === 'right');
      const left = r.segments.find((s) => s.key === 'left');
      expect(right.formState.selectedFindings).toEqual(
        expect.arrayContaining(['sub-nonexpanding', 'lac-gt1', 'contained'])
      );
      expect(left.formState.selectedFindings).toEqual(['sub-nonexpanding']);
    });

    it('contralateral flip with different findings per side', () => {
      const text = 'The right kidney has a subcapsular hematoma. The contralateral kidney shows a perirenal hematoma.';
      const r = parseSegmentedFindings(text, aastKidneyLike);
      const right = r.segments.find((s) => s.key === 'right');
      const left = r.segments.find((s) => s.key === 'left');
      expect(right.formState.selectedFindings).toContain('sub-nonexpanding');
      expect(left.formState.selectedFindings).toContain('perirenal-nonexpanding');
      expect(right.formState.selectedFindings).not.toContain('perirenal-nonexpanding');
      expect(left.formState.selectedFindings).not.toContain('sub-nonexpanding');
    });

    it('"shattered" with unilateral subcapsular on the other side', () => {
      const text = 'The right kidney is shattered. The left kidney shows a subcapsular hematoma.';
      const r = parseSegmentedFindings(text, aastKidneyLike);
      const right = r.segments.find((s) => s.key === 'right');
      const left = r.segments.find((s) => s.key === 'left');
      expect(right.formState.selectedFindings).toContain('shattered');
      expect(left.formState.selectedFindings).toContain('sub-nonexpanding');
    });

    it('"on the right" with active bleeding phrasing', () => {
      const text = 'Active bleeding beyond gerota fascia on the right. Left kidney: perirenal hematoma.';
      const r = parseSegmentedFindings(text, aastKidneyLike);
      const right = r.segments.find((s) => s.key === 'right');
      const left = r.segments.find((s) => s.key === 'left');
      expect(right.formState.selectedFindings).toContain('active-beyond');
      expect(left.formState.selectedFindings).toContain('perirenal-nonexpanding');
    });
  });

  // Numeric-size laceration detection uses the pattern-based multi-rule
  // shape and depends on the real aast-kidney parseRules.
  describe('pattern-based multi-rule (numeric size detection)', () => {
    const def = {
      parseRules: {
        selectedFindings: {
          multi: true,
          options: {
            'lac-lt1': {
              patterns: [
                { re: /\b(\d+(?:\.\d+)?)\s*-?\s*cm\b(?:\s+deep)?\s+laceration/i, test: (m) => parseFloat(m[1]) < 1 },
                { re: /\b(\d+(?:\.\d+)?)\s*-?\s*mm\b(?:\s+deep)?\s+laceration/i, test: (m) => parseFloat(m[1]) < 10 },
              ],
            },
            'lac-gt1': {
              patterns: [
                { re: /\b(\d+(?:\.\d+)?)\s*-?\s*cm\b(?:\s+deep)?\s+laceration/i, test: (m) => parseFloat(m[1]) >= 1 },
                { re: /\b(\d+(?:\.\d+)?)\s*-?\s*mm\b(?:\s+deep)?\s+laceration/i, test: (m) => parseFloat(m[1]) >= 10 },
              ],
            },
          },
        },
      },
      categories: [
        { id: 'l', findings: [
          { id: 'lac-lt1', label: '<1 cm laceration', grade: 2 },
          { id: 'lac-gt1', label: '>1 cm laceration', grade: 3 },
        ]},
      ],
    };

    it('"2 cm laceration" routes to lac-gt1', () => {
      const r = parseFindings('2 cm laceration in the parenchyma', def);
      expect(r.formState.selectedFindings).toContain('lac-gt1');
      expect(r.formState.selectedFindings).not.toContain('lac-lt1');
    });

    it('"0.8 cm laceration" routes to lac-lt1', () => {
      const r = parseFindings('0.8 cm laceration noted', def);
      expect(r.formState.selectedFindings).toContain('lac-lt1');
      expect(r.formState.selectedFindings).not.toContain('lac-gt1');
    });

    it('"5 mm laceration" routes to lac-lt1 (<10 mm)', () => {
      const r = parseFindings('5 mm laceration', def);
      expect(r.formState.selectedFindings).toContain('lac-lt1');
    });

    it('"15 mm laceration" routes to lac-gt1 (>=10 mm)', () => {
      const r = parseFindings('15 mm laceration', def);
      expect(r.formState.selectedFindings).toContain('lac-gt1');
    });

    it('"2cm laceration" (no space) still matches', () => {
      const r = parseFindings('2cm laceration', def);
      expect(r.formState.selectedFindings).toContain('lac-gt1');
    });

    it('"2-cm laceration" (hyphen) still matches', () => {
      const r = parseFindings('2-cm deep laceration', def);
      expect(r.formState.selectedFindings).toContain('lac-gt1');
    });

    it('exactly "1 cm laceration" routes to lac-gt1 (conservative default)', () => {
      const r = parseFindings('1 cm laceration', def);
      expect(r.formState.selectedFindings).toContain('lac-gt1');
    });

    it('legacy array-shaped options still work alongside pattern-based options', () => {
      const mixed = {
        parseRules: {
          selectedFindings: {
            multi: true,
            options: {
              'sub-nonexpanding': ['subcapsular hematoma'],  // legacy array
              'lac-gt1': {                                    // new pattern shape
                patterns: [{ re: /\b(\d+(?:\.\d+)?)\s*cm\s+laceration/i, test: (m) => parseFloat(m[1]) >= 1 }],
              },
            },
          },
        },
        categories: [{ id: 'x', findings: [
          { id: 'sub-nonexpanding', label: 'sub', grade: 1 },
          { id: 'lac-gt1', label: 'lac', grade: 3 },
        ]}],
      };
      const r = parseFindings('subcapsular hematoma with 3 cm laceration', mixed);
      expect(r.formState.selectedFindings).toContain('sub-nonexpanding');
      expect(r.formState.selectedFindings).toContain('lac-gt1');
    });
  });

  describe('unmatchedSentences (whole-sentence preservation for Additional Findings)', () => {
    const def = {
      parseRules: {
        selectedFindings: {
          multi: true,
          options: {
            'sub-nonexpanding': ['subcapsular hematoma'],
          },
        },
      },
      parseSegmentation: { type: 'laterality' },
      categories: [{ id: 'x', findings: [
        { id: 'sub-nonexpanding', label: 'sub', grade: 1 },
      ]}],
    };

    it('preserves header sentences with no findings', () => {
      const text = 'CT abdomen and pelvis. Right kidney: subcapsular hematoma.';
      const r = parseSegmentedFindings(text, def);
      expect(r.unmatchedSentences).toContain('CT abdomen and pelvis.');
      expect(r.unmatchedSentences).not.toContain('Right kidney: subcapsular hematoma.');
    });

    it('preserves negative-finding sentences verbatim', () => {
      const text = 'Right kidney: subcapsular hematoma. The contralateral kidney is otherwise unremarkable.';
      const r = parseSegmentedFindings(text, def);
      expect(r.unmatchedSentences).toContain('The contralateral kidney is otherwise unremarkable.');
    });

    it('returns empty array when every sentence matches', () => {
      const text = 'Right kidney: subcapsular hematoma. Left kidney: subcapsular hematoma.';
      const r = parseSegmentedFindings(text, def);
      expect(r.unmatchedSentences).toEqual([]);
    });

    it('returns every sentence when nothing matches', () => {
      const text = 'Some random text. Another sentence.';
      const r = parseSegmentedFindings(text, def);
      expect(r.unmatchedSentences).toHaveLength(2);
    });

    it('does not split decimals like "1.5 cm" into separate sentences', () => {
      const text = 'The kidney has a 1.5 cm subcapsular hematoma. Header text.';
      const r = parseSegmentedFindings(text, def);
      // "1.5 cm" should be inside the hematoma sentence, which IS matched,
      // so it should NOT appear in unmatchedSentences
      const joined = r.unmatchedSentences.join(' ');
      expect(joined).not.toContain('1.5');
      expect(r.unmatchedSentences).toContain('Header text.');
    });
  });

  // Regression test: the user's reported failing paste
  it("user's bilateral + contralateral + numeric laceration dictation", () => {
    // Inline the real kidney parseRules enough to validate the full flow
    const def = {
      parseRules: {
        selectedFindings: {
          multi: true,
          options: {
            'sub-nonexpanding': ['subcapsular hematoma'],
            'perirenal-nonexpanding': ['perirenal hematoma', 'perirenal stranding'],
            'lac-gt1': {
              patterns: [
                { re: /\b(\d+(?:\.\d+)?)\s*-?\s*cm\b(?:\s+deep)?\s+laceration/i, test: (m) => parseFloat(m[1]) >= 1 },
              ],
            },
          },
        },
      },
      parseSegmentation: { type: 'laterality' },
      categories: [{ id: 'x', findings: [
        { id: 'sub-nonexpanding', label: 'sub', grade: 1 },
        { id: 'perirenal-nonexpanding', label: 'peri', grade: 2 },
        { id: 'lac-gt1', label: 'lac', grade: 3 },
      ]}],
    };
    const text =
      'CT abdomen and pelvis.\n' +
      'The kidneys each have a 1.5 cm subcapsular hematoma.\n' +
      'The right kidney additionally shows a 2 cm laceration with perirenal stranding.\n' +
      'The contralateral kidney is otherwise unremarkable.';
    const r = parseSegmentedFindings(text, def);
    const right = r.segments.find((s) => s.key === 'right');
    const left = r.segments.find((s) => s.key === 'left');
    expect(right.formState.selectedFindings).toEqual(
      expect.arrayContaining(['sub-nonexpanding', 'perirenal-nonexpanding', 'lac-gt1'])
    );
    expect(left.formState.selectedFindings).toEqual(['sub-nonexpanding']);
    expect(r.ungrouped.text).toContain('CT abdomen');
  });

  it('supports itemIndex segmentation type', () => {
    const def = {
      parseRules: {},
      parseSegmentation: { type: 'itemIndex', itemLabel: 'Nodule' },
      sections: [
        {
          id: 'composition',
          label: 'Composition',
          options: [
            { id: 'solid', label: 'Solid' },
            { id: 'cystic', label: 'Cystic' },
          ],
        },
      ],
    };
    const text = 'Nodule 1: solid hypoechoic. Nodule 2: cystic spongiform.';
    const r = parseSegmentedFindings(text, def);
    expect(r.segments).toHaveLength(2);
    expect(r.segments[0].index).toBe(1);
    expect(r.segments[0].formState.composition).toBe('solid');
    expect(r.segments[1].index).toBe(2);
    expect(r.segments[1].formState.composition).toBe('cystic');
  });
});
