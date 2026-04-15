/**
 * RECIST 1.1 — Response Evaluation Criteria in Solid Tumors.
 * Longitudinal comparison: baseline vs current measurements.
 *
 * Reference: Eisenhauer EA et al. Eur J Cancer 2009;45(2):228-247.
 */
export const recistDefinition = {
  id: 'recist',
  name: 'RECIST 1.1',
  version: '1.0.0',
  description:
    'RECIST 1.1 — response evaluation criteria in solid tumors for oncologic treatment response assessment.',
  cdeSetId: null,

  nonTargetOptions: [
    { id: 'absent', label: 'Absent (CR)', tooltip: 'All non-target lesions have disappeared' },
    { id: 'present', label: 'Present (non-CR/non-PD)', tooltip: 'Persistence of one or more non-target lesions' },
    { id: 'progression', label: 'Unequivocal Progression', tooltip: 'Unequivocal progression of existing non-target lesions' },
  ],

  newLesionOptions: [
    { id: 'no', label: 'No' },
    { id: 'yes', label: 'Yes', tooltip: 'Any new lesion = progressive disease' },
  ],

  // Multi-target pastes like "Target 1: ... Target 2: ..." (or numbered
  // "1. ... 2. ..." / "first target: ...") split into per-target
  // segments. The parse handler populates each target's organ + current
  // measurement from its segment.
  parseSegmentation: { type: 'itemIndex', itemLabel: 'Target' },

  parseRules: {
    // Per-target long-axis measurement (routed to target.current in the
    // handler -- baseline / nadir carry over from prior reports).
    size: {
      pattern: /(\d*\.?\d+)\s*mm/,
      group: 1,
      transform: (m) => parseFloat(m[1]),
    },

    // Per-target organ. ID strings are capitalized because they feed
    // directly into target.organ (a free-text input), so what the parser
    // sets is what the user sees.
    organ: {
      options: {
        'Liver': ['liver', 'hepatic'],
        'Lung': ['lung lesion', 'lung metastasis', 'pulmonary metastasis', 'pulmonary nodule', 'pulmonary'],
        'Lymph node': ['lymph node', 'nodal', 'adenopathy', 'lymphadenopathy'],
        'Bone': ['osseous lesion', 'bone lesion', 'bone metastasis', 'osseous metastasis', 'osseous'],
        'Brain': ['brain lesion', 'brain metastasis', 'cerebral lesion', 'intracranial lesion'],
        'Kidney': ['renal lesion', 'renal mass', 'kidney lesion'],
        'Adrenal': ['adrenal'],
        'Spleen': ['splenic lesion', 'spleen lesion'],
        'Pancreas': ['pancreas lesion', 'pancreatic lesion', 'pancreatic mass'],
        'Peritoneum': ['peritoneal', 'peritoneum'],
        'Pleura': ['pleural', 'pleura'],
        'Mediastinum': ['mediastinal', 'mediastinum'],
        'Soft tissue': ['soft tissue'],
      },
    },

    nonTarget: {
      options: {
        'absent': ['non-target absent', 'nontarget absent', 'non-target cr', 'complete response non-target'],
        'present': ['non-target present', 'nontarget present', 'residual non-target'],
        'progression': ['non-target progression', 'nontarget progression', 'unequivocal progression'],
      },
    },
    newLesion: {
      options: {
        'no': ['no new lesion', 'no new lesions', 'no new metastasis', 'no new metastases'],
        'yes': ['new lesion', 'new lesions', 'new metastasis', 'new metastases'],
      },
    },
  },
};
