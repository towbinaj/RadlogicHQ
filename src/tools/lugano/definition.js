/**
 * Lugano Classification for Lymphoma Staging — definition.
 *
 * Reference: Cheson BD et al. J Clin Oncol 2014;32(27):3059-3068.
 */

export const luganoDefinition = {
  id: 'lugano',
  name: 'Lugano',

  stages: [
    { id: 'I', label: 'Stage I', description: 'Single lymph node region or single extranodal site (IE)' },
    { id: 'II', label: 'Stage II', description: '≥2 lymph node regions, same side of diaphragm' },
    { id: 'III', label: 'Stage III', description: 'Lymph node regions on both sides of diaphragm' },
    { id: 'IV', label: 'Stage IV', description: 'Diffuse/disseminated extranodal organ involvement' },
  ],

  suffixes: [
    { id: 'A', label: 'A — No B symptoms', hodgkinOnly: true },
    { id: 'B', label: 'B — B symptoms present', hodgkinOnly: true },
    { id: 'E', label: 'E — Extranodal extension', hodgkinOnly: false },
    { id: 'S', label: 'S — Splenic involvement', hodgkinOnly: false },
    { id: 'X', label: 'X — Bulky disease', hodgkinOnly: false },
  ],

  lymphomaTypeOptions: [
    { id: 'hodgkin', label: 'Hodgkin' },
    { id: 'nhl', label: 'Non-Hodgkin' },
  ],

  parseRules: {},
};
