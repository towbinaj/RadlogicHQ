/**
 * Adrenal Washout Calculator.
 * Computes absolute and relative washout percentages to differentiate
 * lipid-poor adenomas from non-adenomas.
 *
 * Reference: Caoili EM et al. Radiology 2002;222(3):629-633.
 */
export const adrenalWashoutDefinition = {
  id: 'adrenal-washout',
  name: 'Adrenal Washout',
  version: '1.0.0',
  description:
    'Adrenal washout calculator — absolute and relative washout percentages for adrenal lesion characterization.',
  cdeSetId: null,

  sideOptions: [
    { id: 'right', label: 'Right' },
    { id: 'left', label: 'Left' },
  ],

  parseRules: {},
};
