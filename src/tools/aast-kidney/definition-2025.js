/**
 * AAST Kidney Organ Injury Scale (2025 update) — definition.
 *
 * Reference: Keihani S, Tominaga GT, Matta R, et al. Kidney organ injury
 *   scaling: 2025 update. J Trauma Acute Care Surg 2025;98(3):448-451.
 *   doi:10.1097/TA.0000000000004509 (Table 1, imaging criteria).
 *
 * Rules from the paper:
 * - Grade by the highest-grade injury; each kidney graded separately.
 * - Multiple injuries are NOT upgraded (unlike 2018).
 * - "Without active bleeding" qualifiers are handled by max-grade: active
 *   bleeding is itself Grade IV, so any lesser finding + bleeding = IV.
 *   Two combinations are Grade V and are encoded as escalations:
 *   complete/near-complete infarction + active bleeding, MFK + active bleeding.
 * - Main renal artery/vein laceration or transection is defined "with active
 *   bleeding" (uncontained); contained vascular injuries are Grade III.
 *
 * Definitions (Table 1 footnotes) are surfaced as hover tooltips.
 * Labels are ASCII only and avoid HL7 delimiters.
 */

const HRD = 'Hematoma rim distance: longest perpendicular distance from the renal parenchymal border to the hematoma border, on axial CT, within the superior and inferior kidney margins. Includes subcapsular hematoma; excludes thin slivers.';
const ACTIVE = 'Active bleeding: vascular contrast extravasation outside a vessel on arterial, venous, or delayed phase.';
const LAC = 'Laceration length is the longest length on a single axial image.';

// Unit-aware size helpers for the numeric parse patterns.
const cm = (m) => (/mm/i.test(m[2]) ? parseFloat(m[1]) / 10 : parseFloat(m[1]));
// The lookbehinds skip comparison phrasing ("<3.5 cm", "less than 2.5 cm"):
// that is a threshold, not a measurement, and the keywords cover it.
const NUM = String.raw`(?<![<>]\s*)(?<!(?:less|greater|more) than\s*)(\d+(?:\.\d+)?)\s*-?\s*(cm|mm)\b`;

// "2 cm laceration" / "laceration measuring 2 cm"
const lacBefore = new RegExp(String.raw`\b` + NUM + String.raw`(?:\s+deep)?\s+laceration`, 'i');
const lacAfter = new RegExp(String.raw`laceration(?:,|\s+(?:measuring|of))?\s+(?:approximately\s+)?` + NUM, 'i');
// "perinephric hematoma measuring 4 cm", "hematoma rim distance of 3.5 cm", "HRD 4 cm"
const periSize = new RegExp(String.raw`peri(?:nephric|renal)\s+(?:hematoma|blood)[^.]*?` + NUM, 'i');
const hrdSize = new RegExp(String.raw`(?:hematoma rim distance|\bHRD\b)[^.]*?` + NUM, 'i');
const subSize = new RegExp(String.raw`subcapsular\s+hematoma[^.]*?` + NUM, 'i');
// Same phrases with no size in the sentence
const periNoSize = /peri(?:nephric|renal)\s+(?:hematoma|blood)(?![^.]*\d+(?:\.\d+)?\s*-?\s*(?:cm|mm)\b)/i;
const subNoSize = /subcapsular\s+hematoma(?![^.]*\d+(?:\.\d+)?\s*-?\s*(?:cm|mm)\b)/i;

