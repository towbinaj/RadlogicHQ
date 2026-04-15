/**
 * Bosniak Classification v2019 for cystic renal masses.
 * Decision-tree / feature-based classification on CT or MRI.
 * Reference: Silverman SG et al. Radiology 2019;292(2):475-488.
 * doi: 10.1148/radiol.2019182646
 */
export const bosniakDefinition = {
  id: 'bosniak',
  name: 'Bosniak v2019',
  version: '1.0.0',
  description:
    'Bosniak Classification v2019 for cystic renal masses on CT and MRI.',
  cdeSetId: null,

  primaryInputs: [
    {
      id: 'location',
      label: 'Kidney',
      inputType: 'single-select',
      options: [
        { id: 'right-upper', label: 'Right upper pole' },
        { id: 'right-mid', label: 'Right mid' },
        { id: 'right-lower', label: 'Right lower pole' },
        { id: 'left-upper', label: 'Left upper pole' },
        { id: 'left-mid', label: 'Left mid' },
        { id: 'left-lower', label: 'Left lower pole' },
      ],
    },
    {
      id: 'size',
      label: 'Size',
      inputType: 'float',
      min: 0.1,
      max: 300,
      step: 0.1,
      unit: 'mm',
      unitToggle: true,
      placeholder: 'e.g., 25',
    },
  ],

  // Imaging modality — affects some criteria
  modality: {
    id: 'modality',
    label: 'Modality',
    options: [
      { id: 'ct', label: 'CT' },
      { id: 'mri', label: 'MRI' },
    ],
  },

  // --- Feature inputs (rendered as button groups) ---

  // Septa
  septa: {
    id: 'septa',
    label: 'Septa',
    options: [
      { id: 'none', label: 'No Septa', tooltip: 'No internal septation' },
      { id: 'thinSmooth', label: 'Thin and Smooth (1-2)', tooltip: 'One to two thin (≤2 mm) smooth septa' },
      { id: 'thinSmoothMany', label: 'Thin and Smooth (≥3)', tooltip: 'Three or more thin (≤2 mm) smooth septa' },
      { id: 'minThickSmooth', label: 'Minimally Thickened Smooth', tooltip: 'Smooth minimally thickened (3 mm) enhancing septa' },
      { id: 'thickIrregular', label: 'Thickened or Irregular', tooltip: 'Thickened (≥4 mm) or irregular enhancing septum(s) with measurable enhancement' },
    ],
  },

  // Wall
  wall: {
    id: 'wall',
    label: 'Wall',
    options: [
      { id: 'thinSmooth', label: 'Thin and Smooth', tooltip: 'Thin (≤2 mm) smooth wall' },
      { id: 'minThickSmooth', label: 'Minimally Thickened Smooth', tooltip: 'Smooth minimally thickened (3 mm) enhancing wall' },
      { id: 'thickIrregular', label: 'Thickened or Irregular', tooltip: 'Thickened (≥4 mm) or irregular enhancing wall with measurable enhancement' },
    ],
  },

  // Calcification
  calcification: {
    id: 'calcification',
    label: 'Calcification',
    tooltip: 'Calcification does not change Bosniak class in v2019; it is noted but not a classifying feature',
    options: [
      { id: 'none', label: 'None' },
      { id: 'thin', label: 'Thin / Fine' },
      { id: 'thick', label: 'Thick / Nodular' },
    ],
  },

  // Enhancement
  enhancement: {
    id: 'enhancement',
    label: 'Enhancement',
    options: [
      { id: 'none', label: 'No Enhancement', tooltip: 'No perceived or measurable enhancement of septa or wall' },
      { id: 'perceived', label: 'Perceived (not measurable)', tooltip: 'Perceived enhancement of septa/wall that is not measurable (CT) or equivocal (MRI)' },
      { id: 'measurable', label: 'Measurable Enhancement', tooltip: 'Measurable enhancement (≥20 HU on CT, or unequivocal on MRI)' },
    ],
  },

  // Soft tissue component — the key feature for Bosniak IV
  softTissue: {
    id: 'softTissue',
    label: 'Enhancing Soft Tissue',
    tooltip: 'Enhancing nodular or solid component that is not a septum or wall (convex protrusion ≥4 mm, obtuse margins with wall/septum)',
    options: [
      { id: 'absent', label: 'Absent' },
      { id: 'present', label: 'Present', tooltip: 'Enhancing convex protrusion (≥4 mm) with obtuse margins arising from wall or septum, or any enhancing mural nodule' },
    ],
  },

  // Multi-cyst pastes like "Cyst 1: ... Cyst 2: ..." (or numbered
  // "1. ... 2. ...") split into per-cyst segments so each maps to its
  // own cyst tab.
  parseSegmentation: { type: 'itemIndex', itemLabel: 'Cyst' },

  parseRules: {
    'size': {
      pattern: /(\d*\.?\d+)\s*(?:mm|cm)/,
      group: 1,
      transform: (m) => {
        const val = parseFloat(m[1]);
        // If input text said "cm", convert to mm
        return m[0].includes('cm') ? val * 10 : val;
      },
    },
    'location': {
      options: {
        'right-upper': ['right upper pole', 'right upper'],
        'right-mid': ['right mid', 'right kidney mid', 'right interpolar'],
        'right-lower': ['right lower pole', 'right lower'],
        'left-upper': ['left upper pole', 'left upper'],
        'left-mid': ['left mid', 'left kidney mid', 'left interpolar'],
        'left-lower': ['left lower pole', 'left lower'],
      },
    },
    'septa': {
      options: {
        'none': ['no septa', 'no septation'],
        'thinSmooth': ['thin smooth septa', 'thin septa', 'hairline septa'],
        'thickIrregular': ['thick septa', 'irregular septa', 'thickened septa'],
      },
    },
    'wall': {
      options: {
        'thinSmooth': ['thin wall', 'smooth thin wall', 'thin smooth wall'],
        'thickIrregular': ['thick wall', 'irregular wall', 'thickened wall'],
      },
    },
    'softTissue': {
      options: {
        'present': ['soft tissue', 'mural nodule', 'nodular enhancement', 'solid component', 'enhancing nodule'],
        'absent': ['no soft tissue', 'no mural nodule', 'no solid component'],
      },
    },
  },
};
