/**
 * mRECIST (Modified RECIST) for HCC — definition.
 *
 * Reference: Lencioni R, Llovet JM. Semin Liver Dis 2010;30(1):52-60.
 *
 * Measures longest diameter of enhancing (viable) tumor only.
 * CR = disappearance of arterial enhancement in all targets.
 * PR = ≥30% decrease in sum of enhancing diameters.
 * PD = ≥20% increase in sum of enhancing diameters.
 * SD = neither PR nor PD.
 */

export const mrecistDefinition = {
  id: 'mrecist',
  name: 'mRECIST',

  nonTargetOptions: [
    { id: 'absent', label: 'Absent (CR)' },
    { id: 'present', label: 'Present (non-CR/non-PD)' },
    { id: 'progression', label: 'Unequivocal progression' },
  ],

  newLesionOptions: [
    { id: 'no', label: 'No' },
    { id: 'yes', label: 'Yes' },
  ],

  // Multi-target pastes like "Target 1: ... Target 2: ..." (or numbered
  // "1. ... 2. ..." / "first target: ...") split into per-target
  // segments so each maps to its own row in the target table.
  parseSegmentation: { type: 'itemIndex', itemLabel: 'Target' },

  parseRules: {
    // Per-target longest enhancing diameter (routes to target.current).
    size: {
      pattern: /(\d*\.?\d+)\s*mm/,
      group: 1,
      transform: (m) => parseFloat(m[1]),
    },

    // Per-target Couinaud segment. IDs feed directly into target.location
    // (free-text input), so what's stored is what the user sees.
    location: {
      options: {
        'Segment I': ['segment 1', 'segment i ', 'caudate lobe', 'caudate'],
        'Segment II': ['segment 2', 'segment ii'],
        'Segment III': ['segment 3', 'segment iii'],
        'Segment IVa': ['segment 4a', 'segment iva'],
        'Segment IVb': ['segment 4b', 'segment ivb'],
        'Segment V': ['segment 5', 'segment v '],
        'Segment VI': ['segment 6', 'segment vi '],
        'Segment VII': ['segment 7', 'segment vii'],
        'Segment VIII': ['segment 8', 'segment viii'],
      },
    },

    nonTarget: {
      options: {
        'absent': ['non-target absent', 'nontarget absent', 'non-target cr', 'no viable tumor', 'no arterial enhancement'],
        'present': ['non-target present', 'nontarget present', 'residual enhancement', 'viable tumor'],
        'progression': ['non-target progression', 'nontarget progression', 'unequivocal progression', 'new enhancing lesion'],
      },
    },
    newLesion: {
      options: {
        'no': ['no new lesion', 'no new lesions', 'no new enhancing lesion'],
        'yes': ['new lesion', 'new lesions', 'new enhancing lesion', 'new hcc'],
      },
    },
  },
};
