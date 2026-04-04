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

  // Map additional inputs
  if (definition.additionalInputs) {
    for (const input of definition.additionalInputs) {
      const value = formState[input.id];
      data[input.id] = value != null ? value : '';
      data[`${input.id}Provided`] = value != null && value !== '';
    }
  }

  // Merge calculator results (tool-specific keys like tiradsLevel, recommendation, etc.)
  Object.assign(data, calcResult);

  return data;
}
