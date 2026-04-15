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

  // Bilateral pastes like "Right hip: M1 8 mm, M2 40 mm. Left hip:
  // M1 12 mm, M2 38 mm." split into per-side segments so each side
  // routes its M1/M2 to the dedicated rightM1/rightM2/leftM1/leftM2
  // fields. Reimers is always bilateral (both hip cards always
  // visible), so no UI state refactor is needed -- just parser
  // coverage for the per-side measurements.
  parseSegmentation: { type: 'laterality' },

  parseRules: {
    // M1: uncovered femoral head width, matched via "M1 = 8 mm" /
    // "M1 8 mm" / "M1: 8". Word-boundary + optional equals/colon.
    m1: {
      pattern: /\bm1\s*[=:]?\s*(\d*\.?\d+)\s*(?:mm)?/i,
      group: 1,
      transform: (m) => parseFloat(m[1]),
    },
    // M2: total femoral head width.
    m2: {
      pattern: /\bm2\s*[=:]?\s*(\d*\.?\d+)\s*(?:mm)?/i,
      group: 1,
      transform: (m) => parseFloat(m[1]),
    },
    // Coxa valga is study-level (not per-side) so it parses the same
    // way regardless of segment.
    coxaValga: {
      options: {
        present: ['coxa valga', 'valgus femoral neck', 'increased neck-shaft angle'],
        absent: ['no coxa valga', 'normal neck-shaft angle'],
      },
    },
  },
};
