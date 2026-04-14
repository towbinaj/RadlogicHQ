/**
 * Clipboard utilities.
 *
 * All copies go through asciiSafe() so that any text landing in a radiologist's
 * dictation system / HL7 ORU stream is pure 7-bit ASCII. This closes the gap
 * where modern browsers happily copy UTF-8 but downstream HL7 v2 interfaces
 * (especially v2.3 / v2.4 without MSH-18 encoding) silently mangle non-ASCII
 * into `?` characters.
 *
 * The on-screen report still shows pretty characters (—, ≥, °, →). Only the
 * copied text is normalized.
 */

// Unicode → ASCII replacements for characters commonly found in radiology
// report templates. Adjust if new tools introduce new non-ASCII characters.
const ASCII_MAP = {
  // Dashes
  '\u2013': '-',    // – en-dash
  '\u2014': '--',   // — em-dash
  '\u2212': '-',    // − minus sign
  // Quotes
  '\u2018': "'",    // ' left single quote
  '\u2019': "'",    // ' right single quote
  '\u201c': '"',    // " left double quote
  '\u201d': '"',    // " right double quote
  '\u2032': "'",    // prime
  '\u2033': '"',    // double prime
  // Math / comparison
  '\u2265': '>=',   // ≥
  '\u2264': '<=',   // ≤
  '\u2260': '!=',   // ≠
  '\u00d7': ' x ',  // × multiplication sign
  '\u00f7': '/',    // ÷ division sign
  '\u00b1': '+/-',  // ± plus-minus
  // Units / symbols
  '\u00b0': ' deg', // ° degree
  '\u00b5': 'u',    // µ micro
  '\u00ae': '(R)',  // ® registered
  '\u00a9': '(C)',  // © copyright
  '\u2122': '(TM)', // ™ trademark
  '\u00a7': 'Sec.', // § section
  // Arrows
  '\u2192': '->',   // → right
  '\u2190': '<-',   // ← left
  '\u2194': '<->',  // ↔
  '\u21d2': '=>',   // ⇒
  // Whitespace / invisible
  '\u00a0': ' ',    // non-breaking space
  '\u2009': ' ',    // thin space
  '\u202f': ' ',    // narrow no-break space
  '\u200b': '',     // zero-width space
  '\u200c': '',     // zero-width non-joiner
  '\u200d': '',     // zero-width joiner
  '\ufeff': '',     // BOM
  // Other punctuation
  '\u2026': '...',  // … ellipsis
  '\u2022': '*',    // • bullet
  '\u25aa': '*',    // ▪ small black square
  '\u25cf': '*',    // ● black circle
  '\u00b7': '.',    // middle dot
};

/**
 * Normalize a string to pure 7-bit ASCII, using a known-safe replacement
 * table for common radiology / medical characters and stripping anything
 * else outside ASCII.
 *
 * Also removes HL7 v2 structural delimiters that could corrupt a downstream
 * ORU message if any snuck through: | ~ ^ \ &
 * (Source-level templates are being kept clean of these, but this is a
 *  defense-in-depth backstop for user-typed free-text fields.)
 *
 * @param {string} text
 * @returns {string}
 */
export function asciiSafe(text) {
  if (text == null) return '';
  let out = String(text);

  // Apply explicit replacements first
  out = out.replace(/[\u0080-\uffff]/g, (c) => {
    if (ASCII_MAP[c] != null) return ASCII_MAP[c];
    // Unknown non-ASCII: try Unicode normalization + strip diacritics
    // (é → e, ñ → n, etc.) as a best-effort fallback.
    const nfd = c.normalize('NFD');
    const stripped = nfd.replace(/[\u0300-\u036f]/g, '');
    // If the stripped form is ASCII, use it; otherwise drop the char.
    return /^[\x00-\x7F]*$/.test(stripped) ? stripped : '';
  });

  // Neutralize HL7 structural delimiters that escaped source-level cleanup.
  // Field separator `|` → `;`, repetition `~` → `approx`, component `^` → `-`,
  // subcomponent `&` → `and`, escape `\` → `/`.
  out = out
    .replace(/\|/g, ';')
    .replace(/~/g, 'approx')
    .replace(/\^/g, '-')
    .replace(/&/g, 'and')
    .replace(/\\/g, '/');

  return out;
}

/**
 * Copy text to clipboard with fallback for older browsers.
 * The text is normalized to ASCII + HL7-safe before copy so pasted reports
 * don't carry characters that could corrupt a downstream HL7 interface.
 *
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} true if successful
 */
export async function copyToClipboard(text) {
  const safe = asciiSafe(text);

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(safe);
      return true;
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback: textarea selection
  const textarea = document.createElement('textarea');
  textarea.value = safe;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  let success = false;
  try {
    success = document.execCommand('copy');
  } catch {
    // ignore
  }
  document.body.removeChild(textarea);
  return success;
}
