/**
 * Central tools registry — acts as a local database for tool metadata.
 * When a real database is added, replace this file with an API call.
 *
 * Each tool declares its labels for body parts, modalities, and specialties.
 * These drive the landing page display and future search/filter/sort.
 */

// --- Standard label options (add to these as new tools introduce new values) ---

export const BODY_PARTS = [
  'Thyroid',
  'Liver',
  'Kidney',
  'Adrenal',
  'Breast',
  'Brain',
  'Spine',
  'Bone',
  'Lung',
  'Heart',
  'Prostate',
  'Ovary',
  'Pancreas',
  'Lymph Node',
];

export const MODALITIES = [
  { code: 'CT', label: 'CT' },
  { code: 'MR', label: 'MRI' },
  { code: 'US', label: 'Ultrasound' },
  { code: 'XR', label: 'Radiograph' },
  { code: 'MG', label: 'Mammography' },
  { code: 'NM', label: 'Nuclear Medicine' },
  { code: 'PT', label: 'PET' },
  { code: 'FL', label: 'Fluoroscopy' },
];

export const SPECIALTIES = [
  'Neuroradiology',
  'Musculoskeletal',
  'Body Imaging',
  'Breast Imaging',
  'Chest Radiology',
  'Cardiac Imaging',
  'Interventional Radiology',
  'Pediatric Radiology',
  'Emergency Radiology',
  'Nuclear Medicine',
  'Oncologic Imaging',
];

// --- Tool entries ---