export const aastKidney2025Definition = {
  id: 'aast-kidney',
  name: 'AAST Kidney',
  organ: 'Kidney',
  scaleVersion: '2025',
  advanceMultipleInjuries: false,
  escalations: [
    { allOf: ['active-bleeding'], anyOf: ['infarct-complete', 'mfk'], grade: 5 },
  ],

  categories: [
    {
      id: 'hematoma',
      label: 'Hematoma',
      findings: [
        { id: 'sub-lt35', label: 'Subcapsular hematoma <3.5 cm', grade: 1, title: HRD },
        { id: 'hrd-lt35', label: 'Perirenal hematoma, HRD <3.5 cm', grade: 2, title: HRD },
        { id: 'hrd-ge35', label: 'Hematoma with HRD >=3.5 cm (perirenal or subcapsular)', grade: 3, title: HRD },
        { id: 'pararenal', label: 'Pararenal extension of hematoma', grade: 4,
          title: 'Crosses the right border of the IVC (right kidney) or left border of the aorta (left kidney), or extends below the aortic bifurcation.' },
      ],
    },
    {
      id: 'parenchyma',
      label: 'Parenchyma',
      findings: [
        { id: 'contusion', label: 'Parenchymal contusion without laceration', grade: 1 },
        { id: 'lac-lt25', label: 'Laceration <2.5 cm', grade: 2, title: LAC },
        { id: 'lac-ge25', label: 'Laceration >=2.5 cm', grade: 3, title: LAC },
        { id: 'mfk', label: 'Multifragmented kidney', grade: 4,
          title: 'Three or more injured parenchymal segments with fluid or blood between. Grade V if active bleeding is also present.' },
      ],
    },
    {
      id: 'collecting',
      label: 'Collecting System',
      findings: [
        { id: 'collecting-extrav', label: 'Laceration into collecting system and/or urinary extravasation', grade: 3,
          title: 'Urinary extravasation is diagnosed on the excretory (delayed) phase.' },
        { id: 'upj', label: 'Complete or near-complete ureteropelvic junction disruption', grade: 4 },
      ],
    },
    {
      id: 'vascular',
      label: 'Vascular',
      findings: [
        { id: 'infarct-partial', label: 'Partial kidney infarction', grade: 3 },
        { id: 'contained', label: 'Contained vascular injury, not actively bleeding', grade: 3,
          title: 'Pseudoaneurysm, arteriovenous fistula, dissection, thrombosis, intimal flap, or mural hematoma.' },
        { id: 'active-bleeding', label: 'Active bleeding from kidney', grade: 4, title: ACTIVE },
        { id: 'infarct-complete', label: 'Complete or near-complete kidney infarction', grade: 4,
          title: 'More than 95% of parenchyma devascularized. Grade V if active bleeding is also present.' },
        { id: 'main-vessel', label: 'Main renal artery or vein laceration or transection, actively bleeding', grade: 5,
          title: 'Uncontained main vessel injury. Contained main vessel injuries (e.g. thrombosis, dissection) are Grade III.' },
      ],
    },
  ],

  // Hand-written rules for dictation phrasing. Numeric patterns route sizes
  // to the 2.5 cm laceration and 3.5 cm HRD cutoffs; a size exactly at the
  // cutoff goes to the higher grade, as the table defines (>=).
  // Negated mentions ("no urinary extravasation", "without active bleeding")
  // are skipped by the shared parser (findNegationRanges in parser.js).
  parseRules: {
    selectedFindings: {
      multi: true,
      options: {
        'sub-lt35': {
          keywords: ['Subcapsular hematoma <3.5 cm', 'small subcapsular hematoma'],
          patterns: [
            { re: subNoSize },
            { re: subSize, test: (m) => cm(m) < 3.5 },
          ],
        },
        'hrd-lt35': {
          keywords: ['Perirenal hematoma, HRD <3.5 cm', 'small perinephric hematoma', 'small perirenal hematoma'],
          patterns: [
            { re: periNoSize },
            { re: periSize, test: (m) => cm(m) < 3.5 },
            { re: hrdSize, test: (m) => cm(m) < 3.5 },
          ],
        },
        'hrd-ge35': {
          keywords: ['Hematoma with HRD >=3.5 cm', 'large perinephric hematoma', 'large perirenal hematoma'],
          patterns: [
            { re: periSize, test: (m) => cm(m) >= 3.5 },
            { re: hrdSize, test: (m) => cm(m) >= 3.5 },
            { re: subSize, test: (m) => cm(m) >= 3.5 },
          ],
        },
        'pararenal': ['Pararenal extension of hematoma', 'pararenal hematoma', 'pararenal extension'],

        'contusion': ['Parenchymal contusion without laceration', 'renal contusion', 'parenchymal contusion'],
        'lac-lt25': {
          keywords: ['Laceration <2.5 cm', 'superficial laceration', 'small laceration'],
          patterns: [
            { re: lacBefore, test: (m) => cm(m) < 2.5 },
            { re: lacAfter, test: (m) => cm(m) < 2.5 },
          ],
        },
        'lac-ge25': {
          keywords: ['Laceration >=2.5 cm', 'deep laceration', 'large laceration'],
          patterns: [
            { re: lacBefore, test: (m) => cm(m) >= 2.5 },
            { re: lacAfter, test: (m) => cm(m) >= 2.5 },
          ],
        },
        'mfk': ['Multifragmented kidney', 'multifragmented', 'multi-fragmented', 'shattered kidney', 'fragmented kidney'],

        'collecting-extrav': [
          'Laceration into collecting system and/or urinary extravasation',
          'urinary extravasation', 'urine leak', 'urinoma',
          'into the collecting system', 'collecting system injury', 'collecting system rupture',
          'renal pelvis laceration',
        ],
        'upj': [
          'Complete or near-complete ureteropelvic junction disruption',
          'ureteropelvic junction disruption', 'ureteropelvic junction avulsion',
          'upj disruption', 'upj avulsion',
        ],

        'infarct-partial': [
          'Partial kidney infarction', 'partial infarct', 'segmental infarct', 'wedge-shaped infarct',
        ],
        'contained': [
          'Contained vascular injury, not actively bleeding', 'pseudoaneurysm', 'arteriovenous fistula',
          'renal avf', 'intimal flap', 'mural hematoma', 'contained vascular injury',
        ],
        'active-bleeding': [
          'Active bleeding from kidney', 'active bleeding', 'active hemorrhage',
          'active arterial extravasation', 'active extravasation', 'vascular contrast extravasation',
        ],
        'infarct-complete': [
          'Complete or near-complete kidney infarction', 'global infarct', 'complete infarct',
          'near-complete infarct', 'devascularized kidney', 'global devascularization',
        ],
        'main-vessel': [
          'Main renal artery or vein laceration or transection, actively bleeding',
          'main renal artery laceration', 'main renal artery transection',
          'main renal vein laceration', 'main renal vein transection',
          'renal pedicle avulsion', 'renal artery avulsion',
        ],
      },
    },
  },
  parseSegmentation: { type: 'laterality' },
};
