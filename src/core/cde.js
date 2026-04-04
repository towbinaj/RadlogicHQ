/**
 * CDE (Common Data Elements) mapping registry.
 * Links tool inputs/outputs to RadElement CDE element IDs.
 */

const registry = new Map();

/**
 * Register CDE mappings for a tool.
 * @param {string} toolId
 * @param {Object} mappings - { sectionId: { elementId, values: { optionId: { code, display } } } }
 */
export function registerCDEMappings(toolId, mappings) {
  registry.set(toolId, mappings);
}

/**
 * Get the CDE-coded value for a specific selection.
 * @param {string} toolId
 * @param {string} sectionId
 * @param {string} optionId
 * @returns {{ elementId: string, code: string, display: string } | null}
 */
export function getCDEValue(toolId, sectionId, optionId) {
  const toolMappings = registry.get(toolId);
  if (!toolMappings?.[sectionId]) return null;

  const section = toolMappings[sectionId];
  const value = section.values?.[optionId];
  if (!value) return null;

  return {
    elementId: section.elementId,
    code: value.code,
    display: value.display,
  };
}

/**
 * Get all CDE mappings for a tool.
 * @param {string} toolId
 * @returns {Object | null}
 */
export function getCDEMappings(toolId) {
  return registry.get(toolId) || null;
}

/**
 * Load a bundled CDE set JSON.
 * @param {string} setId - e.g., 'RDES411'
 * @returns {Promise<Object>}
 */
export async function loadCDESet(setId) {
  try {
    const module = await import(`../data/cde-sets/${setId}.json`);
    return module.default;
  } catch {
    console.warn(`CDE set ${setId} not found locally`);
    return null;
  }
}
