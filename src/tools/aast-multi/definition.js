/**
 * AAST Multi-Trauma — combines all 4 organ definitions.
 * Kidney defaults to the 2025 scale here; the page swaps in the user's
 * stored 2018/2025 choice (shared with the kidney tool) at runtime.
 */
import { aastLiverDefinition } from '../aast-liver/definition.js';
import { aastSpleenDefinition } from '../aast-spleen/definition.js';
import { getKidneyDefinition } from '../aast-kidney/scales.js';
import { aastPancreasDefinition } from '../aast-pancreas/definition.js';

export const organs = [
  aastLiverDefinition,
  aastSpleenDefinition,
  getKidneyDefinition(),
  aastPancreasDefinition,
];

export const aastMultiDefinition = {
  id: 'aast-multi',
  name: 'AAST Multi-Trauma',
  organ: 'Multi-Organ',
  organs,
  parseRules: {},
};
