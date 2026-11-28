/**
 * Deauville Criteria (5-Point Scale) — PET/CT response assessment for lymphoma.
 * Visual comparison of lesion FDG uptake to reference structures.
 *
 * Reference: Meignan M et al. J Clin Oncol 2009;27(11):1746-1747.
 * Barrington SF et al. J Clin Oncol 2014;32(27):3048-3058.
 */
export const deauvilleDefinition = {
  id: 'deauville',
  name: 'Deauville',
  version: '1.0.0',
  description:
    'Deauville 5-point scale — PET/CT response assessment for FDG-avid lymphoma.',
  cdeSetId: null,

  scores: [
    {
      id: '1',
      label: '1 - No Uptake',
      shortLabel: '1',
      tooltip: 'No uptake above background',
      interpretation: 'Complete metabolic response',
      management: 'No residual metabolically active disease.',
      image: '/images/deauville/score-1.svg',
    },
    {
      id: '2',
      label: '2 - Uptake <= Mediastinum',
      shortLabel: '2',
      tooltip: 'Uptake less than or equal to mediastinal blood pool',
      interpretation: 'Complete metabolic response',
      management: 'No residual metabolically active disease.',
      image: '/images/deauville/score-2.svg',
    },
    {
      id: '3',
      label: '3 - Uptake > Mediastinum, <= Liver',
      shortLabel: '3',
      tooltip: 'Uptake greater than mediastinal blood pool but less than or equal to liver',
      interpretation: 'Complete metabolic response (in most protocols)',
      management: 'Likely complete response. Interpretation may vary by protocol (interim vs end-of-treatment).',
      image: '/images/deauville/score-3.svg',
    },
    {
      id: '4',
      label: '4 - Uptake Moderately > Liver',
      shortLabel: '4',
      tooltip: 'Uptake moderately greater than liver at any site',
      interpretation: 'Partial metabolic response / residual disease',
      management: 'Residual metabolically active disease. Consider treatment modification per protocol.',
      image: '/images/deauville/score-4.svg',
    },
    {
      id: '5',
      label: '5 - Uptake Markedly > Liver and/or New Lesions',
      shortLabel: '5',
      tooltip: 'Uptake markedly greater than liver and/or new sites of disease',
      interpretation: 'No metabolic response / progressive disease',
      management: 'Progressive or treatment-refractory disease.',
      image: '/images/deauville/score-5.svg',
    },
  ],

  // New lesion flag (separate from score 5)
  newLesionOptions: [
    { id: 'no', label: 'No' },
    { id: 'yes', label: 'Yes' },
  ],

  // Timing
  // Lugano 2014: for Deauville 4-5 the response depends on uptake compared
  // with the baseline PET.
  baselineOptions: [
    { id: 'decreased', label: 'Decreased', tooltip: 'Reduced uptake compared with baseline (PMR for Deauville 4-5)' },
    { id: 'unchanged', label: 'No significant change', tooltip: 'No significant change from baseline (NMR for Deauville 4-5)' },
    { id: 'increased', label: 'Increased', tooltip: 'Increased uptake compared with baseline (PMD for Deauville 4-5)' },
  ],

  timingOptions: [
    { id: 'interim', label: 'Interim (mid-treatment)', tooltip: 'PET performed during treatment (e.g., after 2 cycles)' },
    { id: 'eot', label: 'End of Treatment', tooltip: 'PET performed at completion of therapy' },
    { id: 'surveillance', label: 'Surveillance', tooltip: 'Post-treatment follow-up PET' },
  ],

  parseRules: {
    score: {
      options: {
        '1': ['no uptake', 'deauville 1', 'no fdg uptake', 'no metabolic activity'],
        '2': ['uptake <= mediastinum', 'uptake less than mediastinum', 'below mediastinal', 'deauville 2'],
        '3': ['uptake > mediastinum', 'above mediastinal', 'below liver', 'deauville 3'],
        '4': ['uptake moderately above liver', 'moderately greater than liver', 'moderately > liver', 'deauville 4'],
        '5': ['uptake markedly above liver', 'markedly greater than liver', 'markedly > liver', 'new lesions', 'deauville 5'],
      },
    },
    baseline: {
      options: {
        'decreased': ['decreased compared with baseline', 'decreased uptake', 'decreased compared to baseline', 'decreased from baseline', 'reduced compared with baseline', 'reduced uptake', 'less avid than baseline'],
        'unchanged': ['unchanged from baseline', 'unchanged uptake', 'unchanged compared with baseline', 'unchanged compared to baseline', 'no significant change from baseline', 'stable uptake'],
        'increased': ['increased compared with baseline', 'increased uptake', 'increased fdg uptake', 'increased compared to baseline', 'increased from baseline', 'more avid than baseline'],
      },
    },
    newLesion: {
      options: {
        'yes': ['new lesion', 'new lesions', 'new fdg-avid', 'new focus', 'new foci'],
        'no': ['no new lesion', 'no new lesions', 'no new fdg-avid'],
      },
    },
    timing: {
      options: {
        'interim': ['interim', 'mid-treatment', 'after 2 cycles', 'interim pet'],
        'eot': ['end of treatment', 'end-of-treatment', 'post-treatment', 'completion of therapy'],
        'surveillance': ['surveillance', 'follow-up pet', 'routine pet'],
      },
    },
  },
};
