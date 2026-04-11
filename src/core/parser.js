/**
 * Generic findings text parser.
 *
 * Two rule sources, merged at parse time:
 *   1. Auto-generated from definition labels (sections, primaryInputs, categories, etc.)
 *   2. Hand-written parseRules in definition.js (override auto-generated on conflict)
 *
 * Synonym dictionary expands option labels with common radiology variants.
 */

// ============================================================
// SYNONYM DICTIONARY
// Maps lowercase label fragments → additional search keywords.
// Applied during auto-generation to expand matching coverage.
// ============================================================

const SYNONYMS = {
  // --- Laterality ---
  right: ['right-sided', 'rt'],
  left: ['left-sided', 'lt'],
  bilateral: ['both', 'bilaterally', 'b/l'],

  // --- Sex ---
  male: ['m', 'boy'],
  female: ['f', 'girl'],

  // --- Echogenicity ---
  anechoic: ['anechoic'],
  hyperechoic: ['hyper-echoic', 'echogenic', 'hyperechogenic'],
  isoechoic: ['iso-echoic', 'isoechogenic'],
  hypoechoic: ['hypo-echoic', 'hypoechogenic'],
  'very hypoechoic': ['markedly hypoechoic', 'very hypo-echoic'],

  // --- Morphology / structure ---
  solid: ['solid component', 'predominantly solid'],
  cystic: ['cystic component', 'predominantly cystic'],
  'mixed cystic and solid': ['mixed solid and cystic', 'partially cystic', 'complex'],
  spongiform: ['spongiform appearance'],
  calcification: ['calcified', 'calcifications'],
  'no calcification': ['no calcifications', 'without calcification'],
  'ground glass': ['ggo', 'ground-glass', 'ggn', 'nonsolid', 'non-solid'],

  // --- Margins ---
  'smooth margin': ['well-defined', 'well defined', 'smooth margins', 'circumscribed'],
  'irregular margin': ['irregular margins', 'poorly defined', 'ill-defined', 'ill defined', 'spiculated'],
  lobulated: ['lobulated margin', 'lobulated margins'],
  smooth: ['well-defined', 'well defined', 'circumscribed'],

  // --- Enhancement ---
  enhancing: ['enhancement', 'enhances'],
  'no enhancement': ['non-enhancing', 'nonenhancing', 'without enhancement'],
  'measurable enhancement': ['measurable', 'definite enhancement'],
  'perceived enhancement': ['perceived', 'subjective enhancement'],
  aphe: ['arterial phase hyperenhancement', 'arterial enhancement', 'non-rim aphe'],
  washout: ['venous washout', 'portal venous washout', 'nonperipheral washout'],

  // --- Vascularity / Doppler ---
  'active bleeding': ['active extravasation', 'active hemorrhage', 'contrast extravasation'],
  pseudoaneurysm: ['pseudo-aneurysm', 'psudoaneurysm'],
  'arteriovenous fistula': ['av fistula', 'avf'],
  'no flow': ['avascular', 'no vascularity', 'no doppler flow'],

  // --- Sizes / descriptors ---
  subcapsular: ['sub-capsular'],
  intraparenchymal: ['intra-parenchymal'],
  'taller than wide': ['taller-than-wide', 'ap dimension greater', 'anteroposterior > transverse'],
  'wider than tall': ['wider-than-tall'],

  // --- Yes/No / Present/Absent ---
  present: ['positive', 'identified', 'seen', 'noted', 'demonstrated'],
  absent: ['negative', 'not identified', 'not seen', 'not noted', 'none', 'no evidence'],

  // --- Severity ---
  mild: ['mildly', 'slight', 'slightly', 'minimal', 'minor'],
  moderate: ['moderately', 'intermediate'],
  severe: ['severely', 'marked', 'markedly', 'significant', 'significantly', 'advanced'],
  normal: ['unremarkable', 'within normal limits', 'wnl', 'no abnormality'],

  // --- Response categories ---
  'complete response': ['complete remission', 'cr'],
  'partial response': ['partial remission', 'pr'],
  'stable disease': ['sd', 'no change'],
  'progressive disease': ['pd', 'progression'],
  stable: ['unchanged', 'no interval change', 'no change'],
  growing: ['enlarging', 'increased in size', 'increasing', 'interval growth'],
  'new nodule': ['new finding', 'new lesion', 'interval development'],

  // --- Injury / trauma ---
  hematoma: ['haematoma'],
  laceration: ['lacerations', 'tear'],
  'parenchymal disruption': ['parenchymal destruction', 'devascularization'],
  devascularization: ['devascularized', 'avascular segment'],
  contusion: ['bruise', 'bruising'],
  transection: ['complete transection', 'complete disruption'],

  // --- Grades (Roman ↔ Arabic) ---
  'grade i': ['grade 1'],
  'grade ii': ['grade 2'],
  'grade iii': ['grade 3'],
  'grade iv': ['grade 4'],
  'grade v': ['grade 5'],
  'grade 0': ['grade zero'],
  'grade 1': ['grade i'],
  'grade 2': ['grade ii'],
  'grade 3': ['grade iii'],
  'grade 4': ['grade iv'],
  'grade 5': ['grade v'],

  // --- Stages (Lugano) ---
  'stage i': ['stage 1', 'ann arbor i'],
  'stage ii': ['stage 2', 'ann arbor ii'],
  'stage iii': ['stage 3', 'ann arbor iii'],
  'stage iv': ['stage 4', 'ann arbor iv'],

  // --- Types (Salter-Harris, Graf) ---
  'type i': ['type 1'],
  'type ii': ['type 2'],
  'type iii': ['type 3'],
  'type iv': ['type 4'],
  'type v': ['type 5'],

  // --- Common modalities ---
  mammography: ['mammo', 'mammogram'],
  ultrasound: ['us', 'sonography', 'sonographic'],
  mri: ['mr', 'magnetic resonance'],

  // --- Hydronephrosis ---
  hydronephrosis: ['hydroureteronephrosis', 'collecting system dilation', 'pelvicaliectasis', 'pyelectasis'],
  ventriculomegaly: ['dilated ventricle', 'dilated ventricles', 'ventricular dilation', 'ventricular dilatation'],

  // --- Vascular ---
  stenosis: ['stenotic', 'narrowing'],
  occlusion: ['occluded', 'total occlusion', 'complete occlusion'],

  // --- PET/CT ---
  'no uptake': ['no fdg uptake', 'no metabolic activity', 'no hypermetabolism'],
  mediastinum: ['mediastinal blood pool', 'mediastinal'],
  uptake: ['fdg uptake', 'metabolic activity', 'hypermetabolism', 'fdg avid', 'avidity'],

  // --- Lymphoma ---
  'complete metabolic response': ['cmr'],
  'b symptoms': ['fever', 'night sweats', 'weight loss'],
  hodgkin: ['hodgkin lymphoma', 'hl', 'hodgkin disease'],
  'non-hodgkin': ['nhl', 'non-hodgkin lymphoma'],
  'extranodal': ['extranodal extension', 'extranodal involvement'],
  'bulky disease': ['bulky', 'bulky mass'],
  splenic: ['splenic involvement', 'spleen involvement'],

  // --- Bone / MSK ---
  'coxa valga': ['coxa valga alignment'],
  osteophyte: ['osteophytes', 'bone spur', 'bone spurs', 'marginal osteophyte'],
  'joint space narrowing': ['jsn', 'joint space loss', 'narrowed joint space'],
  subluxation: ['subluxed', 'partial dislocation'],
  dislocation: ['dislocated', 'complete dislocation'],
  dysplasia: ['dysplastic'],
  kyphosis: ['kyphotic', 'thoracic kyphosis', 'increased kyphosis'],
  lordosis: ['lordotic', 'lumbar lordosis'],
  scoliosis: ['scoliotic', 'curvature'],
  dextroscoliosis: ['dextro', 'rightward curvature', 'dextro-convex'],
  levoscoliosis: ['levo', 'leftward curvature', 'levo-convex'],
  valgus: ['valgus alignment', 'valgus deformity'],
  varus: ['varus alignment', 'varus deformity'],

  // --- Salter-Harris ---
  separation: ['physeal separation', 'physis separation'],

  // --- Pectus ---
  'pectus excavatum': ['funnel chest', 'pectus'],

  // --- Prostate (PI-RADS) ---
  'peripheral zone': ['pz'],
  'transition zone': ['tz'],
  'central zone': ['cz'],
  'anterior fibromuscular stroma': ['afs', 'anterior fibromuscular'],
  'extraprostatic extension': ['epe', 'extracapsular extension', 'ece'],
  'diffusion restriction': ['restricted diffusion', 'diffusion-weighted', 'dwi', 'low adc'],

  // --- LI-RADS ---
  'threshold growth': ['interval growth', 'new threshold growth'],
  capsule: ['capsule appearance', 'enhancing capsule', 'tumor capsule'],

  // --- NI-RADS ---
  recurrence: ['recurrent', 'recurrent tumor', 'tumor recurrence'],

  // --- Head & neck / Neuro ---
  'caudate': ['caudate head', 'caudate nucleus'],
  'lentiform': ['lentiform nucleus', 'putamen', 'globus pallidus'],
  'insular': ['insular ribbon', 'insular cortex', 'insula'],
  'internal capsule': ['posterior limb internal capsule'],

  // --- IDRF / Neuroblastoma ---
  encasement: ['encased', 'encasing', 'vessel encasement'],
  infiltration: ['infiltrating', 'infiltrative'],

  // --- Fetal ---
  'biparietal diameter': ['bpd'],
  'cisterna magna': ['cm depth', 'posterior fossa fluid'],
  'cerebellar': ['cerebellar diameter', 'tcd', 'cerebellar transverse diameter'],
  'corpus callosum': ['cc length', 'callosal'],

  // --- Calcium scoring ---
  calcium: ['calcification', 'coronary calcium', 'cac'],

  // --- Nodule multiplicity ---
  single: ['solitary', 'single nodule'],
  multiple: ['multifocal', 'multiple nodules', 'numerous'],

  // --- Ascites / fluid ---
  ascites: ['free fluid', 'peritoneal fluid', 'abdominal fluid'],

  // --- AAST specific ---
  'shattered': ['shattered kidney', 'shattered spleen', 'complete fragmentation'],
};

