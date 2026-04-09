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
    id: 'bone-age',
    name: 'Bone Age',
    description: 'Greulich & Pyle bone age assessment with statistical analysis.',
    icon: 'BA',
    path: null,
    status: 'coming-soon',
    bodyParts: ['Bone'],
    modalities: ['XR'],
    specialties: ['Pediatric Radiology'],
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
