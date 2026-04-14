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
      label: 'Non-rim APHE',
      tooltip: 'Arterial phase hyperenhancement: enhancement in arterial phase unequivocally greater than surrounding liver, not rim-shaped',
      inputType: 'yes-no',
      cdeElementId: 'RDE82',
    },
    {
      id: 'washout',
      label: 'Nonperipheral Washout',
      tooltip: 'Visually decreased enhancement in portal venous or delayed phase relative to liver, not mainly in observation periphery',
      inputType: 'yes-no',
      cdeElementId: 'RDE85',
    },
    {
      id: 'capsule',
      label: 'Enhancing Capsule',
      tooltip: 'Smooth, uniform, sharp border around most or all of observation, most pronounced in portal venous or delayed phase',
      inputType: 'yes-no',
      cdeElementId: 'RDE83',
    },
    {
      id: 'thresholdGrowth',
      label: 'Threshold Growth',
      tooltip: 'Size increase of ≥50% in ≤6 months. Measured outer edge to outer edge.',
      inputType: 'yes-no',
      cdeElementId: 'RDE84',
    },
  ],

  // Ancillary features (optional upgrade/downgrade)
  ancillaryFeatures: {
    favoringHCC: [
      { id: 'restrictedDiffusion', label: 'Restricted diffusion', tooltip: 'Signal intensity on DWI higher than liver, not attributable solely to T2 shine-through; ADC lower or similar to liver', cdeElementId: 'RDE89' },
      { id: 'mildT2Hyperintensity', label: 'Mild-moderate T2 hyperintensity', tooltip: 'Signal intensity on T2W images mildly or moderately higher than liver', cdeElementId: 'RDE87' },
      { id: 'intralesionalFat', label: 'Intralesional fat', tooltip: 'Fat within the observation in greater concentration than surrounding liver. Identified by signal loss on opposed-phase or fat-only images.', cdeElementId: 'RDE91' },
      { id: 'mosaicArchitecture', label: 'Mosaic architecture', tooltip: 'Observation appearing to consist of randomly distributed internal nodules or compartments with differing appearances', cdeElementId: 'RDE90' },
      { id: 'noduleInNodule', label: 'Nodule-in-nodule', tooltip: 'Smaller nodule within a larger nodule, with different imaging characteristics than the parent nodule' },
      { id: 'fatSparing', label: 'Fat sparing in solid mass', tooltip: 'Less fat in a solid mass than in surrounding fatty liver' },
      { id: 'ironSparing', label: 'Iron sparing in solid mass', tooltip: 'Less iron in a solid mass than in surrounding iron-overloaded liver' },
      { id: 'coronaEnhancement', label: 'Corona enhancement', tooltip: 'Perilesional enhancement in late arterial or early portal venous phase, thought to represent venous drainage from arterialized tumor' },
    ],
    favoringBenign: [
      { id: 'homogeneousSignal', label: 'Homogeneous signal', tooltip: 'Uniform signal intensity throughout observation on all sequences' },
      { id: 'markedT2Hyperintensity', label: 'Marked T2 hyperintensity', tooltip: 'Signal intensity on T2W images approaching that of bile ducts or CSF' },
      { id: 'undistortedVessels', label: 'Undistorted vessels', tooltip: 'Vessels traversing observation without displacement, distortion, or encasement' },
      { id: 'parallelsBloodPool', label: 'Parallels blood pool', tooltip: 'Enhancement pattern mirroring blood pool (aorta/veins) across all phases' },
      { id: 'ironInMass', label: 'Iron in mass > liver', tooltip: 'More iron in the mass than in surrounding liver parenchyma' },
      { id: 'fatInMass', label: 'Fat in mass > liver', tooltip: 'More fat in the mass than in surrounding liver parenchyma (distinct from intralesional fat which favors HCC)' },
      { id: 'hbpIsointensity', label: 'HBP isointensity', tooltip: 'Hepatobiliary phase signal intensity identical or nearly identical to surrounding liver', cdeElementId: 'RDE86' },
    ],
  },

  // Location input
  primaryInputs: [
    {
      id: 'location',
      label: 'Couinaud Segment',
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
    {
      id: 'size',
      label: 'Size (mm)',
      inputType: 'integer',
      min: 1,
      max: 999,
      step: 1,
      unit: 'mm',
      placeholder: 'e.g., 25',
      cdeElementId: 'RDE81',
    },
  ],

  locationInput: {
    id: 'location',
    label: 'Couinaud Segment',
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

  // Multi-observation pastes like "Observation 1: ... Observation 2: ..."
  // (or numbered "1. ... 2. ...") split into per-observation segments,
  // each mapping to its own observation tab.
  parseSegmentation: { type: 'itemIndex', itemLabel: 'Observation' },

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

    // --- Benign assessment (drives the 4-way button in the UI) ---
    // "cyst" alone is NOT in the keyword list because "cyst" is a substring
    // of "cystic", which would false-positive on "cystic lesion" etc. Use
    // 'simple cyst', 'hepatic cyst', 'benign cyst' instead. Longest-match
    // discrimination: "probable hemangioma" beats "hemangioma", so dictations
    // like "probable hemangioma" route to probablyBenign, while plain
    // "hemangioma" routes to definitelyBenign.
    'benignAssessment': {
      options: {
        'definitelyBenign': [
          'definitely benign',
          'simple cyst',
          'hepatic cyst',
          'benign cyst',
          'hemangioma',
          'perfusion alteration',
          'focal fat deposition',
          'focal fat sparing',
          'hypertrophic pseudomass',
          'confluent fibrosis',
          'focal scar',
        ],
        'probablyBenign': [
          'probably benign',
          'probable cyst',
          'probable simple cyst',
          'probable hemangioma',
          'angiomyolipoma',
          'focal nodular hyperplasia',
          'fnh',
          'distinctive nodule',
        ],
        'indeterminate': ['indeterminate'],
        'notBenign': ['not benign'],
      },
    },

    // --- Tumor in vein (LR-TIV) ---
    'tumorInVein': {
      options: {
        'yes': ['tumor in vein', 'tumor thrombus', 'enhancing tumor thrombus', 'venous tumor invasion', 'lr-tiv'],
        'no': ['bland thrombus', 'no tumor thrombus', 'no tumor in vein', 'patent'],
      },
    },

    // --- LR-M targetoid / non-HCC malignancy features ---
    // Kept narrow to avoid collisions with major-feature rules above.
    'lrmFeatures': {
      options: {
        'yes': [
          'targetoid',
          'rim arterial phase hyperenhancement',
          'rim aphe',
          'peripheral washout',
          'delayed central enhancement',
          'infiltrative appearance',
          'marked diffusion restriction',
          'lr-m',
        ],
      },
    },

    // --- Ancillary features favoring HCC (upgrade) ---
    // Tool-specific formState keys: anc_hcc_<featureId>. Only the most
    // commonly dictated ones are covered; users can still click to toggle
    // the rest.
    'anc_hcc_restrictedDiffusion': {
      options: { yes: ['restricted diffusion', 'diffusion restriction', 'low adc', 'true restricted diffusion'] },
    },
    'anc_hcc_mildT2Hyperintensity': {
      options: {
        yes: [
          'mild t2 hyperintensity',
          'mild-moderate t2 hyperintensity',
          'mild to moderate t2 hyperintensity',
          'mildly t2 hyperintense',
          'moderately t2 hyperintense',
        ],
      },
    },
    'anc_hcc_intralesionalFat': {
      options: { yes: ['intralesional fat', 'intratumoral fat', 'fat within the lesion', 'signal loss on opposed-phase'] },
    },
    'anc_hcc_mosaicArchitecture': {
      options: { yes: ['mosaic architecture', 'mosaic appearance'] },
    },
    'anc_hcc_coronaEnhancement': {
      options: { yes: ['corona enhancement', 'perilesional enhancement'] },
    },
    'anc_hcc_noduleInNodule': {
      options: { yes: ['nodule-in-nodule', 'nodule in nodule'] },
    },

    // --- Ancillary features favoring benign (downgrade) ---
    'anc_benign_markedT2Hyperintensity': {
      options: { yes: ['marked t2 hyperintensity', 'markedly t2 hyperintense', 'fluid signal on t2', 't2 bright'] },
    },
    'anc_benign_parallelsBloodPool': {
      options: { yes: ['parallels blood pool', 'follows blood pool', 'blood-pool enhancement'] },
    },
    'anc_benign_hbpIsointensity': {
      options: { yes: ['hbp isointensity', 'hepatobiliary phase isointensity', 'iso to liver on hbp', 'hepatobiliary phase iso'] },
    },
    'anc_benign_undistortedVessels': {
      options: { yes: ['undistorted vessels', 'vessels traverse', 'traversing vessels'] },
    },
    'anc_benign_homogeneousSignal': {
      options: { yes: ['homogeneous signal', 'uniformly homogeneous'] },
    },
  },
};
