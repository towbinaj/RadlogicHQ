/**
 * LI-RADS v2018 CT/MRI tool definition.
 * Decision-tree based (not point-based).
 * CDE set RDES5 (https://radelement.org/home/sets/set/RDES5)
 */
export const liradsDefinition = {
  id: 'lirads',
  name: 'LI-RADS v2018 CT/MRI',
  version: '1.0.0',
  description:
    'Liver Imaging Reporting and Data System — HCC risk stratification for at-risk patients on CT or MRI.',
  cdeSetId: 'RDES5',

  // Decision tree steps (rendered sequentially)
  steps: [
    {
      id: 'definitelyBenign',
      question: 'Is this observation definitely benign?',
      hint: 'Cyst, hemangioma, perfusion alteration, hepatic fat deposition/sparing, hypertrophic pseudomass, confluent fibrosis, focal scar',
      inputType: 'yes-no',
      earlyExit: { yes: 'LR-1' },
    },
    {
      id: 'probablyBenign',
      question: 'Is this observation probably benign?',
      hint: 'Probable cyst, probable hemangioma, hepatic angiomyolipoma, focal nodular hyperplasia, distinctive nodule without malignancy features',
      inputType: 'yes-no',
      earlyExit: { yes: 'LR-2' },
    },
    {
      id: 'tumorInVein',
      question: 'Is there tumor in vein?',
      hint: 'Unequivocal enhancing soft tissue in vein lumen',
      inputType: 'yes-no',
      earlyExit: { yes: 'LR-TIV' },
      cdeElementId: 'RDE80',
    },
    {
      id: 'lrmFeatures',
      question: 'Does it have targetoid or LR-M features?',
      hint: 'Rim APHE, peripheral washout, delayed central enhancement, infiltrative appearance, marked diffusion restriction, necrosis/hemorrhage disproportionate to size',
      inputType: 'yes-no',
      earlyExit: { yes: 'LR-M' },
    },
  ],

  // Major features (shown together in Step 5 when no early exit)
  majorFeatures: [
    {
      id: 'size',
      label: 'Observation Size (mm)',
      inputType: 'integer',
      min: 1,
      max: 999,
      step: 1,
      unit: 'mm',
      placeholder: 'e.g., 25',
      cdeElementId: 'RDE81',
    },
    {
      id: 'aphe',
      label: 'Non-rim Arterial Phase Hyperenhancement (APHE)',
      inputType: 'yes-no',
      cdeElementId: 'RDE82',
    },
    {
      id: 'washout',
      label: 'Nonperipheral Washout',
      inputType: 'yes-no',
      cdeElementId: 'RDE85',
    },
    {
      id: 'capsule',
      label: 'Enhancing Capsule',
      inputType: 'yes-no',
      cdeElementId: 'RDE83',
    },
    {
      id: 'thresholdGrowth',
      label: 'Threshold Growth',
      description: '≥50% size increase in ≤6 months',
      inputType: 'yes-no',
      cdeElementId: 'RDE84',
    },
  ],

  // Ancillary features (optional upgrade/downgrade)
  ancillaryFeatures: {
    favoringHCC: [
      { id: 'restrictedDiffusion', label: 'Restricted diffusion', cdeElementId: 'RDE89' },
      { id: 'mildT2Hyperintensity', label: 'Mild-moderate T2 hyperintensity', cdeElementId: 'RDE87' },
      { id: 'intralesionalFat', label: 'Intralesional fat', cdeElementId: 'RDE91' },
      { id: 'mosaicArchitecture', label: 'Mosaic architecture', cdeElementId: 'RDE90' },
      { id: 'noduleInNodule', label: 'Nodule-in-nodule architecture' },
      { id: 'fatSparing', label: 'Fat sparing in solid mass' },
      { id: 'ironSparing', label: 'Iron sparing in solid mass' },
      { id: 'coronaEnhancement', label: 'Corona enhancement' },
    ],
    favoringBenign: [
      { id: 'homogeneousSignal', label: 'Homogeneous signal intensity' },
      { id: 'markedT2Hyperintensity', label: 'Marked T2 hyperintensity' },
      { id: 'undistortedVessels', label: 'Undistorted vessels' },
      { id: 'parallelsBloodPool', label: 'Parallels blood pool' },
      { id: 'ironInMass', label: 'Iron in mass more than liver' },
      { id: 'fatInMass', label: 'Fat in mass more than liver' },
      { id: 'hbpIsointensity', label: 'Hepatobiliary phase isointensity', cdeElementId: 'RDE86' },
    ],
  },

  // Location input
  locationInput: {
    id: 'location',
    label: 'Segment',
    inputType: 'single-select',
    options: [
      { id: 'seg1', label: 'Segment I (caudate)' },
      { id: 'seg2', label: 'Segment II' },
      { id: 'seg3', label: 'Segment III' },
      { id: 'seg4a', label: 'Segment IVa' },
      { id: 'seg4b', label: 'Segment IVb' },
      { id: 'seg5', label: 'Segment V' },
      { id: 'seg6', label: 'Segment VI' },
      { id: 'seg7', label: 'Segment VII' },
      { id: 'seg8', label: 'Segment VIII' },
    ],
  },

  parseRules: {
    'size': {
      pattern: /(\d+)\s*mm/,
      group: 1,
      transform: (m) => parseInt(m[1], 10),
    },
    'location': {
      options: {
        'seg1': ['segment 1', 'segment i', 'caudate'],
        'seg2': ['segment 2', 'segment ii'],
        'seg3': ['segment 3', 'segment iii'],
        'seg4a': ['segment 4a', 'segment iva'],
        'seg4b': ['segment 4b', 'segment ivb'],
        'seg5': ['segment 5', 'segment v '],
        'seg6': ['segment 6', 'segment vi '],
        'seg7': ['segment 7', 'segment vii'],
        'seg8': ['segment 8', 'segment viii'],
      },
    },
    'aphe': {
      options: {
        'yes': ['arterial hyperenhancement', 'arterial phase hyperenhancement', 'aphe', 'arterial enhancement', 'hyperenhancing'],
        'no': ['no arterial hyperenhancement', 'no aphe', 'hypoenhancing', 'isoenhancing'],
      },
    },
    'washout': {
      options: {
        'yes': ['washout', 'washes out', 'washout appearance', 'portal venous hypoenhancement'],
        'no': ['no washout', 'persistent enhancement'],
      },
    },
    'capsule': {
      options: {
        'yes': ['enhancing capsule', 'capsule appearance', 'capsule present', 'peripheral rim enhancement'],
        'no': ['no capsule', 'no enhancing capsule'],
      },
    },
    'thresholdGrowth': {
      options: {
        'yes': ['threshold growth', 'interval growth', 'increased in size', 'new lesion'],
        'no': ['stable', 'no growth', 'unchanged'],
      },
    },
  },
};
