/**
 * Reimers' Migration Index — proximal femoral migration percentage.
 * Simple measurement tool.
 * Reference: Reimers J. Acta Orthop Scand 1980;51(1-6):601-610.
 */
export const reimersDefinition = {
  id: 'reimers',
  name: "Reimers' Index",
  version: '1.0.0',
  description:
    "Reimers' migration index — proximal femoral migration percentage for hip surveillance.",
  cdeSetId: null,

  coxaValgaOptions: [
    { id: 'present', label: 'Present' },
    { id: 'absent', label: 'Absent' },
  ],

  parseRules: {},
};
