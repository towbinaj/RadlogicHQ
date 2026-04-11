/**
 * AAST Multi-Trauma — combines all 4 organ definitions.
 */
import { aastLiverDefinition } from '../aast-liver/definition.js';
import { aastSpleenDefinition } from '../aast-spleen/definition.js';
import { aastKidneyDefinition } from '../aast-kidney/definition.js';
import { aastPancreasDefinition } from '../aast-pancreas/definition.js';

export const organs = [
  aastLiverDefinition,
  aastSpleenDefinition,
  aastKidneyDefinition,
  aastPancreasDefinition,
];

export const aastMultiDefinition = {
  id: 'aast-multi',
  name: 'AAST Multi-Trauma',
  organ: 'Multi-Organ',
  organs,
  parseRules: {},
};
