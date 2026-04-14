/**
 * ACR TI-RADS tool definition.
 * Mapped to CDE set RDES152 (https://radelement.org/home/sets/set/RDES152)
 */
export const tiradsDefinition = {
  id: 'tirads',
  name: 'ACR TI-RADS Calculator',
  version: '1.1.0',
  description:
    'Thyroid Imaging Reporting and Data System — risk stratification for thyroid nodules based on ultrasound features.',
  cdeSetId: 'RDES152',

  // Rendered first, before scored sections
  primaryInputs: [
    {
      id: 'nodule-side',
      label: 'Side',
      inputType: 'single-select',
      options: [
        { id: 'left', label: 'Left lobe' },
        { id: 'right', label: 'Right lobe' },
        { id: 'isthmus', label: 'Isthmus' },
      ],
      cdeElementId: 'RDE1038',
    },
    {
      id: 'nodule-size',
      label: 'Size',
      inputType: 'float',
      min: 0.1,
      max: 15,
      step: 0.1,
      unit: 'cm',
      unitToggle: true,
      placeholder: 'e.g., 1.5',
      cdeElementId: 'RDE1036',
    },
  ],

  sections: [
    {
      id: 'composition',
      label: 'Composition',
      inputType: 'single-select',
      cdeElementId: 'RDE1040',
      options: [
        {
          id: 'cystic',
          label: 'Cystic or almost completely cystic',
          points: 0,
          image: 'composition-cystic.svg',
          cdeCode: 'RDE1040.0',
        },
        {
          id: 'spongiform',
          label: 'Spongiform',
          points: 0,
          image: 'composition-spongiform.svg',
          cdeCode: 'RDE1040.1',
        },
        {
          id: 'mixed',
          label: 'Mixed cystic and solid',
          points: 1,
          image: 'composition-mixed.svg',
          cdeCode: 'RDE1040.2',
        },
        {
          id: 'solid',
          label: 'Solid or almost completely solid',
          points: 2,
          image: 'composition-solid.svg',
          cdeCode: 'RDE1040.3',
        },
        {
          id: 'indeterminate',
          label: 'Indeterminate',
          points: 2,
          cdeCode: 'RDE1040.4',
        },
      ],
    },
    {
      id: 'echogenicity',
      label: 'Echogenicity',
      inputType: 'single-select',
      cdeElementId: 'RDE1041',
      options: [
        {
          id: 'anechoic',
          label: 'Anechoic',
          points: 0,
          image: 'echogenicity-anechoic.svg',
          cdeCode: 'RDE1041.0',
        },
        {
          id: 'hyper-isoechoic',
          label: 'Hyperechoic or isoechoic',
          points: 1,
          image: 'echogenicity-hyper-iso.svg',
          cdeCode: 'RDE1041.1',
        },
        {
          id: 'hypoechoic',
          label: 'Hypoechoic',
          points: 2,
          image: 'echogenicity-hypo.svg',
          cdeCode: 'RDE1041.3',
        },
        {
          id: 'very-hypoechoic',
          label: 'Very hypoechoic',
          points: 3,
          image: 'echogenicity-very-hypo.svg',
          cdeCode: 'RDE1041.4',
        },
        {
          id: 'cannot-determine',
          label: 'Cannot be determined',
          points: 1,
          cdeCode: 'RDE1041.2',
        },
      ],
    },
    {
      id: 'shape',
      label: 'Shape',
      inputType: 'single-select',
      options: [
        {
          id: 'wider-than-tall',
          label: 'Wider-than-tall',
          points: 0,
          image: 'shape-wider.svg',
        },
        {
          id: 'taller-than-wide',
          label: 'Taller-than-wide',
          points: 3,
          image: 'shape-taller.svg',
          cdeCode: 'RDE1042.4',
        },
      ],
    },
    {
      id: 'margin',
      label: 'Margin',
      inputType: 'single-select',
      options: [
        {
          id: 'smooth',
          label: 'Smooth',
          points: 0,
          image: 'margin-smooth.svg',
        },
        {
          id: 'ill-defined',
          label: 'Ill-defined',
          points: 0,
          image: 'margin-ill-defined.svg',
        },
        {
          id: 'lobulated-irregular',
          label: 'Lobulated or irregular',
          points: 2,
          image: 'margin-lobulated.svg',
          cdeCode: 'RDE1042.3',
        },
        {
          id: 'extrathyroidal',
          label: 'Extra-thyroidal extension',
          points: 3,
          image: 'margin-extrathyroidal.svg',
          cdeCode: 'RDE1042.5',
        },
      ],
    },
    {
      id: 'echogenic-foci',
      label: 'Echogenic Foci',
      description: 'Select all that apply',
      inputType: 'multi-select',
      options: [
        {
          id: 'none',
          label: 'None or large comet-tail artifacts',
          points: 0,
          image: 'foci-none.svg',
          exclusive: true,
        },
        {
          id: 'macrocalcifications',
          label: 'Macrocalcifications',
          points: 1,
          image: 'foci-macro.svg',
          cdeCode: 'RDE1042.0',
        },
        {
          id: 'peripheral-rim',
          label: 'Peripheral (rim) calcifications',
          points: 2,
          image: 'foci-peripheral.svg',
          cdeCode: 'RDE1042.1',
        },
        {
          id: 'punctate',
          label: 'Punctate echogenic foci',
          points: 3,
          image: 'foci-punctate.svg',
          cdeCode: 'RDE1042.2',
        },
      ],
    },
  ],

  additionalInputs: [],

  // Multi-nodule pastes like "Nodule 1: ... Nodule 2: ..." split into
  // per-nodule segments so each maps to its own nodule tab.
  parseSegmentation: { type: 'itemIndex', itemLabel: 'Nodule' },

  parseRules: {
    'nodule-size': {
      pattern: /(\d*\.?\d+)\s*cm/,
      group: 1,
      transform: (m) => parseFloat(m[1]),
    },
    'nodule-side': {
      options: {
        'right': ['right lobe', 'right thyroid'],
        'left': ['left lobe', 'left thyroid'],
        'isthmus': ['isthmus'],
      },
    },
    'composition': {
      options: {
        'cystic': ['cystic or almost completely cystic', 'almost completely cystic', 'predominantly cystic'],
        'spongiform': ['spongiform'],
        'mixed': ['mixed cystic and solid', 'mixed solid and cystic', 'partially cystic', 'predominantly solid'],
        'solid': ['solid or almost completely solid', 'almost completely solid', 'solid nodule', 'solid'],
        'indeterminate': ['composition indeterminate', 'composition cannot be determined'],
      },
    },
    'echogenicity': {
      options: {
        'anechoic': ['anechoic'],
        'hyper-isoechoic': ['hyperechoic', 'isoechoic', 'hyper-echoic', 'iso-echoic'],
        'hypoechoic': ['hypoechoic', 'hypo-echoic'],
        'very-hypoechoic': ['very hypoechoic', 'markedly hypoechoic', 'very hypo-echoic'],
        'cannot-determine': ['echogenicity cannot be determined', 'echogenicity indeterminate'],
      },
    },
    'shape': {
      options: {
        'taller-than-wide': ['taller than wide', 'taller-than-wide', 'ap dimension greater'],
        'wider-than-tall': ['wider than tall', 'wider-than-tall'],
      },
    },
    'margin': {
      options: {
        'extrathyroidal': ['extra-thyroidal extension', 'extrathyroidal extension', 'extra thyroidal'],
        'lobulated-irregular': ['lobulated', 'irregular margin', 'irregular border', 'spiculated'],
        'ill-defined': ['ill-defined', 'ill defined', 'poorly defined'],
        'smooth': ['smooth margin', 'smooth border', 'well-defined', 'well defined', 'well-circumscribed'],
      },
    },
    'echogenic-foci': {
      multi: true,
      options: {
        'punctate': ['punctate echogenic foci', 'punctate echogenic', 'punctate calcification', 'microcalcification'],
        'peripheral-rim': ['peripheral rim', 'rim calcification', 'peripheral calcification', 'eggshell'],
        'macrocalcifications': ['macrocalcification', 'coarse calcification', 'large calcification'],
        'none': ['no echogenic foci', 'no calcification', 'comet-tail', 'comet tail'],
      },
    },
  },
};
