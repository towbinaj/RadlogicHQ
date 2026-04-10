/**
 * CAD-RADS 2.0 — definition.
 *
 * Reference: Cury RC et al. Radiology 2022;305(2):E72.
 */

export const cadradsDefinition = {
  id: 'cadrads',
  name: 'CAD-RADS',

  categories: [
    { id: '0', label: '0 — No plaque or stenosis', stenosis: '0%', management: 'No further testing' },
    { id: '1', label: '1 — Minimal stenosis', stenosis: '1–24%', management: 'Preventive therapy' },
    { id: '2', label: '2 — Mild stenosis', stenosis: '25–49%', management: 'Preventive therapy' },
    { id: '3', label: '3 — Moderate stenosis', stenosis: '50–69%', management: 'Consider functional assessment or ICA' },
    { id: '4A', label: '4A — Severe stenosis', stenosis: '70–99% (1–2 vessel)', management: 'ICA or functional assessment' },
    { id: '4B', label: '4B — Severe stenosis or left main', stenosis: '70–99% (3-vessel) or LM >50%', management: 'ICA recommended' },
    { id: '5', label: '5 — Total occlusion', stenosis: '100%', management: 'ICA and/or viability assessment' },
    { id: 'N', label: 'N — Non-diagnostic', stenosis: 'N/A', management: 'Additional or alternative evaluation' },
  ],

  modifierOptions: [
    { id: 'S', label: 'S — Stent' },
    { id: 'G', label: 'G — Graft' },
    { id: 'V', label: 'V — Vulnerable / High-Risk Plaque' },
  ],

  plaqueBurdenOptions: [
    { id: 'P1', label: 'P1 — Mild' },
    { id: 'P2', label: 'P2 — Moderate' },
    { id: 'P3', label: 'P3 — Severe' },
    { id: 'P4', label: 'P4 — Extensive' },
  ],

  parseRules: {},
};
