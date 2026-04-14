import { describe, it, expect } from 'vitest';
import { asciiSafe } from './clipboard.js';

describe('asciiSafe', () => {
  it('passes through pure ASCII unchanged', () => {
    expect(asciiSafe('Hello world 123')).toBe('Hello world 123');
  });

  it('handles null and undefined safely', () => {
    expect(asciiSafe(null)).toBe('');
    expect(asciiSafe(undefined)).toBe('');
  });

  it('normalizes em-dash and en-dash', () => {
    expect(asciiSafe('10\u201350%')).toBe('10-50%');        // en-dash
    expect(asciiSafe('bleeding \u2014 contained')).toBe('bleeding -- contained'); // em-dash
  });

  it('normalizes greater/less-equal', () => {
    expect(asciiSafe('\u22653 mm')).toBe('>=3 mm');
    expect(asciiSafe('\u22642 mm')).toBe('<=2 mm');
  });

  it('normalizes multiplication, plus-minus, division', () => {
    expect(asciiSafe('2.5\u00d71.8\u00d73.0 cm')).toBe('2.5 x 1.8 x 3.0 cm');
    expect(asciiSafe('40\u00b15')).toBe('40+/-5');
    expect(asciiSafe('1\u00f72')).toBe('1/2');
  });

  it('normalizes degree sign', () => {
    expect(asciiSafe('40\u00b0')).toBe('40 deg');
  });

  it('normalizes arrows', () => {
    expect(asciiSafe('baseline \u2192 current')).toBe('baseline -> current');
    expect(asciiSafe('a \u2190 b')).toBe('a <- b');
  });

  it('strips zero-width and BOM', () => {
    expect(asciiSafe('a\u200bb\u200cc\u200dd\ufeff')).toBe('abcd');
  });

  it('normalizes non-breaking spaces to regular spaces', () => {
    expect(asciiSafe('a\u00a0b')).toBe('a b');
  });

  it('normalizes smart quotes', () => {
    expect(asciiSafe('\u201chello\u201d')).toBe('"hello"');
    expect(asciiSafe('it\u2019s')).toBe("it's");
  });

  it('normalizes bullets and ellipsis', () => {
    expect(asciiSafe('\u2022 item')).toBe('* item');
    expect(asciiSafe('wait\u2026')).toBe('wait...');
  });

  it('strips diacritics from unknown Latin characters', () => {
    expect(asciiSafe('café')).toBe('cafe');
    expect(asciiSafe('naïve')).toBe('naive');
    expect(asciiSafe('Zürich')).toBe('Zurich');
  });

  it('drops truly unknown non-ASCII characters', () => {
    expect(asciiSafe('hello\u{1f600}')).toBe('hello');  // emoji
    expect(asciiSafe('\u4e2d\u6587')).toBe('');         // CJK
  });

  // --- HL7 structural delimiter neutralization ---

  it('neutralizes HL7 pipe field separator', () => {
    expect(asciiSafe('Composition: Cystic | Points: 0'))
      .toBe('Composition: Cystic ; Points: 0');
  });

  it('neutralizes HL7 tilde repetition separator', () => {
    expect(asciiSafe('survival ~56%')).toBe('survival approx56%');
  });

  it('neutralizes HL7 caret component separator', () => {
    expect(asciiSafe('TR^1')).toBe('TR-1');
  });

  it('neutralizes HL7 ampersand subcomponent separator', () => {
    expect(asciiSafe('Thin & Smooth')).toBe('Thin and Smooth');
  });

  it('neutralizes HL7 backslash escape character', () => {
    expect(asciiSafe('a\\b')).toBe('a/b');
  });

  it('handles combined HL7 delimiters + non-ASCII in one string', () => {
    const input = 'Bosniak \u2265IIF | Thin \u0026 Smooth (\u22642 mm)';
    // Expected: non-ASCII normalized, then HL7 delimiters neutralized
    expect(asciiSafe(input)).toBe('Bosniak >=IIF ; Thin and Smooth (<=2 mm)');
  });

  it('produces pure 7-bit ASCII for a realistic TI-RADS report snippet', () => {
    const input = [
      'Composition: Solid (2 pts)',
      'Echogenicity: Hypoechoic (2 pts)',
      'Margin: Smooth (0 pts)',
      'Size: 1.2 \u00d7 0.8 \u00d7 0.9 cm',
      'Shape: Wider-than-tall (\u22651.0 W:H ratio)',
    ].join('\n');
    const out = asciiSafe(input);
    // Every char should be 7-bit
    for (const ch of out) {
      expect(ch.charCodeAt(0)).toBeLessThanOrEqual(127);
    }
  });
});
