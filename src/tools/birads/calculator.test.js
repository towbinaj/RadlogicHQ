import { describe, it, expect } from 'vitest';
import { calculateBirads } from './calculator.js';

// Retroactive coverage for the other-RADS tool backlog.
// See docs/test.md section 9.

describe('calculateBirads — category → level', () => {
  it.each([
    ['0',  2],  // Incomplete
    ['1',  1],  // Negative
    ['2',  1],  // Benign
    ['3',  2],  // Probably benign
    ['4a', 3],  // Low suspicion
    ['4b', 4],  // Moderate suspicion
    ['4c', 5],  // High suspicion
    ['5',  5],  // Highly suggestive of malignancy
    ['6',  5],  // Known malignancy
  ])('category %s → level %d', (category, expectedLevel) => {
    const r = calculateBirads({ category });
    expect(r.level).toBe(expectedLevel);
    expect(r.categoryProvided).toBe(true);
  });

  it('unset category → level 0 and placeholder', () => {
    const r = calculateBirads({});
    expect(r.category).toBe('--');
    expect(r.categoryLabel).toBe('--');
    expect(r.level).toBe(0);
    expect(r.categoryProvided).toBe(false);
  });

  it('unknown category ID → level 0', () => {
    const r = calculateBirads({ category: 'xyz' });
    expect(r.level).toBe(0);
    expect(r.categoryLabel).toBe('--');
  });
});

describe('calculateBirads — category metadata', () => {
  it('populates management and risk for category 3', () => {
    const r = calculateBirads({ category: '3' });
    expect(r.categoryLabel).toContain('Probably Benign');
    expect(r.management).toMatch(/Short-interval/);
    expect(r.risk).toBe('<2%');
  });

  it('category 4b has 10-50% risk', () => {
    const r = calculateBirads({ category: '4b' });
    expect(r.risk).toBe('10-50%');
    expect(r.management).toMatch(/Tissue diagnosis/);
  });

  it('category 5 has >95% risk', () => {
    const r = calculateBirads({ category: '5' });
    expect(r.risk).toBe('>95%');
  });

  it('category 6 (v2025): definitive therapy per multidisciplinary team, not surgery by default', () => {
    const r = calculateBirads({ category: '6' });
    expect(r.risk).toBe('100%');
    expect(r.management).toMatch(/multidisciplinary/i);
    expect(r.management).not.toMatch(/Surgical excision/);
  });

  it('category 0 has N/A risk', () => {
    const r = calculateBirads({ category: '0' });
    expect(r.risk).toBe('N/A');
    expect(r.management).toMatch(/Additional imaging/);
  });
});

