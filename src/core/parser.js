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
  // Bare initialisms like 'us' and 'mr' are intentionally NOT included
  // because the parser uses substring (not word-boundary) matching:
  // 'us' would fire inside 's(us)picion', 'gluteus', 'musculus', etc.,
  // and 'mr' inside 'MRSA', 'MRCP'. Tools that need 'US' / 'MR'
  // abbreviation detection should add a regex-pattern rule with
  // explicit \b boundaries in their own parseRules.
  mammography: ['mammo', 'mammogram'],
  ultrasound: ['sonography', 'sonographic'],
  mri: ['magnetic resonance'],

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
// TEXT EXTRACTION (plain text, XML, RTF)
// ============================================================

const SECTION_RE = /^(?:FINDINGS|IMPRESSION|TECHNIQUE|COMPARISON|CLINICAL\s+(?:INDICATION|HISTORY|INFORMATION)|EXAM(?:INATION)?|PROCEDURE|CONCLUSION|SUMMARY)\s*:/im;

/**
 * Extract parseable text from various input formats.
 * Supports:
 *  - Plain text (returned as-is)
 *  - PowerScribe XML (<PortalAutoTextExport> with <ContentText>)
 *  - Raw XML with <ContentText> tags
 *
 * For structured reports, extracts the FINDINGS section if present.
 * @param {string} raw - Raw input (plain text or XML)
 * @returns {string} Extracted text ready for parsing
 */
export function extractText(raw) {
  if (!raw || !raw.trim()) return '';
  const trimmed = raw.trim();

  // Detect XML by leading angle bracket or XML declaration
  if (trimmed.startsWith('<')) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(trimmed, 'text/xml');
      if (!doc.querySelector('parsererror')) {
        // Try <ContentText> (PowerScribe format)
        const contentEls = doc.querySelectorAll('ContentText');
        if (contentEls.length > 0) {
          // Concatenate all ContentText nodes (multiple AutoTexts)
          const texts = [...contentEls].map((el) => el.textContent.trim()).filter(Boolean);
          const combined = texts.join('\n\n');
          return extractFindingsSection(combined);
        }
        // Fallback: grab all text content from the XML
        const allText = doc.documentElement.textContent.trim();
        if (allText) return extractFindingsSection(allText);
      }
    } catch {
      // Not valid XML — fall through to plain text
    }
  }

  // Detect RadAI structured format: [STRUCTURED REPORT] ... [END STRUCTURED REPORT]
  if (trimmed.includes('[STRUCTURED REPORT]')) {
    const match = trimmed.match(/\[STRUCTURED REPORT\]([\s\S]*?)(?:\[END STRUCTURED REPORT\]|$)/i);
    if (match) {
      // Strip bracket headers and convert Key: Value to parseable text
      let body = match[1].trim();
      body = body.replace(/^\[.*?\]$/gm, '').trim();
      return body;
    }
  }

  return trimmed;
}

/**
 * Pull out the FINDINGS section from a structured report.
 * If no FINDINGS header is found, returns the full text.
 */
function extractFindingsSection(text) {
  // Also handle RadAI bracket format within extracted text
  if (text.includes('[STRUCTURED REPORT]')) {
    const match = text.match(/\[STRUCTURED REPORT\]([\s\S]*?)(?:\[END STRUCTURED REPORT\]|$)/i);
    if (match) {
      let body = match[1].trim();
      body = body.replace(/^\[.*?\]$/gm, '').trim();
      return body;
    }
  }

  const findingsMatch = text.match(/\bFINDINGS\s*:([\s\S]*)/i);
  if (!findingsMatch) return text;

  let findings = findingsMatch[1];
  // Truncate at the next section header (IMPRESSION, CONCLUSION, etc.)
  const nextSection = findings.match(/\n\s*(?:IMPRESSION|CONCLUSION|SUMMARY|TECHNIQUE|COMPARISON|CLINICAL\s+(?:INDICATION|HISTORY))\s*:/i);
  if (nextSection) {
    findings = findings.slice(0, nextSection.index);
  }
  return findings.trim();
}

// ============================================================
// MAIN PARSER
// ============================================================

