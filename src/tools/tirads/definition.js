/**
 * ACR TI-RADS tool definition.
 * Declarative config describing all scoring categories, options, and point values.
 */
export const tiradsDefinition = {
  id: 'tirads',
  name: 'ACR TI-RADS Calculator',
  version: '1.0.0',
  description:
    'Thyroid Imaging Reporting and Data System — risk stratification for thyroid nodules based on ultrasound features.',
  cdeSetId: 'RDES411',

  sections: [
    {
      id: 'composition',
      label: 'Composition',
      description: 'Internal content of the nodule',
      inputType: 'single-select',
      options: [
        {
          id: 'cystic',
          label: 'Cystic or almost completely cystic',
          points: 0,
          image: 'composition-cystic.svg',
        },
        {
          id: 'spongiform',
          label: 'Spongiform',
          points: 0,
          image: 'composition-spongiform.svg',
        },
        {
          id: 'mixed',
          label: 'Mixed cystic and solid',
          points: 1,
          image: 'composition-mixed.svg',
        },
        {
          id: 'solid',
          label: 'Solid or almost completely solid',
          points: 2,
          image: 'composition-solid.svg',
        },
      ],
    },
    {
      id: 'echogenicity',
      label: 'Echogenicity',
      description: 'Echogenicity of the solid component',
      inputType: 'single-select',
      options: [
        {
          id: 'anechoic',
          label: 'Anechoic',
          points: 0,
          image: 'echogenicity-anechoic.svg',
        },
        {
          id: 'hyper-isoechoic',
          label: 'Hyperechoic or isoechoic',
          points: 1,
          image: 'echogenicity-hyper-iso.svg',
        },
        {
          id: 'hypoechoic',
          label: 'Hypoechoic',
          points: 2,
          image: 'echogenicity-hypo.svg',
        },
        {
          id: 'very-hypoechoic',
          label: 'Very hypoechoic',
          points: 3,
          image: 'echogenicity-very-hypo.svg',
        },
      ],
    },
    {
      id: 'shape',
      label: 'Shape',
      description: 'Assessed on a transverse image',
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
        },
      ],
    },
    {
      id: 'margin',
      label: 'Margin',
      description: 'Border of the nodule',
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
        },
        {
          id: 'extrathyroidal',
          label: 'Extra-thyroidal extension',
          points: 3,
          image: 'margin-extrathyroidal.svg',
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
        },
        {
          id: 'peripheral-rim',
          label: 'Peripheral (rim) calcifications',
          points: 2,
          image: 'foci-peripheral.svg',
        },
        {
          id: 'punctate',
          label: 'Punctate echogenic foci',
          points: 3,
          image: 'foci-punctate.svg',
        },
      ],
    },
  ],

  additionalInputs: [
    {
      id: 'nodule-size',
      label: 'Maximum Dimension',
      inputType: 'float',
      min: 0.1,
      max: 20,
      step: 0.1,
      unit: 'cm',
      placeholder: 'e.g., 1.5',
      cdeElementId: 'RDE3056',
    },
    {
      id: 'nodule-location',
      label: 'Location',
      inputType: 'single-select',
      options: [
        { id: 'right', label: 'Right lobe' },
        { id: 'left', label: 'Left lobe' },
        { id: 'isthmus', label: 'Isthmus' },
        { id: 'right-isthmus', label: 'Right lobe/Isthmus' },
        { id: 'left-isthmus', label: 'Left lobe/Isthmus' },
      ],
      cdeElementId: 'RDE3055',
    },
    {
      id: 'additional-findings',
      label: 'Additional Findings',
      inputType: 'text',
      placeholder: 'Free text for additional observations...',
      rows: 3,
    },
  ],
};