describe('calculateBirads — modality + laterality', () => {
  it.each([
    ['mammo', 'Mammography'],
    ['us',    'Ultrasound'],
    ['mri',   'MRI'],
  ])('modality %s → label %s', (modality, expected) => {
    const r = calculateBirads({ category: '2', modality });
    expect(r.modalityLabel).toBe(expected);
    expect(r.modalityProvided).toBe(true);
  });

  it.each([
    ['right',     'Right'],
    ['left',      'Left'],
    ['bilateral', 'Bilateral'],
  ])('laterality %s → label %s', (laterality, expected) => {
    const r = calculateBirads({ category: '2', laterality });
    expect(r.lateralityLabel).toBe(expected);
    expect(r.lateralityProvided).toBe(true);
  });

  it('unset modality/laterality → empty labels', () => {
    const r = calculateBirads({ category: '2' });
    expect(r.modalityLabel).toBe('');
    expect(r.lateralityLabel).toBe('');
    expect(r.modalityProvided).toBe(false);
    expect(r.lateralityProvided).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// BI-RADS v2025 (ACR BI-RADS v2025 Manual; summarized in Minichetti P et al.,
// AJR 2026;227:e2635051). Category structure and risk thresholds unchanged;
// category 0 split into two scenarios; category 6 clarified; CEM formally
// incorporated; standardized clinical indication categories.
// ---------------------------------------------------------------------------
import { biradsDefinition } from './definition.js';
import { parseFindings } from '../../core/parser.js';

describe('BI-RADS v2025 — category 0 has two scenarios', () => {
  it('0 = needs additional imaging evaluation', () => {
    const r = calculateBirads({ category: '0' });
    expect(r.category).toBe('0');
    expect(r.categoryLabel).toMatch(/additional imaging/i);
    expect(r.management).toMatch(/additional imaging/i);
    expect(r.level).toBe(2);
  });

  it('0p = needs comparison with prior examinations, displayed as category 0', () => {
    const r = calculateBirads({ category: '0p' });
    expect(r.category).toBe('0');
    expect(r.categoryLabel).toMatch(/prior exam/i);
    expect(r.management).toMatch(/prior exam/i);
    expect(r.risk).toBe('N/A');
    expect(r.level).toBe(2);
  });

  it('lists ten assessment choices (0, 0p, 1-3, 4a-c, 5, 6)', () => {
    expect(biradsDefinition.categories.map((c) => c.id))
      .toEqual(['0', '0p', '1', '2', '3', '4a', '4b', '4c', '5', '6']);
  });
});

describe('BI-RADS v2025 — modality and clinical indication', () => {
  it('contrast-enhanced mammography is a modality', () => {
    const r = calculateBirads({ category: '2', modality: 'cem' });
    expect(r.modalityLabel).toBe('Contrast-enhanced mammography');
  });

  it.each([
    ['screening', 'Screening'],
    ['diagnostic', 'Diagnostic evaluation'],
    ['known-cancer', 'Known breast cancer evaluation'],
  ])('indication %s -> %s', (indication, label) => {
    const r = calculateBirads({ category: '2', indication });
    expect(r.indicationLabel).toBe(label);
    expect(r.indicationProvided).toBe(true);
  });

  it('indication is optional', () => {
    const r = calculateBirads({ category: '2' });
    expect(r.indicationLabel).toBe('');
    expect(r.indicationProvided).toBe(false);
  });
});

describe('BI-RADS v2025 — report text is ASCII and HL7-safe', () => {
  it('no non-ASCII or HL7 delimiters in labels, management, risk, options', () => {
    const texts = [
      ...biradsDefinition.categories.flatMap((c) => [c.label, c.management, c.risk, c.title || '']),
      ...biradsDefinition.modalityOptions.flatMap((o) => [o.label, o.title || '']),
      ...biradsDefinition.indicationOptions.map((o) => o.label),
    ];
    for (const t of texts) expect(t).not.toMatch(/[|~^&\\]|[^\x20-\x7E]/);
  });
});

describe('BI-RADS v2025 — parse rules', () => {
  const cat = (t) => parseFindings(t, biradsDefinition).formState.category;

  it.each([
    ['BI-RADS 0: additional imaging evaluation needed.', '0'],
    ['BI-RADS 0, incomplete.', '0'],
    ['BI-RADS 0 pending comparison with prior examinations.', '0p'],
    ['Incomplete: awaiting prior exams for comparison.', '0p'],
    ['BI-RADS 4a: low suspicion for malignancy.', '4a'],
    ['BI-RADS 6, known biopsy-proven malignancy.', '6'],
  ])('"%s" -> %s', (text, expected) => {
    expect(cat(text)).toBe(expected);
  });

  it('a routine comparison section does not trigger category 0', () => {
    expect(cat('Comparison with prior examinations from 2023. BI-RADS 2: Benign.')).toBe('2');
  });
});

describe('BI-RADS v2025 — 4A/4B/4C display uppercase', () => {
  it.each([['4a', '4A'], ['4b', '4B'], ['4c', '4C']])('%s displays as %s', (id, shown) => {
    expect(calculateBirads({ category: id }).category).toBe(shown);
  });
});