/**
 * Parse a text blob against a tool definition.
 * Merges auto-generated rules from the definition structure with
 * any hand-written parseRules (hand-written override on conflict).
 *
 * Accepts plain text, PowerScribe XML, or any format supported by extractText().
 *
 * @param {string} text - Raw findings text (or XML)
 * @param {Object} definition - Tool definition
 * @returns {{ formState: Object, matched: string[], unmatched: string[], remainder: string }}
 */
export function parseFindings(text, definition) {
  const extracted = extractText(text);
  const autoRules = buildParseRules(definition);
  const rules = mergeRules(autoRules, definition.parseRules);

  if (!rules || Object.keys(rules).length === 0 || !extracted) {
    return { formState: {}, matched: [], unmatched: [], remainder: extracted || '' };
  }

  const normalized = extracted.toLowerCase();
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
      for (const [optionId, spec] of Object.entries(rule.options)) {
        // Each option is either:
        //   - a string[] of keywords (legacy / auto-generated shape)
        //   - an object { keywords?: string[], patterns?: [{re, test?}] }
        // Patterns are checked first (more specific) against the original
        // case-sensitive extracted text, so a size threshold test can see
        // the raw digits. Keywords fall back to substring matching on the
        // lowercased text.
        let optMatched = false;
        let optSpan = '';

        if (Array.isArray(spec)) {
          // Legacy: array of keyword strings
          const sorted = [...spec].sort((a, b) => b.length - a.length);
          for (const kw of sorted) {
            if (normalized.includes(kw.toLowerCase())) {
              optMatched = true;
              optSpan = kw;
              break;
            }
          }
        } else if (spec && typeof spec === 'object') {
          // New: {keywords, patterns}
          if (Array.isArray(spec.patterns)) {
            for (const p of spec.patterns) {
              const m = extracted.match(p.re);
              if (m && (typeof p.test !== 'function' || p.test(m))) {
                optMatched = true;
                optSpan = m[0];
                break;
              }
            }
          }
          if (!optMatched && Array.isArray(spec.keywords)) {
            const sorted = [...spec.keywords].sort((a, b) => b.length - a.length);
            for (const kw of sorted) {
              if (normalized.includes(kw.toLowerCase())) {
                optMatched = true;
                optSpan = kw;
                break;
              }
            }
          }
        }

        if (optMatched) {
          found.push(optionId);
          matchedSpans.push(optSpan);
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
  let remainder = extracted;
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

  // Clean up remainder.
  //
  // Splitting:
  //   - Split on commas, semicolons, and periods — BUT not on a period that
  //     sits between two digits (so "1.5 cm" stays together).
  //   - Also split on newlines.
  //
  // Stopwords removed inside each phrase: common connective words that are
  // meaningless on their own when the surrounding clinical terms have been
  // stripped out as matched spans. The list is conservative — aggressively
  // removing medical terms would erase useful context.
  //
  // Dropped phrases:
  //   - shorter than 3 characters after cleanup
  //   - entirely numeric / punctuation (e.g. "1", "5 cm" left behind after
  //     stripping a finding)
  //   - all-stopword fragments
  const STOPWORDS_RE = /\b(with|and|also|additionally|further|furthermore|moreover|in\s+the|in|on|the|a|an|of|at|is|are|was|were|has|have|had|show|shows|showing|shown|demonstrate|demonstrates|demonstrated|contain|contains|reveal|reveals|exhibits?|otherwise|unremarkable|normal|each|both|either|neither|this|that|these|those|it|its|same|other|kidneys?|adrenals?|ovar(?:y|ies)|breasts?|lungs?|hips?|contralateral|ipsilateral|measuring|measures?|approximately|approx|about|noted|seen|identified|present|present)\b/gi;
  const JUNK_RE = /^[\s\d.\-,;]*$/;

  let phrases = remainder
    // Split on , ; \n — but a period only if NOT between two digits
    .split(/[,;\n]+|\.(?!\d)(?!\s*\d)/)
    .map((p) => p.replace(STOPWORDS_RE, ''))
    .map((p) => p.replace(/\s{2,}/g, ' ').trim())
    .filter((p) => p.length > 2 && !JUNK_RE.test(p));

  // Dedupe phrases (same text can appear from multiple segments)
  const seen = new Set();
  phrases = phrases.filter((p) => {
    const key = p.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const cleanRemainder = phrases.join('; ');

  return { formState, matched, unmatched, remainder: cleanRemainder };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================
// SEGMENTATION LAYER (Phase 1)
//
// parseSegmentedFindings() takes a findings-text blob and a definition,
// and — if the definition opts in via `parseSegmentation` — splits the
// text into regions by laterality or item index before running the
// existing parseFindings() on each region.
//
// Tools that don't opt in (no `parseSegmentation` field) behave exactly
// as before: the whole text is parsed as a single region via parseFindings.
//
// Return shape:
//   {
//     segments: [
//       { key, label, index?, text, formState, matched, unmatched, remainder },
//       ...
//     ],
//     ungrouped: { text, formState, matched, unmatched, remainder },
//     remainder: 'combined remainder from all segments'
//   }
//
// `segments[i].formState` is the usual flat parseFindings output for that
// segment's text. The caller decides how to route it (e.g. AAST Kidney
// routes `key: 'right'` → formState.right, `key: 'left'` → formState.left).
//
// Text with no markers goes into `ungrouped` so the caller can decide
// whether to apply it to the currently-active side/item or leave it alone.
// ============================================================

// Laterality marker patterns. Used to classify each sentence as right,
// left, or bilateral. Order matters: bilateral patterns are checked first
// so "bilateral kidneys" doesn't get misclassified as "left kidney"
// because it contains "left" as a substring. (Actually "bilateral" doesn't
// contain "left" but keep the ordering for safety with future patterns.)
// Bilateral marker patterns. The alternations cover:
//   a) Prefix plural:   "bilateral kidneys", "both kidneys", "bilaterally"
//   b) Conjunction:     "the right and left kidneys (both show...)"
//   c) Postposed plural: "the kidneys each have", "the kidneys both show"
//   d) Copula plural:   "the kidneys are both enlarged", "kidneys have each"
//   e) Prepositional:   "each of the kidneys", "both of the kidneys"
//   f) Distributive singular: "each kidney", "both kidneys"
//
// Organ list is kept in sync with RIGHT_RE / LEFT_RE. Covers the
// abdominal/pelvic/thoracic organs from Phase 1 plus MSK joints
// (knees/hips/shoulders/etc.) added for the Phase 2 K-L / hip-
// dysplasia / fetal-ventricle rollouts. Two keyword lists:
//   ORGANS_PLURAL  -- "the kidneys / knees / shoulders"
//   ORGANS_SINGULAR -- "kidney / knee / shoulder"
const BILATERAL_RE = new RegExp(
  [
    // a) Prefix: "bilateral kidneys", "both kidneys"
    String.raw`\b(?:bilateral|both)\s+(?:kidneys|sides|adrenals|ovaries|breasts|lungs|hips|knees|shoulders|elbows|wrists|ankles|hands|feet|joints|ventricles|organs)\b`,
    String.raw`\bbilaterally\b`,
    // b) Conjunction: "right and left kidneys"
    String.raw`\b(?:right\s+and\s+left|left\s+and\s+right)\s+(?:kidneys|adrenals|ovaries|breasts|lungs|hips|knees|shoulders|elbows|wrists|ankles|hands|feet|joints|ventricles|sides|organs)\b`,
    // c) Postposed: "kidneys each", "kidneys both"
    String.raw`\b(?:kidneys|adrenals|ovaries|breasts|lungs|hips|knees|shoulders|elbows|wrists|ankles|hands|feet|joints|ventricles)\s+(?:each|both)\b`,
    // d) Copula: "kidneys are/have/show/demonstrate both|each"
    String.raw`\b(?:kidneys|adrenals|ovaries|breasts|lungs|hips|knees|shoulders|elbows|wrists|ankles|hands|feet|joints|ventricles)\s+(?:are|have|show|shows|demonstrate|demonstrates|contain|reveal|exhibit)\s+(?:each|both)\b`,
    // e) Prepositional: "each of the kidneys", "both of the kidneys"
    String.raw`\b(?:each|both)\s+of\s+(?:the\s+)?(?:kidneys|adrenals|ovaries|breasts|lungs|hips|knees|shoulders|elbows|wrists|ankles|hands|feet|joints|ventricles)\b`,
    // f) Distributive singular: "each kidney"
    String.raw`\beach\s+(?:kidney|adrenal|ovary|breast|lung|hip|knee|shoulder|elbow|wrist|ankle|hand|foot|joint|ventricle)\b`,
  ].join('|'),
  'i'
);
const RIGHT_RE = /\b(?:the\s+)?right\s+(?:kidney|adrenal|ovary|breast|lung|hip|knee|shoulder|elbow|wrist|ankle|hand|foot|joint|ventricle|side|organ)s?\b|\bon\s+the\s+right\b|\brt\.?\s+(?:kidney|adrenal|ovary|breast|lung|hip|knee|shoulder|elbow|wrist|ankle|hand|foot|joint|ventricle|side)\b|(?:^|\n)\s*(?:the\s+)?right\s*:/i;
const LEFT_RE = /\b(?:the\s+)?left\s+(?:kidney|adrenal|ovary|breast|lung|hip|knee|shoulder|elbow|wrist|ankle|hand|foot|joint|ventricle|side|organ)s?\b|\bon\s+the\s+left\b|\blt\.?\s+(?:kidney|adrenal|ovary|breast|lung|hip|knee|shoulder|elbow|wrist|ankle|hand|foot|joint|ventricle|side)\b|(?:^|\n)\s*(?:the\s+)?left\s*:/i;

// Cross-reference tokens: flip the current side for this sentence only.
const CONTRALATERAL_RE = /\bcontralateral\b|\bthe\s+(?:other|opposite)\s+(?:kidney|side|adrenal|organ)\b|\bon\s+the\s+other\s+side\b/i;

// "Ipsilateral" / "same side" → keep current side (explicit reinforcement).
const IPSILATERAL_RE = /\bipsilateral\b|\bthe\s+same\s+(?:side|kidney|organ)\b/i;

/**
 * Split text into sentences. Medical radiology text has tricky edge cases
 * (decimals like "2.5 cm", abbreviations), so we use a conservative regex:
 *   - Split on period / ! / ? followed by whitespace + uppercase letter
 *   - Split on newlines
 * This won't split "2.5 cm" because "cm" is lowercase. It may misfire on
 * abbreviations like "Dr. Smith" but those rarely appear in findings text.
 *
 * Exported so tools that want per-sentence preservation (e.g. putting
 * unmatched sentences into Additional Findings verbatim) can reuse the
 * same tokenization that the laterality segmenter uses.
 */
export function splitSentences(text) {
  if (!text || !text.trim()) return [];
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z])|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Classify a single sentence for laterality routing.
 * Returns an object with zero or more of:
 *   - `bilateral: true`     — mentions bilateral/both → apply to both sides
 *   - `explicit: 'right'|'left'` — explicit side marker → set current + apply
 *   - `contralateral: true` — "contralateral" / "the other kidney" → flip
 *   - `ipsilateral: true`   — "ipsilateral" / "same side" → keep current
 * Plus the original `sentence` string.
 */
function classifySentenceLaterality(sentence) {
  const cls = { sentence };
  // Order matters: check bilateral FIRST so "bilateral" doesn't get
  // shadowed by any accidental right/left substring match.
  if (BILATERAL_RE.test(sentence)) {
    cls.bilateral = true;
    return cls;
  }
  const hasRight = RIGHT_RE.test(sentence);
  const hasLeft = LEFT_RE.test(sentence);
  if (hasRight && hasLeft) {
    // "The right and left kidneys both show..." — treat as bilateral
    cls.bilateral = true;
    return cls;
  }
  if (hasRight) {
    cls.explicit = 'right';
    return cls;
  }
  if (hasLeft) {
    cls.explicit = 'left';
    return cls;
  }
  if (CONTRALATERAL_RE.test(sentence)) {
    cls.contralateral = true;
    return cls;
  }
  if (IPSILATERAL_RE.test(sentence)) {
    cls.ipsilateral = true;
    return cls;
  }
  return cls;
}

/**
 * Segment text by laterality using sentence-level classification.
 *
 * Phase 1.1 upgrade over Phase 1:
 *   - Walks text sentence-by-sentence, classifying each independently
 *   - Sticky attribution: a sentence with no marker inherits the current
 *     side from the most recent sentence that had one
 *   - `contralateral` / "the other kidney" flip the side for that sentence
 *   - `ipsilateral` / "same side" reinforce the current side
 *   - `bilateral` / `both kidneys` produce entries in BOTH right and left
 *     segments (caller no longer sees a 'bilateral' key)
 *   - Text before the first side-bearing sentence goes to `ungrouped`
 *
 * Returns: { segments: [{key, label, text}, ...], ungroupedText: string }
 * where key is 'right' or 'left' only.
 */
export function segmentByLaterality(text) {
  const sentences = splitSentences(text);
  if (sentences.length === 0) {
    return { segments: [], ungroupedText: '' };
  }

  const rightParts = [];
  const leftParts = [];
  const ungroupedParts = [];
  let currentSide = null; // 'right' | 'left' | null — most recent sticky side

  for (const raw of sentences) {
    const cls = classifySentenceLaterality(raw);

    if (cls.bilateral) {
      // Apply to both sides. Bilateral sentences do NOT change the sticky
      // `currentSide` — an explicit side later should still take over.
      rightParts.push(cls.sentence);
      leftParts.push(cls.sentence);
      continue;
    }

    if (cls.explicit) {
      currentSide = cls.explicit;
      (currentSide === 'right' ? rightParts : leftParts).push(cls.sentence);
      continue;
    }

    if (cls.contralateral && currentSide) {
      // Flip for this sentence only; sticky side stays the same so a
      // subsequent plain sentence still inherits the original side.
      const flipped = currentSide === 'right' ? 'left' : 'right';
      (flipped === 'right' ? rightParts : leftParts).push(cls.sentence);
      continue;
    }

    if (cls.ipsilateral && currentSide) {
      (currentSide === 'right' ? rightParts : leftParts).push(cls.sentence);
      continue;
    }

    // No marker: inherit sticky side. If none yet, drop to ungrouped.
    if (currentSide) {
      (currentSide === 'right' ? rightParts : leftParts).push(cls.sentence);
    } else {
      ungroupedParts.push(cls.sentence);
    }
  }

  const segments = [];
  if (rightParts.length > 0) {
    segments.push({ key: 'right', label: 'Right', text: rightParts.join(' ') });
  }
  if (leftParts.length > 0) {
    segments.push({ key: 'left', label: 'Left', text: leftParts.join(' ') });
  }

  return { segments, ungroupedText: ungroupedParts.join(' ') };
}

const WORD_TO_NUMBER = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5,
  sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
};

/**
 * Segment text by numbered item markers (Nodule 1, Nodule 2, etc).
 * `itemLabel` is the word that precedes the number (default: "item"),
 * e.g. 'Nodule', 'Target', 'Observation', 'Lesion'.
 */
export function segmentByItemIndex(text, itemLabel = 'item') {
  const label = escapeRegex(itemLabel);
  const markers = [];

  // "Nodule 1", "nodule #1", "nodule 1:"
  const rxExplicit = new RegExp(`\\b${label}\\s*#?\\s*(\\d+)\\s*:?`, 'gi');
  let m;
  while ((m = rxExplicit.exec(text)) !== null) {
    markers.push({ pos: m.index, endPos: m.index + m[0].length, index: parseInt(m[1], 10) });
  }

  // "First nodule", "second nodule"
  const rxWord = new RegExp(`\\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\\s+${label}\\b`, 'gi');
  while ((m = rxWord.exec(text)) !== null) {
    const idx = WORD_TO_NUMBER[m[1].toLowerCase()];
    if (idx) markers.push({ pos: m.index, endPos: m.index + m[0].length, index: idx });
  }

  // Numbered line starts: "1." "(1)" "2." "(2)"
  const rxLine = /(?:^|\n)\s*(?:\((\d+)\)|(\d+)\.)\s/g;
  while ((m = rxLine.exec(text)) !== null) {
    const idx = parseInt(m[1] || m[2], 10);
    // Advance past the leading newline so we don't claim it as the marker
    const pos = m.index + (text[m.index] === '\n' ? 1 : 0);
    markers.push({ pos, endPos: m.index + m[0].length, index: idx });
  }

  markers.sort((a, b) => a.pos - b.pos);

  // Drop overlapping markers
  const deduped = [];
  for (const mk of markers) {
    const last = deduped[deduped.length - 1];
    if (last && mk.pos < last.endPos) continue;
    deduped.push(mk);
  }

  if (deduped.length === 0) {
    return { segments: [], ungroupedText: text.trim() };
  }

  const ungroupedText = text.slice(0, deduped[0].pos).trim();
  const raw = [];
  for (let i = 0; i < deduped.length; i++) {
    const start = deduped[i].endPos;
    const end = i + 1 < deduped.length ? deduped[i + 1].pos : text.length;
    const segText = text.slice(start, end).trim();
    if (segText) raw.push({ index: deduped[i].index, text: segText });
  }

  // Merge same-index segments
  const mergedMap = new Map();
  for (const seg of raw) {
    const prev = mergedMap.get(seg.index);
    mergedMap.set(seg.index, prev ? prev + '\n' + seg.text : seg.text);
  }

  const segments = [];
  for (const [index, segText] of mergedMap) {
    segments.push({ key: `item-${index}`, index, label: `${itemLabel} ${index}`, text: segText });
  }
  segments.sort((a, b) => a.index - b.index);

  return { segments, ungroupedText };
}

/**
 * Parse a findings blob into segmented + ungrouped regions, each with its
 * own parseFindings() output. Driven by `definition.parseSegmentation`:
 *
 *   parseSegmentation: { type: 'laterality' }
 *   parseSegmentation: { type: 'itemIndex', itemLabel: 'Nodule' }
 *
 * If no `parseSegmentation` is set, the whole text goes to `ungrouped` and
 * `segments` is empty — effectively equivalent to calling parseFindings
 * directly, for backward compatibility.
 */
export function parseSegmentedFindings(text, definition) {
  const extracted = extractText(text) || '';
  const config = definition.parseSegmentation;

  let segmenterResult;
  if (!config || !config.type) {
    segmenterResult = { segments: [], ungroupedText: extracted };
  } else if (config.type === 'laterality') {
    segmenterResult = segmentByLaterality(extracted);
  } else if (config.type === 'itemIndex') {
    segmenterResult = segmentByItemIndex(extracted, config.itemLabel || 'item');
  } else {
    segmenterResult = { segments: [], ungroupedText: extracted };
  }

  // Run parseFindings on each segment
  const segments = segmenterResult.segments.map((seg) => {
    const parsed = parseFindings(seg.text, definition);
    return {
      key: seg.key,
      label: seg.label,
      ...(seg.index != null ? { index: seg.index } : {}),
      text: seg.text,
      formState: parsed.formState,
      matched: parsed.matched,
      unmatched: parsed.unmatched,
      remainder: parsed.remainder,
    };
  });

  const ungroupedBlob = segmenterResult.ungroupedText || '';
  const ungroupedParsed = ungroupedBlob
    ? parseFindings(ungroupedBlob, definition)
    : { formState: {}, matched: [], unmatched: [], remainder: '' };

  const ungrouped = {
    text: ungroupedBlob,
    formState: ungroupedParsed.formState,
    matched: ungroupedParsed.matched,
    unmatched: ungroupedParsed.unmatched,
    remainder: ungroupedParsed.remainder,
  };

  const allRemainders = [
    ...segments.map((s) => s.remainder).filter(Boolean),
    ungrouped.remainder,
  ].filter(Boolean);

  // Per-sentence preservation: split the ORIGINAL text into sentences and
  // check each one against the full definition. Sentences with zero matches
  // are preserved verbatim — they're typically clinical context the user
  // wants in Additional Findings (negative findings like "otherwise
  // unremarkable", report headers like "CT abdomen and pelvis", or free-text
  // observations the parser has no rule for).
  //
  // Running parseFindings per-sentence is O(N_sentences × N_rules) but both
  // numbers are small for typical radiology reports (< 20 × < 50), so it's
  // cheap. This is the cleanest way to avoid dumping word-fragment garbage
  // into Additional Findings.
  const unmatchedSentences = [];
  for (const sentence of splitSentences(extracted)) {
    const r = parseFindings(sentence, definition);
    if (!r.matched || r.matched.length === 0) {
      unmatchedSentences.push(sentence);
    }
  }

  return {
    segments,
    ungrouped,
    remainder: allRemainders.join('; '),
    unmatchedSentences,
  };
}
