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
      tooltip: 'Visually decreased enhancement in portal venous or delayed phase relative to liver, not mainly in observation periphery. With a hepatobiliary agent: portal venous phase only.',
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

  // Imaging technique - asked first. Major features and the LR table are
  // the same on CT and MRI; ancillary features differ by what the technique
  // can show (DWI, T2, iron need MRI; transitional/hepatobiliary phase
  // features need a hepatobiliary agent such as gadoxetate). With a
  // hepatobiliary agent, washout is assessed in the portal venous phase only.
  modalityOptions: [
    { id: 'ct', label: 'CT' },
    { id: 'mri-eca', label: 'MRI (extracellular agent)' },
    { id: 'mri-hba', label: 'MRI (hepatobiliary agent)', tooltip: 'Gadoxetate: washout in portal venous phase only; transitional/HBP hypointensity are ancillary features' },
  ],

  // Ancillary features (optional upgrade/downgrade), LI-RADS v2018.
  // modalities: where the feature can be assessed. 'favoringHCC' holds the
  // features favoring malignancy (in general and HCC in particular); both
  // upgrade by one category (never to LR-5). Modality tags for MRI-only and
  // HBP-only features follow the v2018 core; not re-checked against the ACR
  // PDF in this update (2026-11-28).
  ancillaryFeatures: {
    favoringHCC: [
      { id: 'restrictedDiffusion', modalities: ['mri-eca', 'mri-hba'], label: 'Restricted diffusion', tooltip: 'MRI: signal intensity on DWI higher than liver, not attributable solely to T2 shine-through; ADC lower or similar to liver', cdeElementId: 'RDE89' },
      { id: 'mildT2Hyperintensity', modalities: ['mri-eca', 'mri-hba'], label: 'Mild-moderate T2 hyperintensity', tooltip: 'MRI: signal intensity on T2W images mildly or moderately higher than liver', cdeElementId: 'RDE87' },
      { id: 'tpHypointensity', modalities: ['mri-hba'], label: 'Transitional phase hypointensity', tooltip: 'Hepatobiliary agent only: hypointense to liver in the transitional phase' },
      { id: 'hbpHypointensity', modalities: ['mri-hba'], label: 'HBP hypointensity', tooltip: 'Hepatobiliary agent only: hypointense to liver in the hepatobiliary phase' },
      { id: 'coronaEnhancement', modalities: ['ct', 'mri-eca', 'mri-hba'], label: 'Corona enhancement', tooltip: 'Perilesional enhancement in late arterial or early portal venous phase, thought to represent venous drainage from arterialized tumor' },
      { id: 'fatSparing', modalities: ['ct', 'mri-eca', 'mri-hba'], label: 'Fat sparing in solid mass', tooltip: 'Less fat in a solid mass than in surrounding fatty liver (easiest on chemical-shift MRI)' },
      { id: 'ironSparing', modalities: ['mri-eca', 'mri-hba'], label: 'Iron sparing in solid mass', tooltip: 'MRI: less iron in a solid mass than in surrounding iron-overloaded liver' },
      { id: 'subthresholdGrowth', modalities: ['ct', 'mri-eca', 'mri-hba'], label: 'Subthreshold growth', tooltip: 'Unequivocal size increase that does not meet threshold growth' },
      { id: 'usVisibility', modalities: ['ct', 'mri-eca', 'mri-hba'], label: 'US visibility as discrete nodule', tooltip: 'Observation seen as a discrete nodule on prior ultrasound' },
      { id: 'nonenhancingCapsule', modalities: ['ct', 'mri-eca', 'mri-hba'], label: 'Nonenhancing capsule', tooltip: 'Favors HCC in particular: capsule seen as a nonenhancing rim' },
      { id: 'noduleInNodule', modalities: ['ct', 'mri-eca', 'mri-hba'], label: 'Nodule-in-nodule', tooltip: 'Favors HCC in particular: smaller nodule within a larger nodule, with different imaging characteristics' },
      { id: 'mosaicArchitecture', modalities: ['ct', 'mri-eca', 'mri-hba'], label: 'Mosaic architecture', tooltip: 'Favors HCC in particular: randomly distributed internal nodules or compartments with differing appearances', cdeElementId: 'RDE90' },
      { id: 'bloodProducts', modalities: ['ct', 'mri-eca', 'mri-hba'], label: 'Blood products in mass', tooltip: 'Favors HCC in particular: intralesional hemorrhage without biopsy, trauma or intervention (easiest on MRI)' },
      { id: 'intralesionalFat', modalities: ['ct', 'mri-eca', 'mri-hba'], label: 'Fat in mass, more than adjacent liver', tooltip: 'Favors HCC in particular: more fat than surrounding liver (signal loss on opposed-phase MRI; macroscopic fat on CT)', cdeElementId: 'RDE91' },
    ],
    favoringBenign: [
      { id: 'parallelsBloodPool', modalities: ['ct', 'mri-eca', 'mri-hba'], label: 'Parallels blood pool', tooltip: 'Enhancement pattern mirroring blood pool (aorta/veins) across all phases' },
      { id: 'undistortedVessels', modalities: ['ct', 'mri-eca', 'mri-hba'], label: 'Undistorted vessels', tooltip: 'Vessels traversing observation without displacement, distortion, or encasement' },
      { id: 'ironInMass', modalities: ['mri-eca', 'mri-hba'], label: 'Iron in mass > liver', tooltip: 'MRI: more iron in the mass than in surrounding liver parenchyma' },
      { id: 'markedT2Hyperintensity', modalities: ['mri-eca', 'mri-hba'], label: 'Marked T2 hyperintensity', tooltip: 'MRI: signal intensity on T2W images approaching that of bile ducts or CSF' },
      { id: 'hbpIsointensity', modalities: ['mri-hba'], label: 'HBP isointensity', tooltip: 'Hepatobiliary agent only: hepatobiliary phase signal intensity identical or nearly identical to surrounding liver', cdeElementId: 'RDE86' },
      { id: 'sizeStability', modalities: ['ct', 'mri-eca', 'mri-hba'], label: 'Size stability >=2 years', tooltip: 'No meaningful size change for 2 years or more without treatment' },
      { id: 'sizeReduction', modalities: ['ct', 'mri-eca', 'mri-hba'], label: 'Size reduction', tooltip: 'Unequivocal spontaneous decrease in size over time, not due to treatment' },
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
        // v2018 threshold growth is >=50% size increase in <=6 months; plain
        // "new" or "increased in size" does not meet it.
        'yes': ['threshold growth'],
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

    // Technique (study-level on the page).
    'modality': {
      options: {
        'mri-hba': ['gadoxetate', 'eovist', 'primovist', 'hepatobiliary agent', 'gd-eob-dtpa'],
        'mri-eca': ['mri', 'magnetic resonance', 'extracellular agent', 'gadobutrol', 'gadoterate'],
        'ct': ['ct', 'computed tomography'],
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

    'anc_hcc_tpHypointensity': {
      options: { yes: ['transitional phase hypointensity', 'hypointense in the transitional phase', 'hypointense on transitional phase'] },
    },
    'anc_hcc_hbpHypointensity': {
      options: { yes: ['hbp hypointensity', 'hepatobiliary phase hypointensity', 'hypointense in the hepatobiliary phase', 'hypointense on hbp'] },
    },
    'anc_hcc_nonenhancingCapsule': {
      options: { yes: ['nonenhancing capsule', 'non-enhancing capsule'] },
    },
    'anc_hcc_bloodProducts': {
      options: { yes: ['blood products', 'intralesional hemorrhage'] },
    },
    'anc_hcc_subthresholdGrowth': {
      options: { yes: ['subthreshold growth'] },
    },

    // --- Ancillary features favoring benign (downgrade) ---
    'anc_benign_sizeStability': {
      options: { yes: ['stable for 2 years', 'stable for two years', 'stable in size for over 2 years', 'stable for over 2 years', 'size stability'] },
    },
    'anc_benign_sizeReduction': {
      options: { yes: ['decreased in size', 'size reduction', 'smaller than prior'] },
    },
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
  },
};
