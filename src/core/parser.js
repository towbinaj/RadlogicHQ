/**
 * Generic findings text parser.
 * Each tool provides parseRules in its definition. This engine matches
 * text against those rules and returns a formState object plus leftover text.
 */

/**
 * Parse a text blob against a tool definition's parseRules.
 * All matching is done against the original text. Matched portions are
 * stripped from the remainder to produce leftover text.
 * @param {string} text - Raw findings text
 * @param {Object} definition - Tool definition with parseRules
 * @returns {{ formState: Object, matched: string[], unmatched: string[], remainder: string }}
 */
export function parseFindings(text, definition) {
  if (!definition.parseRules || !text) {
    return { formState: {}, matched: [], unmatched: [], remainder: text || '' };
  }

  const normalized = text.toLowerCase();
  const formState = {};
  const matched = [];
  const unmatched = [];
  // Track all matched spans to strip from remainder at the end
  const matchedSpans = [];

  for (const [inputId, rule] of Object.entries(definition.parseRules)) {
    if (rule.pattern) {
      // Regex rule — always match against original normalized text
      const match = normalized.match(rule.pattern);
      if (match) {
        const value = rule.transform ? rule.transform(match) : match[rule.group || 1];
        if (value != null) {
          formState[inputId] = value;
          matched.push(inputId);
          matchedSpans.push(match[0]);
        }
      } else {
        unmatched.push(inputId);
      }
    } else if (rule.multi) {
      const found = [];
      for (const [optionId, keywords] of Object.entries(rule.options)) {
        // Sort keywords longest first for best match
        const sorted = [...keywords].sort((a, b) => b.length - a.length);
        for (const kw of sorted) {
          if (normalized.includes(kw.toLowerCase())) {
            found.push(optionId);
            matchedSpans.push(kw);
            break;
          }
        }
      }
      if (found.length > 0) {
        formState[inputId] = found;
        matched.push(inputId);
      } else {
        unmatched.push(inputId);
      }
    } else if (rule.options) {
      let bestMatch = null;
      let bestKeyword = '';
      let bestLength = 0;

      for (const [optionId, keywords] of Object.entries(rule.options)) {
        for (const kw of keywords) {
          if (normalized.includes(kw.toLowerCase()) && kw.length > bestLength) {
            bestMatch = optionId;
            bestKeyword = kw;
            bestLength = kw.length;
          }
        }
      }

      if (bestMatch) {
        formState[inputId] = bestMatch;
        matched.push(inputId);
        matchedSpans.push(bestKeyword);
      } else {
        unmatched.push(inputId);
      }
    }
  }

  // Build remainder by stripping all matched spans from the original text
  let remainder = text;
  // Sort longest first to avoid partial stripping
  const sortedSpans = [...matchedSpans].sort((a, b) => b.length - a.length);
  for (const span of sortedSpans) {
    const idx = remainder.toLowerCase().indexOf(span.toLowerCase());
    if (idx !== -1) {
      remainder = remainder.slice(0, idx) + remainder.slice(idx + span.length);
    }
  }

  // Also strip close variants of matched keywords (e.g., "margins" when "margin" section matched)
  if (definition.sections) {
    for (const section of definition.sections) {
      // Strip plural/singular variants of section labels
      const label = section.label.toLowerCase();
      const variants = [label, label + 's', label.replace(/s$/, '')];
      for (const v of variants) {
        const regex = new RegExp('\\b' + escapeRegex(v) + '\\b', 'gi');
        remainder = remainder.replace(regex, '');
      }
    }
  }

  // Clean up: split on punctuation into phrases, filter empties, rejoin with semicolons
  let phrases = remainder
    .split(/[,;.]+/)
    .map((p) => p.replace(/\b(with|and|in the|in|the|a|an|of|is|are|was|nodule|thyroid|measuring|measures)\b/gi, ''))
    .map((p) => p.replace(/\s{2,}/g, ' ').trim())
    .filter((p) => p.length > 1);

  const cleanRemainder = phrases.join('; ');

  return { formState, matched, unmatched, remainder: cleanRemainder };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
