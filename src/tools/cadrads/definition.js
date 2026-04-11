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

  parseRules: {
    category: {
      options: {
        '0': ['no plaque', 'no stenosis', 'cad-rads 0', 'cadrads 0', 'normal coronary'],
        '1': ['minimal stenosis', 'cad-rads 1', 'cadrads 1', '1-24%'],
        '2': ['mild stenosis', 'cad-rads 2', 'cadrads 2', '25-49%'],
        '3': ['moderate stenosis', 'cad-rads 3', 'cadrads 3', '50-69%'],
        '4A': ['severe stenosis', 'cad-rads 4a', 'cadrads 4a', '70-99%'],
        '4B': ['three-vessel', '3-vessel', 'left main', 'cad-rads 4b', 'cadrads 4b'],
        '5': ['total occlusion', 'complete occlusion', 'cad-rads 5', 'cadrads 5', '100% occlusion'],
        'N': ['non-diagnostic', 'non diagnostic', 'cad-rads n'],
      },
    },
    modifier: {
      multi: true,
      options: {
        'S': ['stent', 'stented'],
        'G': ['graft', 'bypass graft', 'cabg'],
        'V': ['vulnerable plaque', 'high-risk plaque', 'positive remodeling', 'low attenuation plaque', 'napkin-ring'],
      },
    },
    plaqueBurden: {
      options: {
        'P1': ['mild plaque', 'p1 plaque', 'minimal plaque burden'],
        'P2': ['moderate plaque', 'p2 plaque'],
        'P3': ['severe plaque', 'p3 plaque'],
        'P4': ['extensive plaque', 'p4 plaque', 'diffuse plaque'],
      },
    },
  },
};
