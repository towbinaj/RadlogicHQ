/**
 * AAST kidney scale selection (2018 vs 2025).
 *
 * The kidney page and AAST Multi share one stored preference so a user who
 * prefers the 2018 scale (e.g. institutional or EAU-guideline use) sees it
 * in both tools. Default is the current 2025 update.
 */
import { aastKidneyDefinition } from './definition.js';
import { aastKidney2025Definition } from './definition-2025.js';

export const KIDNEY_SCALE_STORAGE_KEY = 'mode:aast-kidney';
export const DEFAULT_KIDNEY_SCALE = '2025';

export const KIDNEY_SCALES = [
  { id: '2025', label: 'AAST 2025', definition: aastKidney2025Definition },
  { id: '2018', label: 'AAST 2018', definition: aastKidneyDefinition },
];

/** Definition for a scale id; unknown/empty ids get the default (2025). */
export function getKidneyDefinition(scaleId = DEFAULT_KIDNEY_SCALE) {
  const hit = KIDNEY_SCALES.find((s) => s.id === scaleId);
  return (hit || KIDNEY_SCALES.find((s) => s.id === DEFAULT_KIDNEY_SCALE)).definition;
}
