import { describe, it, expect } from 'vitest';
import { renderBlocks } from './report.js';

describe('renderBlocks pointsTemplate spacing', () => {
  const blocks = [
    { id: 'shape', template: 'Shape: {{shape}}', pointsTemplate: ' ({{shapePoints}} pts)', enabled: true, showPoints: true },
  ];

  it('keeps the leading space of pointsTemplate', () => {
    expect(renderBlocks(blocks, { shape: 'Not selected', shapePoints: 0 })).toBe('Shape: Not selected (0 pts)');
  });

  it('omits points when globalShowPoints is false', () => {
    expect(renderBlocks(blocks, { shape: 'Taller-than-wide', shapePoints: 3 }, false)).toBe('Shape: Taller-than-wide');
  });
});

import { stripPlaceholders } from './report.js';

describe('stripPlaceholders — no placeholder conclusions (audit 2026-11-28)', () => {
  it('drops sentences that still hold a -- placeholder', () => {
    expect(stripPlaceholders('IMPRESSION:\nHunt-Hess Grade 3. Modified Fisher Grade -- (vasospasm risk: ).'))
      .toBe('IMPRESSION:\nHunt-Hess Grade 3.');
  });
  it('drops a line that becomes empty, keeps blank separator lines', () => {
    expect(stripPlaceholders('FINDINGS:\nSize: 4 mm\n\nIMPRESSION:\nICA: -- stenosis by NASCET criteria ().'))
      .toBe('FINDINGS:\nSize: 4 mm\n\nIMPRESSION:');
  });
  it('removes stray punctuation-only sentences and empty parentheses', () => {
    expect(stripPlaceholders('Corpus callosum: --. .')).toBe('');
    expect(stripPlaceholders('Bone age 10 years by Greulich and Pyle method. .')).toBe('Bone age 10 years by Greulich and Pyle method.');
    expect(stripPlaceholders('O/E TFLV 40% ().')).toBe('O/E TFLV 40%.');
  });
  it('handles "? mm" placeholders and RadAI key lines', () => {
    expect(stripPlaceholders('RECIST 1.1: PR. Sum: ? mm -> ? mm.')).toBe('RECIST 1.1: PR.');
    expect(stripPlaceholders('[STRUCTURED REPORT]\nPRETEXT_Group: --\nV: Positive')).toBe('[STRUCTURED REPORT]\nV: Positive');
  });
  it('leaves real text alone (decimals, ranges, em dashes, T4-T12)', () => {
    const t = 'Thoracic kyphosis (T4-T12): 30° (Normal). Size 1.5 cm. Table: — | value';
    expect(stripPlaceholders(t)).toBe(t);
  });
});
