/**
 * Lightweight template engine for structured report output.
 * Supports {{variable}} substitution and {{#if key}}...{{/if}} conditionals.
 */

/**
 * Render a template string with data.
 * @param {string} template - Template with {{variable}} and {{#if key}}...{{/if}}
 * @param {Object} data - Key-value pairs for substitution
 * @returns {string} Rendered text
 */
export function renderReport(template, data) {
  // Pass 1: resolve {{#if key}}...{{/if}} blocks
  let result = template.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, key, content) => {
      return data[key] ? content : '';
    }
  );

  // Pass 2: resolve {{#unless key}}...{{/unless}} blocks
  result = result.replace(
    /\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,
    (_, key, content) => {
      return !data[key] ? content : '';
    }
  );

  // Pass 3: substitute {{variable}} placeholders
  result = result.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return data[key] != null ? String(data[key]) : '';
  });

  // Clean up blank lines left by removed conditionals
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}

/**
 * Build template data object from tool definition, form state, and calculation result.
 * Maps option IDs back to display labels and includes computed values.
 * @param {Object} definition - Tool definition
 * @param {Object} formState - Current form values
 * @param {Object} calcResult - Result from calculator (tool-specific)
 * @returns {Object} Flat key-value object for template substitution
 */
export function buildTemplateData(definition, formState, calcResult) {
  const data = {};

  // Map scored sections to labels and points
  for (const section of definition.sections) {
    const value = formState[section.id];

    if (section.inputType === 'single-select') {
      const option = section.options.find((o) => o.id === value);
      data[section.id] = option ? option.label : 'Not selected';
      data[`${section.id}Points`] = option ? option.points ?? 0 : 0;
      data[`${section.id}Selected`] = value != null;
    } else if (section.inputType === 'multi-select') {
      const selected = Array.isArray(value) ? value : [];
      const labels = selected
        .map((id) => section.options.find((o) => o.id === id))
        .filter(Boolean)
        .map((o) => o.label);
      data[section.id] = labels.length > 0 ? labels.join(', ') : 'None';
      data[`${section.id}Selected`] = selected.length > 0;
    }
  }

  // Map primary + additional inputs
  const allInputs = [
    ...(definition.primaryInputs || []),
    ...(definition.additionalInputs || []),
  ];
  for (const input of allInputs) {
    const value = formState[input.id];
    data[input.id] = value != null ? value : '';
    data[`${input.id}Provided`] = value != null && value !== '';
  }

  // Merge calculator results (tool-specific keys like tiradsLevel, recommendation, etc.)
  Object.assign(data, calcResult);

  return data;
}

/**
 * Render an ordered list of blocks into report text.
 * @param {Array} blocks - Block definitions with { id, template, pointsTemplate, enabled, showPoints, condition }
 * @param {Object} data - Template data for substitution
 * @param {boolean} globalShowPoints - Whether to append points to scoring fields
 * @returns {string} Rendered report text
 */
export function renderBlocks(blocks, data, globalShowPoints = true) {
  const lines = [];

  for (const block of blocks) {
    if (!block.enabled) continue;

    // Skip conditional blocks whose condition is not met
    if (block.condition && !data[block.condition]) continue;

    let line = renderReport(block.template, data);

    // Append points if this block has a pointsTemplate and points are enabled
    if (block.pointsTemplate && block.showPoints && globalShowPoints) {
      // renderReport() trims, so re-apply the template's leading whitespace
      // (e.g. ' ({{xPoints}} pts)') to avoid "Not selected(0 pts)".
      const lead = block.pointsTemplate.match(/^\s*/)[0];
      line += lead + renderReport(block.pointsTemplate, data);
    }

    if (line) lines.push(line);
  }

  return lines.join('\n');
}

// A "--" or "?" placeholder token: "Grade --", "-- stenosis", "? mm".
const PLACEHOLDER_RE = /(?:^|[\s(:/])--(?=$|[\s.,;:)/])|(?:^|\s)\?(?=\s*(?:mm|cm|$|[\s.,;)]))/;

/**
 * Remove report sentences that still carry a placeholder, so an empty or
 * partial form never shows a conclusion like "ICA: -- stenosis ()." or
 * "Corpus callosum: --. .". Works line by line: sentences holding "--" or
 * "?" placeholders are dropped, empty "()" and punctuation-only fragments
 * are removed, and a line emptied this way disappears (blank separator
 * lines and section headers stay).
 */
export function stripPlaceholders(text) {
  if (!text) return text;
  const out = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) { out.push(line); continue; }
    const sentences = line.split(/(?<=[.!])\s+/);
    const kept = sentences
      .filter((s) => !PLACEHOLDER_RE.test(s))
      .map((s) => s.replace(/\s*\(\s*\)/g, ''))
      .filter((s) => /[A-Za-z0-9]/.test(s));
    if (!kept.length) continue;
    out.push(kept.join(' '));
  }
  // Collapse runs of blank lines left behind and trim the end.
  return out.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '');
}