export const toolsRegistry = [
  {
    id: 'pirads',
    name: 'PI-RADS',
    description: 'Prostate MRI risk stratification for clinically significant prostate cancer.',
    icon: 'PI',
    path: '/src/tools/pirads/pirads.html',
    status: 'active',
    bodyParts: ['Prostate'],
    modalities: ['MR'],
    specialties: ['Body Imaging', 'Oncologic Imaging'],
    cdeSetId: null,
  },
  {
    id: 'orads',
    name: 'O-RADS',
    description: 'Ovarian-adnexal mass risk stratification on ultrasound.',
    icon: 'OR',
    path: '/src/tools/orads/orads.html',
    status: 'active',
    bodyParts: ['Ovary'],
    modalities: ['US'],
    specialties: ['Body Imaging', 'Oncologic Imaging'],
    cdeSetId: null,
  },
  {
    id: 'lungrads',
    name: 'Lung-RADS',
    description: 'Lung cancer screening CT structured reporting and risk stratification.',
    icon: 'LR',
    path: '/src/tools/lungrads/lungrads.html',
    status: 'active',
    bodyParts: ['Lung'],
    modalities: ['CT'],
    specialties: ['Chest Radiology', 'Oncologic Imaging'],
    cdeSetId: null,
  },
  {
    id: 'tirads',
    name: 'TI-RADS',
    description: 'Thyroid nodule risk stratification based on ultrasound features.',
    icon: 'TI',
    path: '/src/tools/tirads/tirads.html',
    status: 'active',
    bodyParts: ['Thyroid'],
    modalities: ['US'],
    specialties: ['Body Imaging', 'Oncologic Imaging'],
    cdeSetId: 'RDES152',
  },
  {
    id: 'recist',
    name: 'RECIST 1.1',
    description: 'Response evaluation criteria in solid tumors — treatment response assessment.',
    icon: 'RC',
    path: '/src/tools/recist/recist.html',
    status: 'active',
    bodyParts: [],
    modalities: ['CT', 'MR'],
    specialties: ['Oncologic Imaging', 'Body Imaging'],
    cdeSetId: null,
  },
  {
    id: 'adrenal-washout',
    name: 'Adrenal Washout',
    description: 'Absolute and relative washout percentages for adrenal lesion characterization.',
    icon: 'AW',
    path: '/src/tools/adrenal-washout/adrenal-washout.html',
    status: 'active',
    bodyParts: ['Adrenal'],
    modalities: ['CT'],
    specialties: ['Body Imaging'],
    cdeSetId: null,
  },
  {
    id: 'bosniak',
    name: 'Bosniak',
    description: 'Bosniak v2019 classification for cystic renal masses on CT and MRI.',
    icon: 'BK',
    path: '/src/tools/bosniak/bosniak.html',
    status: 'active',
    bodyParts: ['Kidney'],
    modalities: ['CT', 'MR'],
    specialties: ['Body Imaging'],
    cdeSetId: null,
  },
  {
    id: 'fleischner',
    name: 'Fleischner',
    description: 'Fleischner Society 2017 guidelines for incidental pulmonary nodule management.',
    icon: 'FL',
    path: '/src/tools/fleischner/fleischner.html',
    status: 'active',
    bodyParts: ['Lung'],
    modalities: ['CT'],
    specialties: ['Chest Radiology', 'Body Imaging'],
    cdeSetId: null,
  },
  {
    id: 'deauville',
    name: 'Deauville',
    description: 'Deauville 5-point scale — PET/CT response assessment for FDG-avid lymphoma.',
    icon: 'DV',
    path: '/src/tools/deauville/deauville.html',
    status: 'active',
    bodyParts: [],
    modalities: ['PT'],
    specialties: ['Nuclear Medicine', 'Oncologic Imaging'],
    cdeSetId: null,
  },
  {
    id: 'curie',
    name: 'MIBG Score',
    description: 'Curie and SIOPEN semi-quantitative MIBG scoring for neuroblastoma.',
    icon: 'MB',
    path: '/src/tools/curie/curie.html',
    status: 'active',
    bodyParts: ['Bone'],
    modalities: ['NM'],
    specialties: ['Pediatric Radiology', 'Nuclear Medicine', 'Oncologic Imaging'],
    cdeSetId: null,
  },
  {
    id: 'idrf',
    name: 'IDRF',
    description: 'Neuroblastoma Image-Defined Risk Factors — INRG staging (L1 vs L2).',
    icon: 'NB',
    path: '/src/tools/idrf/idrf.html',
    status: 'active',
    bodyParts: ['Adrenal'],
    modalities: ['CT', 'MR'],
    specialties: ['Pediatric Radiology', 'Oncologic Imaging'],
    cdeSetId: null,
  },
  {
    id: 'pretext',
    name: 'PRETEXT',
    description: 'PRETEXT staging for pediatric hepatoblastoma — liver section involvement and annotation factors.',
    icon: 'PX',
    path: '/src/tools/pretext/pretext.html',
    status: 'active',
    bodyParts: ['Liver'],
    modalities: ['CT', 'MR'],
    specialties: ['Pediatric Radiology', 'Oncologic Imaging', 'Body Imaging'],
    cdeSetId: 'RDES358',
  },
  {
    id: 'reimers',
    name: "Reimers' Index",
    description: "Reimers' migration index — proximal femoral migration percentage for hip surveillance.",
    icon: 'RI',
    path: '/src/tools/reimers/reimers.html',
    status: 'active',
    bodyParts: ['Bone'],
    modalities: ['XR'],
    specialties: ['Pediatric Radiology', 'Musculoskeletal'],
    cdeSetId: null,
  },
  {
    id: 'leglength',
    name: 'Leg Length',
    description: 'Lower extremity length discrepancy with alignment and physeal status.',
    icon: 'LL',
    path: '/src/tools/leglength/leglength.html',
    status: 'active',
    bodyParts: ['Bone'],
    modalities: ['XR'],
    specialties: ['Pediatric Radiology', 'Musculoskeletal'],
    cdeSetId: null,
  },
  {
    id: 'lirads',
    name: 'LI-RADS',
    description: 'Liver imaging reporting and data system for hepatocellular carcinoma.',
    icon: 'LI',
    path: '/src/tools/lirads/lirads.html',
    status: 'active',
    bodyParts: ['Liver'],
    modalities: ['CT', 'MR'],
    specialties: ['Body Imaging', 'Oncologic Imaging'],
    cdeSetId: 'RDES5',
  },
];

/**
 * Get all unique labels currently in use across tools.
 * Useful for building filter UI.
 */
export function getActiveLabels() {
  const bodyParts = new Set();
  const modalities = new Set();
  const specialties = new Set();

  for (const tool of toolsRegistry) {
    tool.bodyParts?.forEach((b) => bodyParts.add(b));
    tool.modalities?.forEach((m) => modalities.add(m));
    tool.specialties?.forEach((s) => specialties.add(s));
  }

  return {
    bodyParts: [...bodyParts].sort(),
    modalities: [...modalities].sort(),
    specialties: [...specialties].sort(),
  };
}

/**
 * Get the display label for a modality code.
 */
export function getModalityLabel(code) {
  return MODALITIES.find((m) => m.code === code)?.label || code;
}
