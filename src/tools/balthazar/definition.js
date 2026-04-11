/**
 * Balthazar / CT Severity Index (CTSI) for acute pancreatitis — definition.
 *
 * Reference: Balthazar EJ et al. Radiology 1990;174(2):331-336.
 *
 * CTSI = Balthazar grade points (0–4) + necrosis points (0–6). Max 10.
 */

export const balthazarDefinition = {
  id: 'balthazar',
  name: 'Balthazar / CTSI',

  gradeOptions: [
    { id: 'A', label: 'A — Normal pancreas', points: 0 },
    { id: 'B', label: 'B — Focal or diffuse enlargement', points: 1 },
    { id: 'C', label: 'C — Peripancreatic inflammatory changes', points: 2 },
    { id: 'D', label: 'D — Single peripancreatic fluid collection', points: 3 },
    { id: 'E', label: 'E — Two or more fluid collections or retroperitoneal gas', points: 4 },
  ],

  necrosisOptions: [
    { id: 'none', label: 'None', points: 0 },
    { id: 'lt30', label: '<30%', points: 2 },
    { id: '30-50', label: '30–50%', points: 4 },
    { id: 'gt50', label: '>50%', points: 6 },
  ],

  parseRules: {
    grade: {
      options: {
        A: ['normal pancreas', 'grade a', 'balthazar a'],
        B: ['focal or diffuse enlargement', 'diffuse enlargement', 'focal enlargement', 'grade b', 'balthazar b'],
        C: ['peripancreatic inflammatory', 'peripancreatic inflammation', 'inflammatory changes', 'grade c', 'balthazar c'],
        D: ['single peripancreatic fluid collection', 'single fluid collection', 'grade d', 'balthazar d'],
        E: ['two or more fluid collections', 'multiple fluid collections', 'retroperitoneal gas', 'grade e', 'balthazar e'],
      },
    },
    necrosis: {
      options: {
        none: ['no necrosis', 'without necrosis', 'no pancreatic necrosis'],
        lt30: ['necrosis less than 30', 'necrosis <30', 'necrosis < 30'],
        '30-50': ['necrosis 30-50', 'necrosis 30 to 50', 'necrosis 30%-50%'],
        gt50: ['necrosis greater than 50', 'necrosis >50', 'necrosis > 50'],
      },
    },
  },
};