/**
 * Get synonyms for a label string. Checks each synonym key as a substring.
 * @param {string} label - Option label
 * @returns {string[]} Additional keywords
 */
function getSynonyms(label) {
  const lower = label.toLowerCase();
  const extras = [];
  for (const [key, syns] of Object.entries(SYNONYMS)) {
    if (lower.includes(key) || lower === key) {
      extras.push(...syns);
    }
  }
  return extras;
}

// ============================================================
// AUTO-GENERATE PARSE RULES FROM DEFINITION
// ============================================================

/**
 * Build parse rules automatically from a tool definition's structure.
 * Examines sections, primaryInputs, categories, grades, scores, and
 * other common definition patterns.
 *
 * @param {Object} def - Tool definition
 * @returns {Object} Auto-generated parseRules (same format as hand-written)
 */
export function buildParseRules(def) {
  const rules = {};

  // --- Point-based sections (TI-RADS style) ---
  if (def.sections) {
    for (const section of def.sections) {
      if (!section.options?.length) continue;
      const isMulti = section.inputType === 'multi-select';
      const optMap = {};
      for (const opt of section.options) {
        const keywords = [opt.label, ...getSynonyms(opt.label)];
        optMap[opt.id] = keywords;
      }
      rules[section.id] = isMulti
        ? { multi: true, options: optMap }
        : { options: optMap };
    }
  }

  // --- Primary inputs ---
  if (def.primaryInputs) {
    for (const input of def.primaryInputs) {
      if (input.inputType === 'single-select' && input.options?.length) {
        const optMap = {};
        for (const opt of input.options) {
          optMap[opt.id] = [opt.label, ...getSynonyms(opt.label)];
        }
        rules[input.id] = { options: optMap };
      } else if (input.inputType === 'float' || input.inputType === 'integer') {
        const label = escapeRegex(input.label.toLowerCase());
        const unit = input.unit || 'mm';
        rules[input.id] = {
          pattern: new RegExp(`(?:${label})[:\\s]*(\\d*\\.?\\d+)\\s*(?:${unit})?`, 'i'),
          group: 1,
          transform: (m) => parseFloat(m[1]),
        };
      }
    }
  }

  // --- Additional inputs ---
  if (def.additionalInputs) {
    for (const input of def.additionalInputs) {
      if (input.inputType === 'single-select' && input.options?.length) {
        const optMap = {};
        for (const opt of input.options) {
          optMap[opt.id] = [opt.label, ...getSynonyms(opt.label)];
        }
        rules[input.id] = { options: optMap };
      }
    }
  }

  // --- Categories with findings (AAST style) ---
  if (def.categories && def.categories[0]?.findings) {
    // Multi-select: match finding labels
    const optMap = {};
    for (const cat of def.categories) {
      for (const finding of cat.findings) {
        optMap[finding.id] = [finding.label, ...getSynonyms(finding.label)];
      }
    }
    rules.selectedFindings = { multi: true, options: optMap };
  }

  // --- Flat categories (BI-RADS style: array of {id, label}) ---
  if (def.categories && def.categories[0]?.management && !def.categories[0]?.findings) {
    const optMap = {};
    for (const cat of def.categories) {
      // Use both the full label and just the ID as keywords
      const keywords = [cat.label, cat.id, ...getSynonyms(cat.label)];
      optMap[cat.id] = keywords;
    }
    rules.category = { options: optMap };
  }

  // --- Grades (VUR style: array of {id, label}) ---
  if (def.grades) {
    const optMap = {};
    for (const grade of def.grades) {
      optMap[grade.id] = [grade.label, grade.id, ...getSynonyms(grade.label)];
    }
    rules.grade = { options: optMap };
  }

  // --- Scores (Deauville style) ---
  if (def.scores) {
    const optMap = {};
    for (const score of def.scores) {
      const keywords = [score.label, score.shortLabel || score.id];
      if (score.interpretation) keywords.push(score.interpretation);
      keywords.push(...getSynonyms(score.label));
      optMap[score.id] = keywords;
    }
    rules.score = { options: optMap };
  }

  // --- Named option groups (PI-RADS t2Score, dwiScore, dce, etc.) ---
  // Look for top-level objects with { id, options: [...] } pattern
  for (const [key, val] of Object.entries(def)) {
    if (rules[key]) continue; // Already handled
    if (val && typeof val === 'object' && !Array.isArray(val) && val.id && val.options && Array.isArray(val.options)) {
      const optMap = {};
      for (const opt of val.options) {
        const keywords = [opt.label];
        if (opt.tooltip) keywords.push(opt.tooltip);
        keywords.push(...getSynonyms(opt.label));
        optMap[opt.id] = keywords;
      }
      rules[val.id] = { options: optMap };
    }
  }

  // --- Side/laterality options (common pattern: sideOptions, lateralityOptions) ---
  const sideArrays = ['sideOptions', 'lateralityOptions'];
  for (const key of sideArrays) {
    if (def[key] && Array.isArray(def[key])) {
      const fieldId = key === 'lateralityOptions' ? 'laterality' : 'side';
      if (rules[fieldId]) continue;
      const optMap = {};
      for (const opt of def[key]) {
        optMap[opt.id] = [opt.label, ...getSynonyms(opt.label)];
      }
      rules[fieldId] = { options: optMap };
    }
  }

  // --- Modality options ---
  if (def.modalityOptions && Array.isArray(def.modalityOptions)) {
    const optMap = {};
    for (const opt of def.modalityOptions) {
      optMap[opt.id] = [opt.label, ...getSynonyms(opt.label)];
    }
    rules.modality = { options: optMap };
  }

  // --- Timing options ---
  if (def.timingOptions && Array.isArray(def.timingOptions)) {
    const optMap = {};
    for (const opt of def.timingOptions) {
      optMap[opt.id] = [opt.label, ...getSynonyms(opt.label)];
    }
    rules.timing = { options: optMap };
  }

  // --- IDRF-style factor groups ---
  if (def.idrfGroups) {
    const optMap = {};
    for (const group of def.idrfGroups) {
      for (const factor of group.factors) {
        optMap[factor.id] = [factor.label, ...getSynonyms(factor.label)];
      }
    }
    rules.selectedFactors = { multi: true, options: optMap };
  }

  return rules;
}

