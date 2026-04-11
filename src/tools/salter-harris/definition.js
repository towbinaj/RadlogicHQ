/**
 * Salter-Harris fracture classification — definition.
 *
 * Reference: Salter RB, Harris WR. J Bone Joint Surg Am 1963;45(3):587-622.
 * Mnemonic: SALTR (Separation, Above, Lower, Transverse, Ruined)
 */

export const salterHarrisDefinition = {
  id: 'salter-harris',
  name: 'Salter-Harris',

  types: [
    { id: 'I', label: 'Type I — Separation', anatomy: 'Physis only (slip through growth plate)', prognosis: 'Excellent', management: 'Immobilization' },
    { id: 'II', label: 'Type II — Above', anatomy: 'Physis + metaphysis (Thurstan Holland fragment)', prognosis: 'Good', management: 'Closed reduction, immobilization' },
    { id: 'III', label: 'Type III — Lower', anatomy: 'Physis + epiphysis (intra-articular)', prognosis: 'Moderate — growth disturbance risk', management: 'Anatomic reduction (often surgical)' },
    { id: 'IV', label: 'Type IV — Transverse', anatomy: 'Metaphysis through physis to epiphysis', prognosis: 'Guarded — high physeal fusion risk', management: 'Open reduction, internal fixation' },
    { id: 'V', label: 'Type V — Ruined/Crush', anatomy: 'Axial compression/crush of physis', prognosis: 'Poor — growth arrest likely', management: 'Close follow-up for growth disturbance' },
  ],

  parseRules: {
    type: {
      options: {
        V: ['salter-harris v', 'salter harris v', 'salter v', 'type v', 'sh type v', 'sh v', 'crush'],
        IV: ['salter-harris iv', 'salter harris iv', 'salter iv', 'type iv', 'sh type iv', 'sh iv', 'transverse'],
        III: ['salter-harris iii', 'salter harris iii', 'salter iii', 'type iii', 'sh type iii', 'sh iii'],
        II: ['salter-harris ii', 'salter harris ii', 'salter ii', 'type ii', 'sh type ii', 'sh ii', 'thurstan holland'],
        I: ['salter-harris i', 'salter harris i', 'salter i', 'type i', 'sh type i', 'sh i'],
      },
    },
    location: {
      pattern: /(?:distal|proximal)\s+\w+/i,
      group: 0,
      transform: (m) => m[0],
    },
  },
};
