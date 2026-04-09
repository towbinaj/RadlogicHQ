/**
 * PRETEXT — PRE-Treatment EXTent of disease staging for pediatric liver tumors.
 * Decision-tree / lookup-table classification.
 * CDE set RDES358 (https://radelement.org/home/sets/set/RDES358)
 *
 * References:
 * - Towbin AJ et al. Radiology 2018;289(3):600-616.
 * - SIOPEL / COG hepatoblastoma imaging guidelines.
 */
export const pretextDefinition = {
  id: 'pretext',
  name: 'PRETEXT',
  version: '1.0.0',
  description:
    'PRETEXT staging for pediatric hepatoblastoma — liver section involvement and annotation factors.',
  cdeSetId: 'RDES358',

  // Five liver sections
  sections: [
    { id: 'caudate', label: 'Caudate (C)', cdeElementId: 'RDE2558' },
    { id: 'rightPosterior', label: 'Right Posterior (RP)', cdeElementId: 'RDE2550' },
    { id: 'rightAnterior', label: 'Right Anterior (RA)', cdeElementId: 'RDE2550' },
    { id: 'leftMedial', label: 'Left Medial (LM)', cdeElementId: 'RDE2550' },
    { id: 'leftLateral', label: 'Left Lateral (LL)', cdeElementId: 'RDE2550' },
  ],

  // Annotation factors
  annotations: [
    {
      id: 'V',
      label: 'V — Hepatic Venous / IVC',
      tooltip: 'V-positive: obliteration, encasement (>50%), or tumor thrombus of retrohepatic IVC or all 3 major hepatic veins',
      cdeElementId: 'RDE2553',
    },
    {
      id: 'P',
      label: 'P — Portal Venous',
      tooltip: 'P-positive: obliteration, encasement (>50%), or thrombus of main portal vein and/or both right and left portal veins',
      cdeElementId: 'RDE2554',
    },
    {
      id: 'E',
      label: 'E — Extrahepatic',
      tooltip: 'E-positive: tumor crosses tissue planes, is surrounded by normal tissue >180°, or peritoneal nodules (≥10 mm single or ≥2 nodules ≥5 mm)',
      cdeElementId: 'RDE2555',
    },
    {
      id: 'F',
      label: 'F — Multifocal',
      tooltip: 'F-positive: two or more discrete hepatic tumors with normal intervening liver tissue',
      cdeElementId: 'RDE2556',
    },
    {
      id: 'R',
      label: 'R — Tumor Rupture',
      tooltip: 'R-positive: free abdominal/pelvic fluid with hemorrhage indicators (complexity, high density >25 HU, MRI blood signal, or capsular defect)',
      cdeElementId: 'RDE2557',
    },
    {
      id: 'N',
      label: 'N — Nodal Metastases',
      tooltip: 'N-positive: lymph node short axis >1 cm (portocaval >1.5 cm), or spherical shape with loss of fatty hilum',
      cdeElementId: 'RDE2559',
    },
    {
      id: 'M',
      label: 'M — Distant Metastases',
      tooltip: 'M-positive: ≥1 non-calcified pulmonary nodule ≥5 mm, or ≥2 non-calcified pulmonary nodules ≥3 mm, or pathologically-proven metastatic disease',
      cdeElementId: 'RDE2560',
    },
  ],

  annotationOptions: [
    { id: 'yes', label: 'Yes' },
    { id: 'no', label: 'No' },
    { id: 'unknown', label: 'Unknown' },
  ],

  // Size inputs
  primaryInputs: [
    {
      id: 'maxDiameter',
      label: 'Max Axial Diameter',
      inputType: 'float',
      min: 0.1,
      max: 300,
      step: 0.1,
      unit: 'mm',
      unitToggle: true,
      placeholder: 'e.g., 80',
      cdeElementId: 'RDE2551',
    },
  ],

  parseRules: {},
};