// ============================================================
// MERGE RULES: auto-generated + hand-written (hand-written wins)
// ============================================================

function mergeRules(auto, manual) {
  if (!manual || Object.keys(manual).length === 0) return auto;
  if (!auto || Object.keys(auto).length === 0) return manual;
  return { ...auto, ...manual };
}

// ============================================================
// MAIN PARSER
// ============================================================

/**
 * Parse a text blob against a tool definition.
 * Merges auto-generated rules from the definition structure with
 * any hand-written parseRules (hand-written override on conflict).
 *
 * @param {string} text - Raw findings text
 * @param {Object} definition - Tool definition
 * @returns {{ formState: Object, matched: string[], unmatched: string[], remainder: string }}
 */
export function parseFindings(text, definition) {
  const autoRules = buildParseRules(definition);
  const rules = mergeRules(autoRules, definition.parseRules);

  if (!rules || Object.keys(rules).length === 0 || !text) {
    return { formState: {}, matched: [], unmatched: [], remainder: text || '' };
  }

  const normalized = text.toLowerCase();
  const formState = {};
  const matched = [];
  const unmatched = [];
  const matchedSpans = [];

  for (const [inputId, rule] of Object.entries(rules)) {
    if (rule.pattern) {
      const match = normalized.match(rule.pattern);
      if (match) {
        const value = rule.transform ? rule.transform(match) : match[rule.group || 1];
        if (value != null) {
          formState[inputId] = value;
          matched.push(inputId);
          matchedSpans.push(match[0]);
        }
      } else {
        unmatched.push(inputId);
      }
    } else if (rule.multi) {
      const found = [];
      for (const [optionId, keywords] of Object.entries(rule.options)) {
        const sorted = [...keywords].sort((a, b) => b.length - a.length);
        for (const kw of sorted) {
          if (normalized.includes(kw.toLowerCase())) {
            found.push(optionId);
            matchedSpans.push(kw);
            break;
          }
        }
      }
      if (found.length > 0) {
        formState[inputId] = found;
        matched.push(inputId);
      } else {
        unmatched.push(inputId);
      }
    } else if (rule.options) {
      let bestMatch = null;
      let bestKeyword = '';
      let bestLength = 0;

      for (const [optionId, keywords] of Object.entries(rule.options)) {
        for (const kw of keywords) {
          if (normalized.includes(kw.toLowerCase()) && kw.length > bestLength) {
            bestMatch = optionId;
            bestKeyword = kw;
            bestLength = kw.length;
          }
        }
      }

      if (bestMatch) {
        formState[inputId] = bestMatch;
        matched.push(inputId);
        matchedSpans.push(bestKeyword);
      } else {
        unmatched.push(inputId);
      }
    }
  }

  // Build remainder by stripping all matched spans
  let remainder = text;
  const sortedSpans = [...matchedSpans].sort((a, b) => b.length - a.length);
  for (const span of sortedSpans) {
    const idx = remainder.toLowerCase().indexOf(span.toLowerCase());
    if (idx !== -1) {
      remainder = remainder.slice(0, idx) + remainder.slice(idx + span.length);
    }
  }

  // Strip section label variants
  if (definition.sections) {
    for (const section of definition.sections) {
      const label = section.label.toLowerCase();
      const variants = [label, label + 's', label.replace(/s$/, '')];
      for (const v of variants) {
        const regex = new RegExp('\\b' + escapeRegex(v) + '\\b', 'gi');
        remainder = remainder.replace(regex, '');
      }
    }
  }

  // Clean up remainder
  let phrases = remainder
    .split(/[,;.]+/)
    .map((p) => p.replace(/\b(with|and|in the|in|the|a|an|of|is|are|was|nodule|thyroid|measuring|measures)\b/gi, ''))
    .map((p) => p.replace(/\s{2,}/g, ' ').trim())
    .filter((p) => p.length > 1);

  const cleanRemainder = phrases.join('; ');

  return { formState, matched, unmatched, remainder: cleanRemainder };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
