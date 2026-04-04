/**
 * Generic calculation engine for point-based scoring tools.
 * Takes a tool definition and form state, returns section scores and total.
 */

/**
 * Calculate scores from form state based on tool definition.
 * @param {Object} definition - Tool definition with sections
 * @param {Object} formState - Current form values keyed by section/input ID
 * @returns {{ sectionScores: Object, totalScore: number }}
 */
export function calculateScore(definition, formState) {
  const sectionScores = {};
  let totalScore = 0;

  for (const section of definition.sections) {
    const value = formState[section.id];
    let sectionPoints = 0;

    if (section.inputType === 'single-select') {
      if (value != null) {
        const option = section.options.find((o) => o.id === value);
        if (option) sectionPoints = option.points ?? 0;
      }
    } else if (section.inputType === 'multi-select') {
      const selected = Array.isArray(value) ? value : [];
      for (const optId of selected) {
        const option = section.options.find((o) => o.id === optId);
        if (option) sectionPoints += option.points ?? 0;
      }
    }

    sectionScores[section.id] = sectionPoints;
    totalScore += sectionPoints;
  }

  return { sectionScores, totalScore };
}

/**
 * Get the display label for a selected value in a section.
 * @param {Object} section - Section definition
 * @param {string} optionId - Selected option ID
 * @returns {string} Human-readable label
 */
export function getOptionLabel(section, optionId) {
  const option = section.options.find((o) => o.id === optionId);
  return option ? option.label : '';
}

/**
 * Get all selected labels for a section (works for single and multi-select).
 * @param {Object} section - Section definition
 * @param {*} value - Form state value (string or array)
 * @returns {string[]} Array of labels
 */
export function getSelectedLabels(section, value) {
  if (value == null) return [];
  const ids = Array.isArray(value) ? value : [value];
  return ids.map((id) => getOptionLabel(section, id)).filter(Boolean);
}
