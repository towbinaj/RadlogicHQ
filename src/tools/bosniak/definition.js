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

  // Imaging modality - asked first. Class I/II criteria differ (CT HU vs MRI
  // signal), calcification is a CT criterion only, and an unenhanced study
  // can be assigned at most class II.
  modality: {
    id: 'modality',
    label: 'Modality',
    options: [
      { id: 'ct', label: 'CT' },
      { id: 'mri', label: 'MRI' },
    ],
  },

  exam: {
    id: 'exam',
    label: 'Exam',
    optionsByModality: {
      ct: [
        { id: 'protocol', label: 'Renal mass protocol', tooltip: 'Unenhanced and contrast-enhanced phases' },
        { id: 'enhanced', label: 'Single-phase enhanced', tooltip: 'Portal venous phase only' },
        { id: 'unenhanced', label: 'Unenhanced only', tooltip: 'Enhancement cannot be assessed: highest class II' },
      ],
      mri: [
        { id: 'enhanced', label: 'With contrast', tooltip: 'Pre- and post-contrast T1W (subtraction recommended)' },
        { id: 'unenhanced', label: 'Without contrast', tooltip: 'Enhancement cannot be assessed: highest class II' },
      ],
    },
  },

  // Homogeneous content: CT attenuation or MRI signal (class I/II types).
  content: {
    id: 'content',
    labelByModality: { ct: 'Attenuation', mri: 'Signal' },
    options: [
      { id: 'simple', modality: 'ct', label: 'Homogeneous -9 to 20 HU', tooltip: 'Simple fluid attenuation (class I on an enhanced exam; class II on unenhanced CT)' },
      { id: 'hyper70', modality: 'ct', label: 'Homogeneous >=70 HU (unenhanced)', tooltip: 'Class II: hyperattenuating at unenhanced CT' },
      { id: 'nonenh20', modality: 'ct', label: 'Homogeneous >20 HU, non-enhancing', tooltip: 'Class II: non-enhancing at renal mass protocol CT' },
      { id: 'pv2130', modality: 'ct', label: 'Homogeneous 21-30 HU (portal venous)', tooltip: 'Class II: 21-30 HU at portal venous phase CT' },
      { id: 'tooSmall', modality: 'ct', label: 'Too small to characterize', tooltip: 'Class II: homogeneous low-attenuation mass too small to characterize' },
      { id: 'hetero', modality: 'ct', label: 'Heterogeneous', tooltip: 'Without higher-class features, MRI is recommended before assigning a class' },
      { id: 'simple', modality: 'mri', label: 'Homogeneous fluid (CSF-like)', tooltip: 'Simple fluid signal (class I with contrast; class II on unenhanced MRI)' },
      { id: 't1bright', modality: 'mri', label: 'Homogeneous markedly T1 hyperintense', tooltip: 'Class II: about 2.5x renal parenchyma at unenhanced fat-saturated T1W' },
      { id: 't1hetero', modality: 'mri', label: 'Heterogeneously T1 hyperintense', tooltip: 'Class IIF: heterogeneously hyperintense at unenhanced fat-saturated T1W' },
      { id: 'tooSmall', modality: 'mri', label: 'Too small to characterize', tooltip: 'Class II: homogeneous fluid signal mass too small to characterize' },
    ],
  },

  // --- Feature inputs (rendered as button groups) ---

  // Septa
  septa: {
    id: 'septa',
    label: 'Septa',
    options: [
      { id: 'none', label: 'No Septa', tooltip: 'No internal septation' },
      { id: 'thinSmooth', label: 'Thin and Smooth, few (1-3)', tooltip: 'Few (1-3) thin (<=2 mm) smooth septa (class II)' },
      { id: 'thinSmoothMany', label: 'Thin and Smooth, many (>=4)', tooltip: 'Many (>=4) thin (<=2 mm) smooth septa (class IIF)' },
      { id: 'minThickSmooth', label: 'Minimally Thickened Smooth', tooltip: 'Smooth minimally thickened (3 mm) septa; class IIF if enhancing' },
      { id: 'thickIrregular', label: 'Thickened or Irregular', tooltip: 'Thick (>=4 mm) or irregular (<=3 mm obtuse protrusions) septa; class III if enhancing' },
    ],
  },

  // Wall
  wall: {
    id: 'wall',
    label: 'Wall',
    options: [
      { id: 'thinSmooth', label: 'Thin and Smooth', tooltip: 'Thin (<=2 mm) smooth wall' },
      { id: 'minThickSmooth', label: 'Minimally Thickened Smooth', tooltip: 'Smooth minimally thickened (3 mm) wall; class IIF if enhancing' },
      { id: 'thickIrregular', label: 'Thickened or Irregular', tooltip: 'Thick (>=4 mm) or irregular (<=3 mm obtuse protrusions) wall; class III if enhancing' },
    ],
  },

  // Calcification
  calcification: {
    id: 'calcification',
    label: 'Calcification',
    tooltip: 'CT only (MRI is insensitive to calcium). Calcification of any type is a class II feature and excludes class I.',
    options: [
      { id: 'none', label: 'None' },
      { id: 'thin', label: 'Thin / Fine' },
      { id: 'thick', label: 'Thick / Nodular' },
    ],
  },

  // Enhancement (v2019): unequivocal visual enhancement, or a quantitative
  // increase of >=20 HU (CT) / >=15% signal intensity (MRI). The wall may
  // enhance in class I and II. Not asked on an unenhanced exam.
  enhancement: {
    id: 'enhancement',
    label: 'Wall / Septal / Nodular Enhancement',
    options: [
      { id: 'none', label: 'No Enhancement', tooltip: 'No unequivocal enhancement of wall, septa or nodule' },
      { id: 'present', label: 'Enhancement Present', tooltip: 'Unequivocal visual enhancement, or >=20 HU increase (CT) / >=15% signal increase (MRI)' },
    ],
  },

  // Soft tissue component — the key feature for Bosniak IV
  softTissue: {
    id: 'softTissue',
    label: 'Nodule',
    tooltip: 'Nodule: convex protrusion >=4 mm with obtuse margins, or any size with acute margins. Must enhance for class IV.',
    options: [
      { id: 'absent', label: 'Absent' },
      { id: 'present', label: 'Present', tooltip: 'Convex protrusion >=4 mm with obtuse margins, or any size with acute margins' },
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
        'minThickSmooth': ['minimally thickened septa', 'minimally thick septa'],
        'thickIrregular': ['thick septa', 'irregular septa', 'thickened septa'],
      },
    },
    'wall': {
      options: {
        'thinSmooth': ['thin wall', 'smooth thin wall', 'thin smooth wall'],
        'minThickSmooth': ['minimally thickened wall', 'minimally thick wall'],
        'thickIrregular': ['thick wall', 'irregular wall', 'thickened wall'],
      },
    },
    'modality': {
      options: {
        'ct': ['ct', 'computed tomography'],
        'mri': ['mri', 'magnetic resonance'],
      },
    },
    'exam': {
      options: {
        'protocol': ['renal mass protocol', 'multiphase', 'multiphasic'],
        'enhanced': ['portal venous', 'with contrast', 'contrast-enhanced', 'contrast enhanced'],
        'unenhanced': ['without contrast', 'unenhanced', 'non-contrast', 'noncontrast'],
      },
    },
    'enhancement': {
      options: {
        'none': ['no enhancement', 'non-enhancing', 'nonenhancing', 'does not enhance', 'without enhancement'],
        'present': ['enhancing', 'enhancement', 'enhances'],
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
