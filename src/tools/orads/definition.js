/**
 * O-RADS US v2022 — Ovarian-Adnexal Reporting and Data System (Ultrasound).
 * Decision-tree classification.
 * Reference: Andreotti RF et al. Radiology 2020;294(1):168-185.
 */
export const oradsDefinition = {
  id: 'orads',
  name: 'O-RADS US',
  version: '1.0.0',
  description:
    'Ovarian-Adnexal Reporting and Data System for ultrasound — risk stratification of adnexal masses.',
  cdeSetId: null,

  primaryInputs: [
    {
      id: 'location',
      label: 'Side',
      inputType: 'single-select',
      options: [
        { id: 'right', label: 'Right' },
        { id: 'left', label: 'Left' },
        { id: 'midline', label: 'Midline' },
      ],
    },
    {
      id: 'size',
      label: 'Size',
      inputType: 'float',
      min: 0.1,
      max: 500,
      step: 0.1,
      unit: 'mm',
      unitToggle: true,
      placeholder: 'e.g., 35',
    },
  ],

  // Is this a classic benign lesion?
  classicBenign: {
    id: 'classicBenign',
    label: 'Classic Benign Descriptor',
    tooltip: 'Simple cyst, typical hemorrhagic cyst, dermoid, endometrioma, paraovarian cyst, peritoneal inclusion cyst, hydrosalpinx',
    options: [
      { id: 'no', label: 'No' },
      { id: 'simpleCyst', label: 'Simple Cyst', tooltip: 'Anechoic, thin smooth wall, no solid component, no internal flow' },
      { id: 'hemorrhagicCyst', label: 'Hemorrhagic Cyst', tooltip: 'Reticular pattern of internal echoes (lace-like), no solid component' },
      { id: 'dermoid', label: 'Dermoid', tooltip: 'Echogenic focus with shadowing (dermoid plug/Rokitansky nodule), or diffuse/regional echogenic material' },
      { id: 'endometrioma', label: 'Endometrioma', tooltip: 'Homogeneous low-level echoes (ground glass), no solid component, no color flow within cyst' },
      { id: 'paraovarian', label: 'Paraovarian Cyst', tooltip: 'Separate from ovary, simple cyst in broad ligament' },
      { id: 'hydrosalpinx', label: 'Hydrosalpinx', tooltip: 'Tubular, folded, incomplete septae, cogwheel sign' },
    ],
  },

  // Morphology (if not classic benign)
  morphology: {
    id: 'morphology',
    label: 'Morphology',
    options: [
      { id: 'unilocularSmooth', label: 'Unilocular, Smooth', tooltip: 'Unilocular cyst with smooth inner wall, no solid component' },
      { id: 'unilocularIrregular', label: 'Unilocular, Irregular Inner Wall', tooltip: 'Unilocular cyst with irregular inner wall or solid component <3 mm' },
      { id: 'multilocularSmooth', label: 'Multilocular, Smooth', tooltip: 'Multilocular cyst with smooth inner wall, thin septa, no solid component' },
      { id: 'multilocularIrregular', label: 'Multilocular, Irregular', tooltip: 'Multilocular cyst with irregular inner wall, thick septa, or solid component' },
      { id: 'solidSmooth', label: 'Solid, Smooth', tooltip: 'Solid mass with smooth external contour' },
      { id: 'solidIrregular', label: 'Solid, Irregular', tooltip: 'Solid mass with irregular external contour or papillary projections' },
    ],
  },

  // Color score
  colorScore: {
    id: 'colorScore',
    label: 'Color Score (Doppler)',
    options: [
      { id: '1', label: '1 — No Flow', tooltip: 'No detectable flow' },
      { id: '2', label: '2 — Minimal Flow', tooltip: 'Minimal flow (1-2 small vessels)' },
      { id: '3', label: '3 — Moderate Flow', tooltip: 'Moderate flow (multiple small vessels or one larger vessel)' },
      { id: '4', label: '4 — Abundant Flow', tooltip: 'Very strong / abundant flow (large vessels throughout solid areas)' },
    ],
  },

  // Ascites
  ascites: {
    id: 'ascites',
    label: 'Ascites',
    options: [
      { id: 'absent', label: 'Absent' },
      { id: 'present', label: 'Present' },
    ],
  },

  // Peritoneal nodularity
  peritoneal: {
    id: 'peritoneal',
    label: 'Peritoneal Nodularity',
    options: [
      { id: 'absent', label: 'Absent' },
      { id: 'present', label: 'Present', tooltip: 'Nodular thickening of peritoneum — highly suspicious for carcinomatosis' },
    ],
  },

  parseRules: {
    'size': {
      pattern: /(\d*\.?\d+)\s*(?:mm|cm)/,
      group: 1,
      transform: (m) => {
        const val = parseFloat(m[1]);
        return m[0].includes('cm') ? val * 10 : val;
      },
    },
    'location': {
      options: {
        'right': ['right ovary', 'right adnexa', 'right'],
        'left': ['left ovary', 'left adnexa', 'left'],
      },
    },
  },
};
